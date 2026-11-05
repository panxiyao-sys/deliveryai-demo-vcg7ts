import { useEffect, useRef } from 'react'
import { loadStudio, saveStudio } from '@/storage/projectStorage'
import type { AppState, StorageEnvelope, StorageMode } from '@/types'

export interface Bootstrap {
  envelope: StorageEnvelope | null
  mode: StorageMode
}

/** 引导时读取一次本地存储（含可用性探测与损坏容错）。 */
export function bootstrapStorage(): Bootstrap {
  return loadStudio()
}

function toEnvelope(state: AppState): StorageEnvelope {
  // 仅持久化已成功保存过的场次：标题为空表示该场次尚停留在新增/未保存阶段（草稿不入库，
  // REQ-006.5 校验失败不写入持久化层）。运行时仍保留该空场次以维持编辑现场，刷新后自然消失。
  const scenes = state.scenes.filter((scene) => scene.title.trim().length > 0)
  return { version: 1, projects: state.projects, scenes }
}

/**
 * 订阅已提交状态（项目/场次）变化并写入存储。
 * - 首次挂载只对齐基线，不回写（避免引导时无意义写入）。
 * - 写入失败置 memory 模式（组件据此显示降级提示），当前会话数据仍在内存中可继续编辑。
 * 所有显式提交（CREATE_PROJECT / ADD_SCENE / SAVE_SCENE）都会改变 projects/scenes 引用，
 * 因此本 effect 即覆盖「创建即持久化」与「显式保存后持久化」，无需组件再命令式写存储。
 */
export function usePersistence(
  state: AppState,
  onModeChange: (mode: StorageMode) => void,
) {
  const baseline = useRef<string>(JSON.stringify(toEnvelope(state)))

  useEffect(() => {
    const envelope = toEnvelope(state)
    const serialized = JSON.stringify(envelope)
    if (serialized === baseline.current) return
    baseline.current = serialized
    const mode = saveStudio(envelope)
    if (mode !== state.storageMode) onModeChange(mode)
    // 仅在已提交数据变化时持久化；storageMode/lastMessage/route 变化不触发写入。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.projects, state.scenes])
}
