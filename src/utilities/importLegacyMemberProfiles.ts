import type { Payload } from 'payload'

import { profileRoles } from '@/endpoints/seed/profile-roles'
import { profileSkills } from '@/endpoints/seed/profile-skills'

type CSVRow = Record<string, string>

type LegacyProfileImportArgs = {
  csv: string
  dryRun?: boolean
  payload: Payload
}

type LegacyProfileImportResult = {
  created: number
  dryRun: boolean
  missingClaimEmail: number
  skipped: number
  total: number
  unmappedTokens: string[]
  updated: number
}

type TaxonomyIDs = {
  roleIDsBySlug: Map<string, number>
  skillIDsBySlug: Map<string, number>
}

const skillTokenToSlug: Record<string, string> = {
  ACCOUNT_MANAGER: 'account-manager',
  ACCOUNTING: 'treasury',
  BACKEND: 'backend-dev',
  BACKEND_DEV: 'backend-dev',
  BIZ_DEV: 'bizdev',
  COMMUNITY: 'community',
  CONTENT: 'content-creator',
  DESIGN: 'design',
  DEVOPS: 'devops',
  FINANCE: 'treasury',
  FRONTEND: 'frontend-dev',
  FRONTEND_DEV: 'frontend-dev',
  GAME_THEORY: 'dao-consultant',
  ILLUSTRATION: 'design',
  LEGAL: 'legal',
  MARKETING: 'marketing',
  MEMES: 'marketing',
  OPERATIONS: 'internal-ops',
  PRODUCT_DESIGN: 'design',
  PROJECT_MANAGEMENT: 'project-manager',
  SMART_CONTRACTS: 'smart-contracts',
  SOLIDITY: 'smart-contracts',
  TOKENOMICS: 'dao-consultant',
  TREASURY: 'treasury',
  UI_DESIGN: 'design',
  UX_RESEARCH: 'ux-user-testing',
  VISUAL_DESIGN: 'design',
}

const roleTokenToSlug: Record<string, string> = {
  ACCOUNT_MANAGER: 'cleric',
  ACCOUNTING: 'angry-dwarf',
  BACKEND: 'paladin',
  BACKEND_DEV: 'paladin',
  BIZ_DEV: 'hunter',
  COMMUNITY: 'tavern-keeper',
  CONTENT: 'scribe',
  DESIGN: 'archer',
  DEVOPS: 'necromancer',
  FINANCE: 'angry-dwarf',
  FRONTEND: 'warrior',
  FRONTEND_DEV: 'warrior',
  GAME_THEORY: 'mystic-alchemist',
  ILLUSTRATION: 'archer',
  LEGAL: 'rogue',
  MARKETING: 'bard',
  MEMES: 'bard',
  OPERATIONS: 'healer',
  PRODUCT_DESIGN: 'archer',
  PROJECT_MANAGEMENT: 'monk',
  SMART_CONTRACTS: 'wizard',
  SOLIDITY: 'wizard',
  TOKENOMICS: 'mystic-alchemist',
  TREASURY: 'angry-dwarf',
  UI_DESIGN: 'archer',
  UX_RESEARCH: 'ranger',
  VISUAL_DESIGN: 'archer',
}

export const importLegacyMemberProfiles = async ({
  csv,
  dryRun = false,
  payload,
}: LegacyProfileImportArgs): Promise<LegacyProfileImportResult> => {
  const rows = parseCSV(csv)
  const unmappedTokens = new Set<string>()
  const taxonomyIDs = dryRun ? null : await ensureTaxonomy(payload)
  const result: LegacyProfileImportResult = {
    created: 0,
    dryRun,
    missingClaimEmail: 0,
    skipped: 0,
    total: rows.length,
    unmappedTokens: [],
    updated: 0,
  }

  for (const row of rows) {
    const sourceCRMID = clean(row.member_id)
    const displayName = clean(row.name)

    if (!sourceCRMID || !displayName) {
      result.skipped += 1
      continue
    }

    const claimEmail = normalizeEmail(row.email)
    if (!claimEmail) result.missingClaimEmail += 1

    const tokens = getLegacyTokens(row)
    const skillSlugs = unique(tokens.map((token) => skillTokenToSlug[token]).filter(isDefined))
    const roleSlugs = unique(tokens.map((token) => roleTokenToSlug[token]).filter(isDefined)).slice(
      0,
      2,
    )

    tokens.forEach((token) => {
      if (!skillTokenToSlug[token] && !roleTokenToSlug[token]) unmappedTokens.add(token)
    })

    const finalSkillSlugs = skillSlugs.length ? skillSlugs : ['new-applicants']
    const finalRoleSlugs = roleSlugs.length ? roleSlugs : ['apprentice']

    const existing = await findExistingProfile(payload, sourceCRMID)

    if (dryRun) {
      if (existing) result.updated += 1
      else result.created += 1
      continue
    }

    const handle = existing?.handle || (await generateUniqueHandle(payload, row))
    const claimed = Boolean(existing?.user) || existing?.claimStatus === 'claimed'
    const claimStatus: 'claimed' | 'unclaimed' = claimed ? 'claimed' : 'unclaimed'
    const data = {
      bio: buildBio(row),
      claimEmail: claimed ? existing?.claimEmail || claimEmail : claimEmail,
      claimStatus,
      contact: {
        discord: clean(row.discord),
        email: claimEmail,
        telegram: clean(row.telegram),
        x: clean(row.twitter),
      },
      displayName,
      handle,
      links: buildLinks(row),
      profileRoles: finalRoleSlugs
        .map((slug) => taxonomyIDs?.roleIDsBySlug.get(slug))
        .filter(isDefined),
      profileSkills: finalSkillSlugs
        .map((slug) => taxonomyIDs?.skillIDsBySlug.get(slug))
        .filter(isDefined),
      sourceCRMID,
      status: 'active' as const,
      visibility: 'public' as const,
      walletAddress: clean(row.eth_address),
    }

    if (existing) {
      await payload.update({
        id: existing.id,
        collection: 'profiles',
        data,
        overrideAccess: true,
      })
      result.updated += 1
    } else {
      await payload.create({
        collection: 'profiles',
        data,
        overrideAccess: true,
      })
      result.created += 1
    }
  }

  result.unmappedTokens = Array.from(unmappedTokens).sort()

  return result
}

