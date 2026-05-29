import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { canContributeContent, canEditContent, hasRole } from '@/access/roles'
import { getCurrentUser } from '@/utilities/getCurrentUser'

import { ContributionRequestForm } from '../ContributionRequestForm'
import { getContributionRequestFormData } from '../formData'

export const dynamic = 'force-dynamic'

type Args = {
  searchParams: Promise<{
    event?: string
    project?: string
  }>
}

export default async function NewContributionRequestPage({ searchParams }: Args) {
  const user = await getCurrentUser()

  if (!user) redirect('/login?next=/requests/new')

  if (!canCreateContributionRequests(user)) {
    return (
      <main className="container pb-24 pt-12">
        <p className="portal-kicker">Contribution Requests</p>
        <h1 className="portal-title mt-4">Create request</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Your account does not have permission to create contribution requests.
        </p>
        <Link className="portal-link mt-8 inline-flex" href="/projects">
          Back to projects
        </Link>
      </main>
    )
  }

  const params = await searchParams
  const formData = await getContributionRequestFormData(user)

  if (!formData.currentProfile) {
    return (
      <main className="container pb-24 pt-12">
        <p className="portal-kicker">Contribution Requests</p>
        <h1 className="portal-title mt-4">Create request</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Create or claim your profile before opening contribution requests.
        </p>
        <Link className="portal-admin-link mt-8 inline-flex" href="/me">
          Open profile
        </Link>
      </main>
    )
  }

  const initialValue = {
    owner: formData.currentProfile.id,
    project: params.project || null,
    relatedEvents: params.event ? [params.event] : [],
  }

  return (
    <main className="container max-w-4xl pb-24 pt-12">
      <p className="portal-kicker">Contribution Requests</p>
      <h1 className="portal-title mt-4">Create request</h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Open a lightweight ask for help, review, feedback, or a good first contribution.
      </p>
      <ContributionRequestForm
        canPublish={canPublishContributionRequests(user)}
        defaultOwnerID={formData.currentProfile.id}
        events={formData.events}
        initialValue={initialValue}
        mode="create"
        posts={formData.posts}
        profiles={formData.profiles}
        projects={formData.projects}
        stewardedProjectIDs={formData.stewardedProjectIDs}
        skills={formData.skills}
        threads={formData.threads}
      />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Create contribution request',
}

const canCreateContributionRequests = (
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
) => canContributeContent(user) || hasRole(user, 'member')

const canPublishContributionRequests = (
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
) => canEditContent(user) || hasRole(user, 'agent')
