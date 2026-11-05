import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { TITLE_MAX_LENGTH } from '@/types'

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => void
}

export function NewProjectDialog({ open, onOpenChange, onCreate }: NewProjectDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 每次打开时重置表单并聚焦输入框。
  useEffect(() => {
    if (open) {
      setName('')
      setError('')
      const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(timer)
    }
  }, [open])

  const submit = () => {
    if (name.trim().length === 0) {
      setError(t('projects.name_required'))
      return
    }
    onCreate(name.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('projects.dialog_title')}>
        <div className="mt-5">
          <label htmlFor="project-name" className="text-sm font-semibold text-charcoal-700">
            {t('projects.name_label')}
          </label>
          <input
            id="project-name"
            ref={inputRef}
            type="text"
            value={name}
            maxLength={TITLE_MAX_LENGTH}
            placeholder={t('projects.name_placeholder')}
            aria-invalid={!!error}
            aria-describedby={error ? 'project-name-error' : undefined}
            onChange={(event) => {
              setName(event.target.value)
              if (error) setError('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
            className="mt-2 w-full rounded-xl border border-charcoal-900/10 bg-white px-4 py-3 text-sm text-charcoal-900 outline-none transition focus:border-chili-500 focus:ring-2 focus:ring-chili-500/30"
          />
          {error && (
            <p id="project-name-error" role="alert" className="mt-2 text-sm font-medium text-chili-600">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submit}>{t('common.create')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
