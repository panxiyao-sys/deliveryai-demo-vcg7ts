import { Clapperboard, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  language: string
  onToggleLanguage: () => void
}

export function TopBar({ language, onToggleLanguage }: TopBarProps) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-30 border-b border-charcoal-900/5 bg-rice-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-chili-500 text-white shadow-md">
            <Clapperboard size={20} />
          </span>
          <div className="leading-tight">
            <p className="text-base font-extrabold text-charcoal-900">{t('common.brand_name')}</p>
            <p className="text-xs text-charcoal-500">{t('common.brand_subtitle')}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onToggleLanguage} aria-label={t('common.aria_lang')}>
          <Languages size={16} />
          {language === 'zh' ? t('common.language') : t('common.language')}
        </Button>
      </div>
    </header>
  )
}
