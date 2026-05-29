import Link from 'next/link'
import React from 'react'

import type { ContributionRequest, Profile, ProfileSkill } from '@/payload-types'
import { toSafeURL } from '@/utilities/safeURL'

const requestTypeLabels: Record<NonNullable<ContributionRequest['requestType']>, string> = {
  collaborator: 'Collaborator',
  feedback: 'Feedback',
  good_first_contribution: 'Good first contribution',
  help_wanted: 'Help wanted',
  resource: 'Resource',
  review: 'Review',
}

const requestStatusLabels: Record<NonNullable<ContributionRequest['requestStatus']>, string> = {
  archived: 'Archived',
  filled: 'Filled',
  in_discussion: 'In discussion',
  open: 'Open',
  paused: 'Paused',
}

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

export const ContributionRequestCard: React.FC<{
  request: ContributionRequest
}> = ({ request }) => {
  const owner = typeof request.owner === 'object' ? request.owner : null
  const skills = relationDocs<ProfileSkill>(request.profileSkills)
  const responseURL = toSafeURL(request.responseURL)
  const detailURL = request.slug ? `/requests/${request.slug}` : null

  return (
    <article className="portal-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="portal-pill">
          {requestTypeLabels[request.requestType || 'help_wanted']}
        </span>
        <span className="portal-pill">
          {requestStatusLabels[request.requestStatus || 'open']}
        </span>
      </div>
      <h3 className="mt-4 font-bold">{request.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.summary}</p>
      {owner ? <OwnerLine owner={owner} /> : null}
      {skills.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span className="portal-pill" key={skill.id}>
              {skill.title}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        {detailURL ? (
          <Link className="portal-link" href={detailURL}>
            View request
          </Link>
        ) : null}
        {responseURL ? (
          <Link
            className="portal-link"
            href={responseURL}
            rel={responseURL.startsWith('http') ? 'noopener noreferrer' : undefined}
            target={responseURL.startsWith('http') ? '_blank' : undefined}
          >
            Respond
          </Link>
        ) : null}
      </div>
    </article>
  )
}

const OwnerLine: React.FC<{ owner: Profile }> = ({ owner }) => {
  const href = owner.handle ? `/members/${owner.handle}` : null

  return (
    <p className="mt-3 text-sm text-muted-foreground">
      Asked by{' '}
      {href ? (
        <Link className="portal-link" href={href}>
          {owner.displayName}
        </Link>
      ) : (
        owner.displayName
      )}
    </p>
  )
}
