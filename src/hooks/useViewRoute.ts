import { useEffect } from 'react'
import type { RouteState, ViewName } from '@/types'
import { projectsRoute } from '@/state/studioReducer'

// 剧创平台两视图：工作台/项目列表（#/projects）与项目详情（#/project/:id）。
// 沿用 hash 路由（非 History 路由）以兼容 Vite base './' 与 GitHub Pages 子路径部署，
// hash 不会发往服务器，静态托管只需返回 index.html，dist 直接 file:// 打开也能路由。
const PROJECTS_HASH = '#/projects'

export function routeToHash(route: RouteState): string {
  return route.view === 'project' && route.projectId ? `#/project/${route.projectId}` : PROJECTS_HASH
}

/**
 * 解析 hash 为路由；无法解析、项目 id 不存在（含旧餐饮 hash）时返回 null，由纠正逻辑回落 projects。
 * @param projectExists 判断某 projectId 是否命中现有项目
 */
export function hashToRoute(hash: string, projectExists: (id: string) => boolean): RouteState | null {
  const raw = hash.replace(/^#\/?/, '')
  if (raw === 'projects') return projectsRoute
  const match = /^project\/(.+)$/.exec(raw)
  if (match && projectExists(match[1])) {
    return { view: 'project', projectId: match[1] }
  }
  // 空 hash、非法地址、旧餐饮 hash（home/welcome/menu/order/checkout）、失效项目 id 均不可达。
  return null
}

/** 读取 URL hash 请求的初始路由；无有效 hash 时返回 null（调用方回落 projects）。 */
export function initialRouteFromHash(projectExists: (id: string) => boolean): RouteState | null {
  if (typeof window === 'undefined') return null
  return hashToRoute(window.location.hash, projectExists)
}

interface UseViewRouteOptions {
  /** 将 hash 驱动的导航（浏览器前进/后退或手动改地址）应用到应用状态。 */
  onNavigate: (route: RouteState) => void
  /** 判断项目详情地址是否可达（projectId 须命中现有项目）。 */
  projectExists: (id: string) => boolean
}

/**
 * 保持当前路由与 URL hash 双向同步：
 * - 路由变化时写入对应 hash，使两视图拥有各自地址并生成历史记录。
 * - 监听 hashchange，响应浏览器前进/后退与手动改地址；非法/不可达地址 replaceState 纠正。
 */
export function useViewRoute(route: RouteState, { onNavigate, projectExists }: UseViewRouteOptions) {
  // 路由 → hash
  useEffect(() => {
    const target = routeToHash(route)
    if (window.location.hash === target) return
    if (hashToRoute(window.location.hash, projectExists)) {
      window.location.hash = target // 正常跳转：写入 hash 以生成一条历史记录，支持前进/后退
    } else {
      window.history.replaceState(null, '', target) // 首次加载/非法地址：规范化，不额外新增历史记录
    }
  }, [route, projectExists])

  // hash → 路由
  useEffect(() => {
    const handler = () => {
      const requested = hashToRoute(window.location.hash, projectExists)
      const target: RouteState = requested ?? projectsRoute
      if (!requested) {
        window.history.replaceState(null, '', routeToHash(target)) // 纠正非法/旧/失效地址
      }
      if (target.view !== route.view || target.projectId !== route.projectId) {
        onNavigate(target)
      }
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [route, onNavigate, projectExists])
}

export type { ViewName }
