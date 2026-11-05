import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewProjectDialog } from '@/components/NewProjectDialog'
import type { Project, Scene } from '@/types'

interface ProjectsViewProps {
  projects: Project[]
  scenes: Scene[]
  onCreateProject: (name: string) => void
  onOpenProject: (projectId: string) => void
}

function formatTime(iso: string, language: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })
}

export function ProjectsView({ projects, scenes, onCreateProject, onOpenProject }: ProjectsViewProps) {
  const { t, i18n } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)

  const sceneCountOf = (projectId: string) => scenes.filter((scene) => scene.projectId === projectId).length

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900">{t('projects.heading')}</h1>
          <p className="mt-1 text-sm text-charcoal-500">{t('projects.subheading')}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} aria-label={t('projects.aria_new_project')}>
          <FolderPlus size={18} />
          {t('projects.new_project')}
        </Button>
      </div>

      {projects.length === 0 ? (
        <section className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-charcoal-900/15 bg-rice-50 px-6 py-16 text-center shadow-card">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-chili-50 text-chili-500">
            <FolderOpen size={28} />
          </span>
          <h2 className="mt-5 text-xl font-bold text-charcoal-900">{t('projects.empty_title')}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-charcoal-500">{t('projects.empty_desc')}</p>
          <Button className="mt-6" onClick={() => setDialogOpen(true)}>
            <FolderPlus size={18} />
            {t('projects.empty_action')}
          </Button>
        </section>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpenProject(project.id)}
              className="group flex flex-col gap-3 rounded-3xl border border-charcoal-900/5 bg-rice-50 p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-chili-500/30"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-chili-50 text-chili-500 transition group-hover:bg-chili-500 group-hover:text-white">
                <FolderOpen size={20} />
              </span>
              <span className="text-base font-bold text-charcoal-900">{project.name}</span>
              <span className="text-xs text-charcoal-500">{t('projects.card_scenes', { count: sceneCountOf(project.id) })}</span>
              <span className="text-xs text-charcoal-500">
                {t('projects.card_updated', { time: formatTime(project.updatedAt, i18n.language) })}
              </span>
            </button>
          ))}
        </section>
      )}

      <NewProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={(name) => {
          onCreateProject(name)
          setDialogOpen(false)
        }}
      />
    </main>
  )
}
