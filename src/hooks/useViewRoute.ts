import { useEffect, useRef } from 'react'
import type { RouteState } from '@/types'
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
 * - 路由变化时用 history.pushState 写入对应 hash（显式产生一条历史，支持前进/后退），
 *   地址已是目标 hash 时跳过，避免重复历史条目；首次/非法地址用 replaceState 规范化。
 * - 监听 hashchange/popstate，响应浏览器前进/后退与手动改地址；非法/不可达地址 replaceState 纠正。
 *
 * 用 ref 持有最新 projectExists/onNavigate，使订阅 effect 只在挂载时建立一次，
 * 避免回调引用变化在 StrictMode 双挂载或数据就绪后重放首载纠正、污染历史栈。
 */
export function useViewRoute(route: RouteState, { onNavigate, projectExists }: UseViewRouteOptions) {
  const projectExistsRef = useRef(projectExists)
  const onNavigateRef = useRef(onNavigate)
  const routeRef = useRef(route)
  projectExistsRef.current = projectExists
  onNavigateRef.current = onNavigate
  routeRef.current = route

  // 路由 → hash（首载规范化 + 后续 push）
  useEffect(() => {
    const target = routeToHash(route)
    if (window.location.hash === target) return
    if (hashToRoute(window.location.hash, projectExistsRef.current)) {
      window.history.pushState(null, '', target) // 正常跳转：生成一条历史记录，支持前进/后退
    } else {
      window.history.replaceState(null, '', target) // 首次加载/非法地址：规范化，不新增历史
    }
  }, [route])

  // hash → 路由：仅在真实 hashchange/popstate 事件时响应，挂载时不主动纠正
  useEffect(() => {
    const handler = () => {
      const current = routeRef.current
      const requested = hashToRoute(window.location.hash, projectExistsRef.current)
      const target: RouteState = requested ?? projectsRoute
      if (!requested) {
        window.history.replaceState(null, '', routeToHash(target)) // 纠正非法/旧/失效地址
      }
      const sameRoute = target.view === current.view && target.projectId === current.projectId
      // 重复导航到当前同一地址：路由状态不变，忽略即可（浏览器历史条目由其自身管理）。
      if (sameRoute) return
      onNavigateRef.current(target)
    }
    window.addEventListener('hashchange', handler)
    window.addEventListener('popstate', handler)
    return () => {
      window.removeEventListener('hashchange', handler)
      window.removeEventListener('popstate', handler)
    }
  }, [])
}
