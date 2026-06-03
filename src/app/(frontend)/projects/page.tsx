import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'

import { canContributeContent } from '@/access/roles'
import { PageRange } from '@/components/PageRange'
import type { Media, Profile, ProfileSkill, User } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'
import {
  getListPageValue,
  getListQueryValue,
  PortalPagination,
  PortalSearchForm,
  type ListSearchParams,
} from '../_components/PortalListControls'

export const dynamic = 'force-dynamic'
const PROJECTS_PER_PAGE = 24

type Args = {
  searchParams?: Promise<ListSearchParams>
}

export default async function ProjectsPage({ searchParams: searchParamsPromise }: Args) {
  const [user, searchParams] = await Promise.all([getCurrentUser(), searchParamsPromise])
  const canCreateProject = canContributeContent(user)
  const query = getListQueryValue(searchParams?.q)
  const page = getListPageValue(searchParams?.page)
  const projects = await getProjects(user, { page, query })

  return (
    <main className="container pb-24 pt-12">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 portal-kicker">Project Spikes</p>
          <h1 className="portal-title">Active project spikes</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Live collaboration surfaces that show what is being built, who is involved, and how to
            jump in. This is not a project management tool.
          </p>
        </div>
        {canCreateProject ? (
          <Link className="portal-admin-link" href="/admin/collections/projects/create">
            Create project
          </Link>
        ) : null}
      </section>

      <PortalSearchForm
        action="/projects"
        label="Search projects"
        placeholder="Search by project title, summary, status, or skill"
        query={query}
      />

      <div className="mt-8">
        <PageRange
          collectionLabels={{ plural: 'Projects', singular: 'Project' }}
          currentPage={projects.page}
          limit={PROJECTS_PER_PAGE}
          totalDocs={projects.totalDocs}
        />
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {projects.docs.length ? (
          projects.docs.map((project) => (
            <article className="overflow-hidden portal-card p-0" key={project.id}>
              <ProjectCoverImage coverImage={project.coverImage} title={project.title} />
              <div className="p-6">
                <p className="portal-kicker">{project.projectStatus || 'Project'}</p>
                <h2 className="mt-2 portal-heading">{project.title}</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{project.summary}</p>
                {project.currentState?.[0]?.body ? (
                  <p className="mt-4 border-l border-border pl-4 text-sm leading-6 text-muted-foreground">
                    {project.currentState[0].body}
                  </p>
                ) : null}
                <RelationshipPills items={project.profileSkills} />
                <ContributorList contributors={project.contributors} />
                {project.slug ? (
                  <Link
                    className="mt-5 inline-block portal-link"
                    href={`/projects/${project.slug}`}
                  >
                    View project
                  </Link>
                ) : null}
                {project.links?.length ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {project.links.map((link) => {
                      const safeURL = toSafeURL(link.url, {
                        allowRelative: false,
                        protocols: ['http:', 'https:'],
                      })

                      if (!safeURL) {
                        return (
                          <span className="text-sm font-medium" key={`${project.id}-${link.url}`}>
                            {link.label}
                          </span>
                        )
                      }

                      return (
                        <Link
                          className="portal-link"
                          href={safeURL}
                          key={`${project.id}-${link.url}`}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {link.label}
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            {query
              ? 'No projects match that search.'
              : 'No public projects yet. Add projects in Payload Admin to populate this showcase.'}
          </p>
        )}
      </section>

      <PortalPagination
        basePath="/projects"
        page={projects.page}
        query={query}
        totalPages={projects.totalPages}
      />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Projects',
}

const ProjectCoverImage: React.FC<{
  coverImage?: number | Media | null
  title: string
}> = ({ coverImage, title }) => {
  if (!coverImage || typeof coverImage !== 'object' || !coverImage.url) return null

  return (
    <div className="aspect-[1200/630] border-b border-border bg-muted">
      <img
        alt={coverImage.alt || `${title} cover image`}
        className="h-full w-full object-cover"
        loading="lazy"
        src={coverImage.url}
      />
    </div>
  )
}

const RelationshipPills: React.FC<{ items?: (number | ProfileSkill)[] | null }> = ({ items }) => {
  const docs = items?.filter(
    (item): item is ProfileSkill => item !== null && typeof item === 'object',
  )

  if (!docs?.length) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {docs.map((item) => (
        <span className="portal-pill" key={item.id}>
          {item.title}
        </span>
      ))}
    </div>
  )
}

const ContributorList: React.FC<{ contributors?: (number | Profile)[] | null }> = ({
  contributors,
}) => {
  const docs = contributors?.filter(
    (item): item is Profile => item !== null && typeof item === 'object',
  )

  if (!docs?.length) return null

  return (
    <div className="mt-5 text-sm">
      <p className="font-medium">Contributors</p>
      <p className="mt-2 text-muted-foreground">
        {docs.map((profile) => profile.displayName).join(', ')}
      </p>
    </div>
  )
}

const getProjects = async (
  user: User | null,
  {
    page,
    query,
  }: {
    page: number
    query: string
  },
) => {
  const payload = await getPayload({ config: configPromise })
  const where: Where = {
    and: [
      {
        _status: {
          equals: 'published',
        },
      },
    ],
  }

  if (query) {
    where.and?.push({
      or: [
        {
          title: {
            like: query,
          },
        },
        {
          summary: {
            like: query,
          },
        },
        {
          projectStatus: {
            like: query,
          },
        },
        {
          'profileSkills.title': {
            like: query,
          },
        },
      ],
    })
  }

  const result = await payload.find({
    collection: 'projects',
    depth: 2,
    draft: false,
    limit: PROJECTS_PER_PAGE,
    overrideAccess: false,
    page,
    sort: '-publishedAt',
    user: user || undefined,
    where,
  })

  return result
}
