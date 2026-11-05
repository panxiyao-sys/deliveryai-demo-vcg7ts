import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { ProjectsView } from '@/components/ProjectsView'
import { ProjectDetailView } from '@/components/ProjectDetailView'
import { TopBar } from '@/components/TopBar'
import { ConfirmDiscardDialog } from '@/components/ConfirmDiscardDialog'
import { usePersistence, bootstrapStorage } from '@/hooks/usePersistence'
import { initialRouteFromHash, routeToHash, useViewRoute } from '@/hooks/useViewRoute'
import { initialState, projectsRoute, studioReducer } from '@/state/studioReducer'
import type { AppState, RouteState, SceneDraft, StorageMode } from '@/types'

function createInitialState(): AppState {
  const { envelope, mode } = bootstrapStorage()
  const projects = envelope?.projects ?? []
  const scenes = envelope?.scenes ?? []
  const projectExists = (id: string) => projects.some((project) => project.id === id)
  const requested = initialRouteFromHash(projectExists)
  return {
    ...initialState,
    projects,
    scenes,
    storageMode: mode,
    // 深链接命中现有项目则直达详情，否则（非法/旧 hash/失效 id）回落工作台。
    route: requested ?? projectsRoute,
  }
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [state, dispatch] = useReducer(studioReducer, undefined, createInitialState)

  // 各场次未保存脏态（草稿仅存于编辑器，这里只保留脏标记，供守卫与列表标记使用）。
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({})
  const [guardOpen, setGuardOpen] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const projectExists = useCallback(
    (id: string) => state.projects.some((project) => project.id === id),
    [state.projects],
  )

  const handleModeChange = useCallback((mode: StorageMode) => {
    dispatch({ type: 'SET_STORAGE_MODE', mode })
  }, [])

  // 已提交数据变化即持久化；写入失败自动降级 memory。
  usePersistence(state, handleModeChange)

  // 统一导航守卫：无脏态直接执行；有脏态挂起动作并弹确认。
  const runGuarded = useCallback((action: () => void) => {
    const hasDirty = Object.values(dirtyMap).some(Boolean)
    if (!hasDirty) {
      action()
      return
    }
    pendingActionRef.current = action
    setGuardOpen(true)
  }, [dirtyMap])

  // hash 驱动的导航（浏览器前进/后退/手动改地址）；非法/旧/失效地址已在 hook 内纠正为 projects。
  const handleHashNavigate = useCallback((route: RouteState) => {
    runGuarded(() => dispatch({ type: 'NAVIGATE', route }))
  }, [runGuarded])
  useViewRoute(state.route, { onNavigate: handleHashNavigate, projectExists })

  // 「留下继续编辑」：取消挂起导航，并把 hash 回写为当前路由，保证地址与保留视图一致。
  const handleStay = useCallback(() => {
    pendingActionRef.current = null
    setGuardOpen(false)
    if (typeof window !== 'undefined' && window.location.hash !== routeToHash(state.route)) {
      window.history.replaceState(null, '', routeToHash(state.route))
    }
  }, [state.route])

  // 「放弃更改并离开」：丢弃草稿（不保存），执行挂起导航；清掉相关脏标记。
  const handleDiscard = useCallback(() => {
    const action = pendingActionRef.current
    pendingActionRef.current = null
    setGuardOpen(false)
    setDirtyMap({})
    action?.()
  }, [])

  // 全局轻提示（如“已保存”）：展示后自动消失。
  const messageTimer = useRef<number | null>(null)
  const notify = useCallback((message: string) => {
    dispatch({ type: 'SET_MESSAGE', message })
    if (messageTimer.current) window.clearTimeout(messageTimer.current)
    messageTimer.current = window.setTimeout(() => dispatch({ type: 'SET_MESSAGE', message: '' }), 2200)
  }, [])
  useEffect(() => () => {
    if (messageTimer.current) window.clearTimeout(messageTimer.current)
  }, [])

  useEffect(() => {
    document.documentElement.lang = i18n.language === 'zh' ? 'zh-CN' : 'en'
    document.title = t('common.title')
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', t('common.meta_desc'))
    try {
      localStorage.setItem('i18nextLng', i18n.language)
    } catch {
      // localStorage 不可用时降级为内存态，不报错不阻塞
    }
  }, [i18n.language, t])

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')
  }

  const createProject = (name: string) => {
    dispatch({ type: 'CREATE_PROJECT', name })
    notify(t('projects.create_success'))
  }

  const openProject = (projectId: string) => {
    const target: RouteState = { view: 'project', projectId }
    runGuarded(() => dispatch({ type: 'NAVIGATE', route: target }))
  }

  const addScene = () => {
    if (state.route.projectId) dispatch({ type: 'ADD_SCENE', projectId: state.route.projectId })
  }

  const guardSelectScene = (sceneId: string) => {
    runGuarded(() => dispatch({ type: 'SELECT_SCENE', sceneId }))
  }

  const guardBack = () => {
    runGuarded(() => dispatch({ type: 'NAVIGATE', route: projectsRoute }))
  }

  const saveScene = (sceneId: string, draft: SceneDraft): boolean => {
    if (draft.title.trim().length === 0) return false
    dispatch({ type: 'SAVE_SCENE', sceneId, patch: draft })
    setDirtyMap((prev) => ({ ...prev, [sceneId]: false }))
    notify(t('scene.saved_feedback'))
    return true
  }

  const handleDirtyChange = useCallback((sceneId: string, dirty: boolean) => {
    setDirtyMap((prev) => (prev[sceneId] === dirty ? prev : { ...prev, [sceneId]: dirty }))
  }, [])

  const activeProject = state.route.view === 'project'
    ? state.projects.find((project) => project.id === state.route.projectId) ?? null
    : null

  const projectScenes = useMemo(() => {
    if (!activeProject) return []
    return state.scenes
      .filter((scene) => scene.projectId === activeProject.id)
      .sort((a, b) => a.order - b.order)
  }, [activeProject, state.scenes])

  // currentSceneId 是运行时 UI 状态、不入库；刷新/深链接进入详情后可能为空，
  // 此时默认选中本项目第一个场次，保证编辑区有内容回显（REQ-005.4 / REQ-006.2）。
  const effectiveCurrentSceneId = useMemo(() => {
    if (projectScenes.length === 0) return null
    const hit = projectScenes.some((scene) => scene.id === state.currentSceneId)
    return hit ? state.currentSceneId : projectScenes[0].id
  }, [projectScenes, state.currentSceneId])

  const dirtySceneIds = useMemo(
    () => new Set(Object.keys(dirtyMap).filter((id) => dirtyMap[id])),
    [dirtyMap],
  )

  return (
    <div className="min-h-screen bg-rice-100 paper-noise">
      <TopBar language={i18n.language} onToggleLanguage={toggleLanguage} />

      {state.storageMode === 'memory' && (
        <div
          role="status"
          aria-label={t('storage.memory_aria')}
          className="flex items-start gap-2 border-b border-amber-400/40 bg-amber-100 px-4 py-2.5 text-sm font-medium text-charcoal-700 lg:px-6"
        >
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-500" />
          <span>{t('storage.memory_banner')}</span>
        </div>
      )}

      {state.route.view === 'projects' || !activeProject ? (
        <ProjectsView
          projects={state.projects}
          scenes={state.scenes}
          onCreateProject={createProject}
          onOpenProject={openProject}
        />
      ) : (
        <ProjectDetailView
          project={activeProject}
          scenes={projectScenes}
          currentSceneId={effectiveCurrentSceneId}
          onAddScene={addScene}
          onSaveScene={saveScene}
          guardSelectScene={guardSelectScene}
          guardBack={guardBack}
          onDirtyChange={handleDirtyChange}
          dirtySceneIds={dirtySceneIds}
        />
      )}

      <ConfirmDiscardDialog
        open={guardOpen}
        onOpenChange={(open) => {
          if (!open) handleStay()
        }}
        onStay={handleStay}
        onDiscard={handleDiscard}
      />

      {state.lastMessage && (
        <div className="pointer-events-none fixed left-1/2 top-20 z-40 -translate-x-1/2 rounded-full bg-charcoal-900/90 px-4 py-2 text-xs font-semibold text-white shadow-float">
          {state.lastMessage}
        </div>
      )}
    </div>
  )
}
