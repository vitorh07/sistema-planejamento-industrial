import { notFound } from 'next/navigation'
import { ProjectDetail } from '@/components/project-detail'
import { PROJECTS } from '@/lib/data'

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = PROJECTS.find((p) => p.id === id)
  return { title: project ? `${project.id} · ${project.name} — PCP Industrial` : 'Projeto não encontrado' }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!PROJECTS.some((p) => p.id === id)) notFound()
  return <ProjectDetail id={id} />
}
