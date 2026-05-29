import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { canEditContent, hasRole } from '@/access/roles'
import { getCurrentUser } from '@/utilities/getCurrentUser'

import { ContributionRequestForm } from '../../ContributionRequestForm'
import {
  canManageContributionRequest,
  getContributionRequestBySlugForForm,
  getContributionRequestFormData,
  toRequestFormValue,
} from '../../formData'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function EditContributionRequestPage({ params: paramsPromise }: Args) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const { slug = '' } = await paramsPromise
  const request = await getContributionRequestBySlugForForm({ slug, user })

  if (!request) notFound()

  if (!(await canManageContributionRequest(user, request))) {
    return (
      <main className="container pb-24 pt-12">
        <p className="portal-kicker">Contribution Requests</p>
        <h1 className="portal-title mt-4">Edit request</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Your account does not have permission to edit this contribution request.
        </p>
        <Link className="portal-link mt-8 inline-flex" href={`/requests/${slug}`}>
          Back to request
        </Link>
      </main>
    )
  }

  const formData = await getContributionRequestFormData(user)

  return (
    <main className="container max-w-4xl pb-24 pt-12">
      <p className="portal-kicker">Contribution Requests</p>
      <h1 className="portal-title mt-4">Edit request</h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Update the ask, status, response path, and related context.
      </p>
      <ContributionRequestForm
        canPublish={canPublishContributionRequests(user)}
        defaultOwnerID={formData.currentProfile?.id}
        events={formData.events}
        initialValue={toRequestFormValue(request)}
        mode="edit"
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

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise

  return {
    title: `Edit ${slug}`,
  }
}

const canPublishContributionRequests = (
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
) => canEditContent(user) || hasRole(user, 'agent')
