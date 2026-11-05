import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ConfirmDiscardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStay: () => void
  onDiscard: () => void
}

export function ConfirmDiscardDialog({ open, onOpenChange, onStay, onDiscard }: ConfirmDiscardDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('guard.title')}>
        <div className="mt-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500">
              <AlertTriangle size={20} />
            </span>
            <p className="text-sm leading-6 text-charcoal-500">{t('guard.desc')}</p>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onStay}>
              {t('guard.stay')}
            </Button>
            <Button variant="default" onClick={onDiscard}>
              {t('guard.discard')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
