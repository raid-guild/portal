import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { canContributeContent } from '@/access/roles'
import { getCurrentUser } from '@/utilities/getCurrentUser'

import { ProjectManagementForm } from '../../ProjectManagementForm'
import {
  getProfileIDForUser,
  getProjectBySlugForManagement,
  getProjectManagementFormData,
  isProjectStewardProfile,
  toProjectManagementValue,
} from '../../formData'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function EditProjectPage({ params: paramsPromise }: Args) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const { slug = '' } = await paramsPromise
  const [project, currentProfileID] = await Promise.all([
    getProjectBySlugForManagement({ slug, user }),
    getProfileIDForUser(user.id, user),
  ])

  if (!project) notFound()

  const canManageProject =
    canContributeContent(user) || isProjectStewardProfile(project, currentProfileID)

  if (!canManageProject) {
    return (
      <main className="container pb-24 pt-12">
        <p className="portal-kicker">Projects</p>
        <h1 className="portal-title mt-4">Edit project</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Your account does not have permission to manage this project.
        </p>
        <Link className="portal-link mt-8 inline-flex" href={`/projects/${slug}`}>
          Back to project
        </Link>
      </main>
    )
  }

  const formData = await getProjectManagementFormData(user)

  return (
    <main className="container max-w-4xl pb-24 pt-12">
      <p className="portal-kicker">Projects</p>
      <h1 className="portal-title mt-4">Manage project</h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Keep the project surface current: contributors, resources, related sessions, threads, and
        public status.
      </p>
      <ProjectManagementForm
        contributors={formData.profiles}
        events={formData.events}
        initialValue={toProjectManagementValue(project)}
        projects={formData.projects.filter((option) => String(option.id) !== String(project.id))}
        threads={formData.threads}
      />
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise

  return {
    title: `Manage ${slug}`,
  }
}
