import type { StorageEnvelope, StorageMode } from '@/types'

// 单一业务 key：带域前缀与版本，避免与历史偏好 key 冲突；v1 即 StorageEnvelope.version。
export const STORAGE_KEY = 'juchuang.studio.v1'
const ENVELOPE_VERSION = 1

export interface LoadResult {
  envelope: StorageEnvelope | null // null = 无数据/不可用/损坏（已容错）
  mode: StorageMode // persistent | memory
}

export function createEmptyEnvelope(): StorageEnvelope {
  return { version: ENVELOPE_VERSION, projects: [], scenes: [] }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** 校验信封结构；任一字段非法即视为损坏，由调用方回退空态。 */
function isValidEnvelope(value: unknown): value is StorageEnvelope {
  if (!isObject(value)) return false
  if (value.version !== ENVELOPE_VERSION) return false // 高版本/未知版本按损坏处理（未来迁移入口）
  if (!Array.isArray(value.projects) || !Array.isArray(value.scenes)) return false
  // 仅做最小结构校验，保证渲染与过滤不抛错；字段内容为自由文本不逐字段校验。
  return value.projects.every((p) => isObject(p) && typeof p.id === 'string' && typeof p.name === 'string')
    && value.scenes.every((s) => isObject(s) && typeof s.id === 'string' && typeof s.projectId === 'string' && typeof s.title === 'string')
}

/**
 * 引导时读取：尝试 localStorage.getItem。
 * 任何抛错（禁用/隐私模式/无 window）→ 内存态空结果；
 * 解析失败/结构损坏/版本不匹配 → 容错回退空信封（不白屏）。
 */
export function loadStudio(): LoadResult {
  if (typeof window === 'undefined') return { envelope: null, mode: 'memory' }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw == null) return { envelope: null, mode: 'persistent' }
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!isValidEnvelope(parsed)) {
        return { envelope: createEmptyEnvelope(), mode: 'persistent' }
      }
      return { envelope: parsed, mode: 'persistent' }
    } catch {
      // 损坏 JSON：回退空态而非崩溃
      return { envelope: createEmptyEnvelope(), mode: 'persistent' }
    }
  } catch {
    // localStorage 不可用（禁用/隐私模式）：降级内存态
    return { envelope: null, mode: 'memory' }
  }
}

/**
 * 写入信封；成功返回 persistent，任何异常（含配额超限）返回 memory，由调用方维护降级状态。
 */
export function saveStudio(envelope: StorageEnvelope): StorageMode {
  if (typeof window === 'undefined') return 'memory'
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    return 'persistent'
  } catch {
    return 'memory'
  }
}
