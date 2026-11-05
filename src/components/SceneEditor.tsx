import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard'
import { TEXT_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/types'
import type { Scene, SceneDraft } from '@/types'

interface SceneEditorProps {
  scene: Scene
  onSave: (sceneId: string, draft: SceneDraft) => boolean // 返回是否保存成功（校验通过）
  onDirtyChange: (sceneId: string, dirty: boolean) => void
}

function toDraft(scene: Scene): SceneDraft {
  return {
    title: scene.title,
    scene: scene.scene,
    location: scene.location,
    time: scene.time,
    characters: scene.characters,
    dialogue: scene.dialogue,
  }
}

export function SceneEditor({ scene, onSave, onDirtyChange }: SceneEditorProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<SceneDraft>(() => toDraft(scene))
  const [error, setError] = useState('')

  // 切换到另一场次时，以该场次已保存内容重置草稿。
  useEffect(() => {
    setDraft(toDraft(scene))
    setError('')
    // 仅在切换场次（id 变化）时重置；保存后同 id 的内容更新不清空正在编辑的输入（草稿本身即最新）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id])

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(toDraft(scene)), [draft, scene])

  // 上报脏态供列表「未保存」标记与 App 层统一导航守卫使用；注册 beforeunload 渐进增强。
  useEffect(() => {
    onDirtyChange(scene.id, isDirty)
  }, [scene.id, isDirty, onDirtyChange])
  useUnsavedGuard(isDirty)

  const update = (key: keyof SceneDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    if (error && key === 'title') setError('')
  }

  const save = () => {
    if (draft.title.trim().length === 0) {
      setError(t('scene.title_required'))
      return false
    }
    const ok = onSave(scene.id, draft)
    if (ok) setError('')
    return ok
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <div>
        <label htmlFor="scene-title" className="text-sm font-semibold text-charcoal-700">
          {t('scene.title_label')}
        </label>
        <input
          id="scene-title"
          type="text"
          value={draft.title}
          maxLength={TITLE_MAX_LENGTH}
          placeholder={t('scene.title_placeholder')}
          aria-invalid={!!error}
          aria-describedby={error ? 'scene-title-error' : undefined}
          onChange={(event) => update('title', event.target.value)}
          className="mt-2 w-full rounded-xl border border-charcoal-900/10 bg-white px-4 py-3 text-base font-semibold text-charcoal-900 outline-none transition focus:border-chili-500 focus:ring-2 focus:ring-chili-500/30"
        />
        {error && (
          <p id="scene-title-error" role="alert" className="mt-2 text-sm font-medium text-chili-600">
            {error}
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <EditorField
          id="scene-location"
          label={t('scene.location_label')}
          placeholder={t('scene.location_placeholder')}
          value={draft.location}
          onChange={(value) => update('location', value)}
        />
        <EditorField
          id="scene-time"
          label={t('scene.time_label')}
          placeholder={t('scene.time_placeholder')}
          value={draft.time}
          onChange={(value) => update('time', value)}
        />
      </div>

      <EditorField
        id="scene-characters"
        label={t('scene.characters_label')}
        placeholder={t('scene.characters_placeholder')}
        value={draft.characters}
        onChange={(value) => update('characters', value)}
      />
      <EditorField
        id="scene-scene"
        label={t('scene.scene_label')}
        placeholder={t('scene.scene_placeholder')}
        value={draft.scene}
        multiline
        onChange={(value) => update('scene', value)}
      />
      <EditorField
        id="scene-dialogue"
        label={t('scene.dialogue_label')}
        placeholder={t('scene.dialogue_placeholder')}
        value={draft.dialogue}
        multiline
        onChange={(value) => update('dialogue', value)}
      />

      <div className="flex items-center gap-3">
        <Button type="submit">
          <Save size={17} />
          {t('common.save')}
        </Button>
        {isDirty && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-500">
            {t('common.unsaved_badge')}
          </span>
        )}
      </div>
    </form>
  )
}

interface EditorFieldProps {
  id: string
  label: string
  placeholder: string
  value: string
  multiline?: boolean
  onChange: (value: string) => void
}

function EditorField({ id, label, placeholder, value, multiline, onChange }: EditorFieldProps) {
  const className =
    'mt-2 w-full rounded-xl border border-charcoal-900/10 bg-white px-4 py-3 text-sm text-charcoal-900 outline-none transition focus:border-chili-500 focus:ring-2 focus:ring-chili-500/30'
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-charcoal-700">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={5}
          maxLength={TEXT_MAX_LENGTH}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${className} resize-y leading-6`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          maxLength={TEXT_MAX_LENGTH}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
    </div>
  )
}
