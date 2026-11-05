import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FilePlus2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SceneList } from '@/components/SceneList'
import { SceneEditor } from '@/components/SceneEditor'
import type { Project, Scene, SceneDraft } from '@/types'

interface ProjectDetailViewProps {
  project: Project
  scenes: Scene[] // 已按 order 升序
  currentSceneId: string | null
  onAddScene: () => void
  onSaveScene: (sceneId: string, draft: SceneDraft) => boolean
  /** 切换场次的统一守卫入口；脏态下由 App 弹确认，无脏态直接执行。 */
  guardSelectScene: (sceneId: string) => void
  /** 返回工作台的统一守卫入口；脏态下由 App 弹确认，无脏态直接执行。 */
  guardBack: () => void
  /** 上报各场次脏态，供 App 层导航守卫与列表「未保存」标记使用。 */
  onDirtyChange: (sceneId: string, dirty: boolean) => void
  dirtySceneIds: Set<string>
}

export function ProjectDetailView({
  project,
  scenes,
  currentSceneId,
  onAddScene,
  onSaveScene,
  guardSelectScene,
  guardBack,
  onDirtyChange,
  dirtySceneIds,
}: ProjectDetailViewProps) {
  const { t } = useTranslation()
  const currentScene = scenes.find((scene) => scene.id === currentSceneId) ?? null
  const handleDirtyChange = useCallback(onDirtyChange, [onDirtyChange])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={guardBack} aria-label={t('project.aria_back')}>
          <ArrowLeft size={17} />
          {t('project.back')}
        </Button>
        <Button onClick={onAddScene} aria-label={t('project.aria_add_scene')}>
          <FilePlus2 size={17} />
          {t('project.add_scene')}
        </Button>
      </div>

      <h1 className="mt-4 text-2xl font-extrabold text-charcoal-900">{project.name}</h1>

      {scenes.length === 0 ? (
        <section className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-charcoal-900/15 bg-rice-50 px-6 py-14 text-center shadow-card">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-chili-50 text-chili-500">
            <FilePlus2 size={28} />
          </span>
          <h2 className="mt-5 text-xl font-bold text-charcoal-900">{t('project.empty_scene_title')}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-charcoal-500">{t('project.empty_scene_desc')}</p>
          <Button className="mt-6" onClick={onAddScene}>
            <FilePlus2 size={18} />
            {t('project.add_scene')}
          </Button>
        </section>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <SceneList
              scenes={scenes}
              currentSceneId={currentSceneId}
              dirtySceneIds={dirtySceneIds}
              onSelect={(sceneId) => {
                if (sceneId !== currentSceneId) guardSelectScene(sceneId)
              }}
            />
          </aside>
          <section className="rounded-3xl border border-charcoal-900/5 bg-rice-50 p-5 shadow-card lg:p-7">
            {currentScene ? (
              <SceneEditor
                key={currentScene.id}
                scene={currentScene}
                onSave={onSaveScene}
                onDirtyChange={handleDirtyChange}
              />
            ) : (
              <p className="text-sm text-charcoal-500">{t('project.empty_scene_desc')}</p>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