const ensureTaxonomy = async (payload: Payload): Promise<TaxonomyIDs> => {
  const skillIDsBySlug = new Map<string, number>()
  const roleIDsBySlug = new Map<string, number>()

  for (const skill of profileSkills) {
    if (!skill.slug) continue

    const doc = await findOrCreateProfileSkill(payload, skill.slug, skill)
    skillIDsBySlug.set(skill.slug, normalizeNumericID(doc.id))
  }

  for (const role of profileRoles) {
    if (!role.slug) continue

    const doc = await findOrCreateProfileRole(payload, role.slug, role)
    roleIDsBySlug.set(role.slug, normalizeNumericID(doc.id))
  }

  return { roleIDsBySlug, skillIDsBySlug }
}

const findOrCreateProfileSkill = async (
  payload: Payload,
  slug: string,
  data: (typeof profileSkills)[number],
) => {
  const existing = await payload.find({
    collection: 'profileSkills',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return (
    existing.docs[0] ||
    (await payload.create({
      collection: 'profileSkills',
      data,
      overrideAccess: true,
    }))
  )
}

const findOrCreateProfileRole = async (
  payload: Payload,
  slug: string,
  data: (typeof profileRoles)[number],
) => {
  const existing = await payload.find({
    collection: 'profileRoles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return (
    existing.docs[0] ||
    (await payload.create({
      collection: 'profileRoles',
      data,
      overrideAccess: true,
    }))
  )
}

const normalizeNumericID = (id: number | string) => {
  if (typeof id === 'number') return id
  const numericID = Number(id)
  if (!Number.isFinite(numericID)) throw new Error(`Expected numeric Payload ID, received ${id}`)

  return numericID
}

const findExistingProfile = async (payload: Payload, sourceCRMID: string) => {
  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      sourceCRMID: {
        equals: sourceCRMID,
      },
    },
  })

  return result.docs[0] || null
}

const generateUniqueHandle = async (payload: Payload, row: CSVRow) => {
  const base = slugify(
    clean(row.github) ||
      clean(row.twitter) ||
      clean(row.telegram) ||
      clean(row.discord) ||
      clean(row.name) ||
      'legacy-member',
  )
  let handle = base || 'legacy-member'
  let suffix = 2

  while (await handleExists(payload, handle)) {
    handle = `${base}-${suffix}`
    suffix += 1
  }

  return handle
}

const handleExists = async (payload: Payload, handle: string) => {
  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      handle: {
        equals: handle,
      },
    },
  })

  return result.docs.length > 0
}

const getLegacyTokens = (row: CSVRow) => {
  const primary = splitTokens(row.primary_class_key)
  const guildClasses = splitTokens(row.guild_classes)
  const skills = splitTokens(row.skills)
  const applicationSkills = splitTokens(row.application_skills)

  return unique([...primary, ...guildClasses, ...skills, ...applicationSkills])
}

const splitTokens = (value: string | undefined) => {
  return (value || '')
    .split(',')
    .map((item) =>
      item
        .replace(/\(.+\)/, '')
        .trim()
        .toUpperCase(),
    )
    .filter(Boolean)
}

const buildBio = (row: CSVRow) => {
  return (
    clean(row.description) ||
    clean(row.introduction) ||
    clean(row.why_raidguild) ||
    'Imported legacy member profile.'
  )
}

const buildLinks = (row: CSVRow) => {
  return [
    socialLink('GitHub', row.github, 'https://github.com/'),
    socialLink('X', row.twitter, 'https://x.com/'),
  ].filter(isDefined)
}

const socialLink = (label: string, rawValue: string | undefined, baseURL: string) => {
  const value = clean(rawValue)
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return { label, url: value }
  const handle = value.replace(/^@/, '')
  if (!handle || /\s/.test(handle)) return null

  return {
    label,
    url: `${baseURL}${handle}`,
  }
}

const parseCSV = (csv: string): CSVRow[] => {
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const next = csv[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      record.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1
      record.push(field)
      records.push(record)
      field = ''
      record = []
    } else {
      field += char
    }
  }

  if (field || record.length) {
    record.push(field)
    records.push(record)
  }

  const [header = [], ...rows] = records.filter((row) => row.some((value) => value.trim()))
  const columns = header.map((column) => column.trim())

  return rows.map((row) => {
    return columns.reduce<CSVRow>((acc, column, index) => {
      acc[column] = row[index] || ''
      return acc
    }, {})
  })
}

const normalizeEmail = (value: string | undefined) => {
  const email = clean(value).toLowerCase()
  if (!email) return undefined
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined

  return email
}

const clean = (value: string | undefined) => value?.trim() || ''

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

const unique = <T>(items: T[]) => Array.from(new Set(items))

const isDefined = <T>(item: T | null | undefined): item is T => item != null
