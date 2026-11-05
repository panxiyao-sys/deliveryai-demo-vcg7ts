import { uid } from '@/lib/utils'
import type { AppAction, AppState, RouteState, Scene, SceneDraft } from '@/types'

export const projectsRoute: RouteState = { view: 'projects', projectId: null }

export const initialState: AppState = {
  route: projectsRoute,
  projects: [],
  scenes: [],
  currentSceneId: null,
  storageMode: 'persistent',
  lastMessage: '',
}

/** 由草稿构造可编辑字段（用于保存覆盖）。 */
function editableFields(draft: SceneDraft): Pick<Scene, 'title' | 'scene' | 'location' | 'time' | 'characters' | 'dialogue'> {
  return {
    title: draft.title,
    scene: draft.scene,
    location: draft.location,
    time: draft.time,
    characters: draft.characters,
    dialogue: draft.dialogue,
  }
}

/**
 * 剧创 reducer：纯函数、不可变更新。
 * 不读 localStorage、不弹 Dialog、不调 i18n（提示文案在组件层组装），副作用集中在存储层与 hook。
 */
export function studioReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, route: action.route }

    case 'CREATE_PROJECT': {
      const now = new Date().toISOString()
      const project = { id: uid(), name: action.name, createdAt: now, updatedAt: now }
      return {
        ...state,
        projects: [...state.projects, project],
        route: { view: 'project', projectId: project.id },
        currentSceneId: null,
      }
    }

    case 'ADD_SCENE': {
      const now = new Date().toISOString()
      const order = state.scenes
        .filter((scene) => scene.projectId === action.projectId)
        .reduce((max, scene) => Math.max(max, scene.order), -1) + 1
      const scene: Scene = {
        id: uid(),
        projectId: action.projectId,
        order,
        title: '',
        scene: '',
        location: '',
        time: '',
        characters: '',
        dialogue: '',
        createdAt: now,
        updatedAt: now,
      }
      return { ...state, scenes: [...state.scenes, scene], currentSceneId: scene.id }
    }

    case 'SELECT_SCENE':
      return { ...state, currentSceneId: action.sceneId }

    case 'SAVE_SCENE': {
      // 防御性：标题为空（未通过事件层校验）时不写入，保持原 state。
      if (action.patch.title.trim().length === 0) return state
      const now = new Date().toISOString()
      const scenes = state.scenes.map((scene) =>
        scene.id === action.sceneId ? { ...scene, ...editableFields(action.patch), updatedAt: now } : scene,
      )
      const projectId = state.scenes.find((scene) => scene.id === action.sceneId)?.projectId
      const projects = projectId
        ? state.projects.map((project) => (project.id === projectId ? { ...project, updatedAt: now } : project))
        : state.projects
      return { ...state, scenes, projects }
    }

    case 'SET_STORAGE_MODE':
      return state.storageMode === action.mode ? state : { ...state, storageMode: action.mode }

    case 'SET_MESSAGE':
      return { ...state, lastMessage: action.message }

    default:
      return state
  }
}
