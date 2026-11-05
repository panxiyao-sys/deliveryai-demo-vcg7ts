// 剧创平台领域类型：Project → Scene[] 两级，纯前端本地态，无服务端契约。

/** 场次结构化字段（REQ-005 默认集合；除 title 外均可空，自由文本）。 */
export interface Scene {
  id: string // 全局唯一，uid() 生成
  projectId: string // 归属且仅归属一个项目（REQ-004.2）
  order: number // 项目内自增序号，保证稳定排序
  title: string // 场次标题，必填（去空白后非空）
  scene: string // 场景描述（长文本，可空）
  location: string // 地点（可空）
  time: string // 时间：内/外景·日/夜等，自由文本（可空）
  characters: string // 出场人物，自由文本（可空）
  dialogue: string // 对白 / 正文（长文本，可空）
  createdAt: string // ISO 时间戳
  updatedAt: string // ISO 时间戳，保存成功时刷新
}

export interface Project {
  id: string // uid()
  name: string // 项目名称，必填（去空白后非空）
  createdAt: string // ISO 时间戳
  updatedAt: string // ISO 时间戳
}

// ---- 路由 ----
// 两个顶层视图；项目详情通过 hash 参数携带 projectId。
export type ViewName = 'projects' | 'project'

export interface RouteState {
  view: ViewName
  projectId: string | null // view === 'project' 时非空；'projects' 时为 null
}

// ---- 运行时状态 ----
export type StorageMode = 'persistent' | 'memory' // localStorage 可用 / 降级内存态

export interface AppState {
  route: RouteState
  projects: Project[]
  scenes: Scene[] // 归一化全集，按 projectId 归属
  currentSceneId: string | null // 项目详情内当前编辑场次
  storageMode: StorageMode // 持久化可用性（引导探测 + 写入失败后置 memory）
  lastMessage: string // 轻量全局提示，如“已保存”
}

/** 编辑器草稿（未提交），仅存在于组件 state，不进 reducer/持久化。 */
export interface SceneDraft {
  title: string
  scene: string
  location: string
  time: string
  characters: string
  dialogue: string
}

export type AppAction =
  | { type: 'NAVIGATE'; route: RouteState } // 路由变化（含非法纠正后的合法路由）
  | { type: 'CREATE_PROJECT'; name: string } // 校验在调用方保证非空
  | { type: 'ADD_SCENE'; projectId: string }
  | { type: 'SELECT_SCENE'; sceneId: string }
  | { type: 'SAVE_SCENE'; sceneId: string; patch: SceneDraft } // 显式保存，校验 title 非空
  | { type: 'SET_STORAGE_MODE'; mode: StorageMode }
  | { type: 'SET_MESSAGE'; message: string }

/** 本地存储信封（版本化，容错读取）。 */
export interface StorageEnvelope {
  version: 1
  projects: Project[]
  scenes: Scene[]
}

// 输入长度兜底（仅防异常超长，不做严苛业务上限）。
export const TITLE_MAX_LENGTH = 200
export const TEXT_MAX_LENGTH = 10000
