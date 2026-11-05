import { useEffect } from 'react'

/**
 * 页签关闭/刷新的渐进增强守卫：存在未保存更改时注册 beforeunload，
 * 尽力触发浏览器原生离开提示（能力受浏览器约束）；干净时移除监听。
 * 应用内导航（切换场次/返回/前进后退）的拦截由组件层统一导航守卫 + ConfirmDiscardDialog 承担。
 */
export function useUnsavedGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // 现代浏览器要求设置 returnValue 才会弹出原生确认
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])
}
