import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Module, User } from '@/payload-types'
import { toSafeURL } from '@/utilities/safeURL'

export type HomeFeaturedModule = {
  slug: string
  title: string
  summary: string
  category: NonNullable<Module['category']>
  image: string | null
  href: string
  actionLabel: string
}

const commerceStorefrontURL = 'https://raidguild-commerce-production.up.railway.app/'

export function selectHomeFeaturedModules(
  modules: Module[],
  authenticated: boolean,
  random: () => number = Math.random,
): HomeFeaturedModule[] {
  const cards = modules.flatMap((module) => {
    if (!module.enabled || module.status === 'archived' || !module.slug) return []
    if (!authenticated && module.visibility !== 'public') return []

    const signedLaunch = module.moduleKind === 'external' && module.authMode === 'signed_launch'
    const entryRoute = toSafeURL(module.entryRoute, { allowRelative: true, protocols: ['https:'] })
    if (!signedLaunch && !entryRoute) return []

    const thumbnail =
      module.thumbnail && typeof module.thumbnail === 'object' ? module.thumbnail : null
    const image = toSafeURL(thumbnail?.sizes?.medium?.url || thumbnail?.url, {
      allowRelative: true,
      protocols: ['https:'],
    })
    const detail = `/modules/${encodeURIComponent(module.slug)}`
    const href =
      module.slug === 'commerce' && !authenticated
        ? commerceStorefrontURL
        : signedLaunch
          ? authenticated
            ? `/api/modules/${encodeURIComponent(module.slug)}/launch`
            : `/login?next=${encodeURIComponent(detail)}`
          : entryRoute!

    return [
      {
        slug: module.slug,
        title: module.name,
        summary: module.summary,
        category: module.category,
        image,
        href,
        actionLabel:
          module.slug === 'commerce' && !authenticated
            ? 'Visit store'
            : signedLaunch
              ? authenticated
                ? 'Launch app'
                : 'Log in to launch'
              : 'Open module',
      },
    ]
  })

  const visibleStore = cards.find((card) => card.slug === 'commerce')
  const store = visibleStore ? { ...visibleStore, title: 'RaidGuild Store' } : null
  const handbook = cards.find((card) => card.slug === 'handbook')
  const games = cards.filter(
    (card) =>
      card.category === 'games' && card.slug !== store?.slug && card.slug !== handbook?.slug,
  )
  const game = games.length
    ? games[Math.min(games.length - 1, Math.floor(Math.max(0, random()) * games.length))]
    : null

  return [store, handbook, game].filter((card): card is HomeFeaturedModule => Boolean(card))
}

export async function getHomeFeaturedModules(user?: User): Promise<HomeFeaturedModule[]> {
  const payload = await getPayload({ config: configPromise })
  const modules: Module[] = []
  let page = 1
  let nextPage: number | null | undefined = page

  while (nextPage) {
    const result = await payload.find({
      collection: 'modules',
      depth: 1,
      limit: 100,
      overrideAccess: !user,
      page,
      select: {
        slug: true,
        name: true,
        summary: true,
        category: true,
        thumbnail: true,
        enabled: true,
        status: true,
        visibility: true,
        entryRoute: true,
        authMode: true,
        moduleKind: true,
      },
      sort: 'id',
      user,
      where: {
        and: [
          { enabled: { equals: true } },
          { status: { not_equals: 'archived' } },
          ...(user ? [] : [{ visibility: { equals: 'public' } }]),
          {
            or: [{ slug: { in: ['commerce', 'handbook'] } }, { category: { equals: 'games' } }],
          },
        ],
      },
    })
    modules.push(...(result.docs as Module[]))
    nextPage = result.nextPage
    page = nextPage || page
  }

  return selectHomeFeaturedModules(modules, Boolean(user))
}
