import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { Scene } from '@/types'

interface SceneListProps {
  scenes: Scene[] // 已按 order 升序
  currentSceneId: string | null
  dirtySceneIds: Set<string>
  onSelect: (sceneId: string) => void
}

export function SceneList({ scenes, currentSceneId, dirtySceneIds, onSelect }: SceneListProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs font-bold uppercase tracking-wide text-charcoal-500">{t('project.scenes_title')}</p>
      <ul aria-label={t('project.scenes_title')} className="flex flex-col gap-2">
        {scenes.map((scene) => {
          const active = scene.id === currentSceneId
          const dirty = dirtySceneIds.has(scene.id)
          return (
            <li key={scene.id}>
              <button
                type="button"
                onClick={() => onSelect(scene.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left transition',
                  active
                    ? 'border-chili-500 bg-chili-50 text-charcoal-900 shadow-card'
                    : 'border-charcoal-900/5 bg-white text-charcoal-700 hover:border-chili-500/30 hover:bg-chili-50/50',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {scene.title.trim() ? scene.title : t('project.untitled_scene')}
                  </span>
                  <span className="mt-0.5 block text-xs text-charcoal-500">{t('project.scene_count', { order: scene.order + 1 })}</span>
                </span>
                {dirty && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-500">
                    {t('common.unsaved_badge')}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
