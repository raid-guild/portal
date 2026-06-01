import { getPayload } from 'payload'

import configPromise from '@payload-config'

export type FunnelLinkCopy = {
  description: string
  href: string
  label: string
}

export type ProductPageCopy = {
  backLinkLabel?: string
  benefits?: string[]
  benefitsHeading?: string
  contextBody?: string
  contextHeading?: string
  createAccountLabel?: string
  eyebrow: string
  funnelEyebrow?: string
  funnelHeading?: string
  funnelLinks?: FunnelLinkCopy[]
  headline: string
  intro: string
  messageLabel?: string
  postSubmitBody?: string
  postSubmitEyebrow?: string
  postSubmitHeading?: string
  secondaryIntro?: string
  seoDescription: string
  seoTitle: string
  submitAnotherLabel?: string
  submitLabel?: string
}

type PageCopyDoc = Omit<Partial<ProductPageCopy>, 'benefits' | 'funnelLinks'> & {
  benefits?: { body?: string | null }[] | null
  funnelLinks?:
    | { description?: string | null; href?: string | null; label?: string | null }[]
    | null
}

export type InquiryType = 'client' | 'sponsor' | 'grant' | 'opportunity' | 'general'

export const joinPageFallback: ProductPageCopy = {
  benefits: [
    'Follow real guild activity without digging through chat.',
    'Build a public profile connected to sessions, projects, posts, and badges.',
    'Discover projects and contribution requests.',
    'Join live sessions and keep track of context afterward.',
    'Bring client, sponsor, grant, or partnership opportunities into the right intake path.',
  ],
  benefitsHeading: 'Turn participation into skills, visibility, and opportunity.',
  eyebrow: 'Join the Portal',
  funnelEyebrow: 'Need a different path?',
  funnelHeading: 'Start with the right intake.',
  funnelLinks: [
    {
      description: 'Talk through a client build, product spike, or technical implementation need.',
      href: '/inquire/client',
      label: 'Request a build',
    },
    {
      description: 'Bring sponsorship, bounties, or paid work into the guild review path.',
      href: '/inquire/sponsor',
      label: 'Sponsor the guild',
    },
    {
      description: 'Route grants, public goods funding, or ecosystem support to the right context.',
      href: '/inquire/grant',
      label: 'Offer funding or grants',
    },
    {
      description: 'Start a partnership, collaboration, research, or community opportunity.',
      href: '/inquire/opportunity',
      label: 'Bring a collaboration',
    },
    {
      description: 'Ask a general question and get routed toward the right next step.',
      href: '/inquire/general',
      label: 'Talk to the guild',
    },
  ],
  headline: "Join RaidGuild's digital coworking space.",
  intro:
    'Create an account to connect your profile, follow live guild activity, join sessions, and find useful places to contribute.',
  secondaryIntro:
    'The Portal shows the current brief, upcoming sessions, active projects, contributor requests, and the people building around them.',
  seoDescription:
    'Join sessions, find a team, build your skills, and help turn ideas into shipped work with the RaidGuild community.',
  seoTitle: 'Join the Portal',
}

export const briefPublicPageFallback: ProductPageCopy = {
  contextBody: 'No public sessions are scheduled yet. Join to get access to member coordination.',
  contextHeading: 'Next public session',
  createAccountLabel: 'Join RaidGuild',
  eyebrow: 'RaidGuild Portal',
  headline: 'A digital coworking space for builders',
  intro:
    'Join sessions, find a team, build your skills, and help turn ideas into shipped work with the RaidGuild community.',
  seoDescription:
    'Join sessions, find a team, build your skills, and help turn ideas into shipped work with the RaidGuild community.',
  seoTitle: 'RaidGuild Portal | A digital coworking space for builders',
  submitAnotherLabel: 'View sessions',
}

export const inquiryPageFallbacks: Record<InquiryType, ProductPageCopy> = {
  client: {
    backLinkLabel: 'Back to join',
    contextBody:
      'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
    contextHeading: 'How this works',
    createAccountLabel: 'Create account',
    eyebrow: 'Build Request',
    headline: 'Request a build with RaidGuild.',
    intro:
      'Share the product, technical, or strategic problem you want to move forward. This starts a private intake record for review.',
    messageLabel: 'What do you want to build, validate, or unblock?',
    postSubmitBody:
      'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
    postSubmitEyebrow: 'Inquiry started',
    postSubmitHeading: 'Continue your RaidGuild intake',
    seoDescription: 'Start a private build request with RaidGuild.',
    seoTitle: 'Request a build with RaidGuild.',
    submitAnotherLabel: 'Submit another',
    submitLabel: 'Start inquiry',
  },
  general: {
    backLinkLabel: 'Back to join',
    contextBody:
      'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
    contextHeading: 'How this works',
    createAccountLabel: 'Create account',
    eyebrow: 'Guild Inquiry',
    headline: 'Talk to the guild.',
    intro:
      'Not sure where to start? Share the question or context and the guild can route it toward the right next step.',
    messageLabel: 'What should we know?',
    postSubmitBody:
      'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
    postSubmitEyebrow: 'Inquiry started',
    postSubmitHeading: 'Continue your RaidGuild intake',
    seoDescription: 'Start a general RaidGuild inquiry and get routed to the right next step.',
    seoTitle: 'Talk to the guild.',
    submitAnotherLabel: 'Submit another',
    submitLabel: 'Start inquiry',
  },
  grant: {
    backLinkLabel: 'Back to join',
    contextBody:
      'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
    contextHeading: 'How this works',
    createAccountLabel: 'Create account',
    eyebrow: 'Funding Path',
    headline: 'Offer funding or grants.',
    intro:
      'Bring grants, public goods funding, ecosystem budgets, or other support opportunities into review.',
    messageLabel: 'What funding path or grant context are you bringing?',
    postSubmitBody:
      'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
    postSubmitEyebrow: 'Inquiry started',
    postSubmitHeading: 'Continue your RaidGuild intake',
    seoDescription: 'Bring grant, public goods, or ecosystem funding context into review.',
    seoTitle: 'Offer funding or grants.',
    submitAnotherLabel: 'Submit another',
    submitLabel: 'Start inquiry',
  },
  opportunity: {
    backLinkLabel: 'Back to join',
    contextBody:
      'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
    contextHeading: 'How this works',
    createAccountLabel: 'Create account',
    eyebrow: 'Collaboration',
    headline: 'Bring a collaboration opportunity.',
    intro:
      'Start a partnership, research, community, or ecosystem collaboration thread without needing to know the right internal channel.',
    messageLabel: 'What collaboration opportunity should RaidGuild understand?',
    postSubmitBody:
      'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
    postSubmitEyebrow: 'Inquiry started',
    postSubmitHeading: 'Continue your RaidGuild intake',
    seoDescription: 'Share a partnership, research, community, or ecosystem collaboration.',
    seoTitle: 'Bring a collaboration opportunity.',
    submitAnotherLabel: 'Submit another',
    submitLabel: 'Start inquiry',
  },
  sponsor: {
    backLinkLabel: 'Back to join',
    contextBody:
      'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
    contextHeading: 'How this works',
    createAccountLabel: 'Create account',
    eyebrow: 'Sponsorship',
    headline: 'Sponsor the guild.',
    intro:
      'Share sponsorship, bounty, paid work, or support context so it can be reviewed without getting lost in chat.',
    messageLabel: 'What are you sponsoring or bringing to the guild?',
    postSubmitBody:
      'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
    postSubmitEyebrow: 'Inquiry started',
    postSubmitHeading: 'Continue your RaidGuild intake',
    seoDescription: 'Start a sponsorship, bounty, paid work, or support inquiry with RaidGuild.',
    seoTitle: 'Sponsor the guild.',
    submitAnotherLabel: 'Submit another',
    submitLabel: 'Start inquiry',
  },
}

export const getJoinPageCopy = () => getPageCopy('join', joinPageFallback)

export const getBriefPublicPageCopy = () => getPageCopy('brief-public', briefPublicPageFallback)

export const getInquiryPageCopy = (type: InquiryType) =>
  getPageCopy(`inquire-${type}`, inquiryPageFallbacks[type])

const getPageCopy = async (key: string, fallback: ProductPageCopy): Promise<ProductPageCopy> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'pageCopy',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      where: {
        key: {
          equals: key,
        },
      },
    })

    const doc = result.docs[0] as PageCopyDoc | undefined

    return doc ? mergePageCopy(fallback, doc) : fallback
  } catch {
    return fallback
  }
}

const mergePageCopy = (fallback: ProductPageCopy, doc: PageCopyDoc): ProductPageCopy => ({
  ...fallback,
  backLinkLabel: textValue(doc.backLinkLabel, fallback.backLinkLabel),
  benefits: benefitValues(doc.benefits, fallback.benefits),
  benefitsHeading: textValue(doc.benefitsHeading, fallback.benefitsHeading),
  contextBody: textValue(doc.contextBody, fallback.contextBody),
  contextHeading: textValue(doc.contextHeading, fallback.contextHeading),
  createAccountLabel: textValue(doc.createAccountLabel, fallback.createAccountLabel),
  eyebrow: textValue(doc.eyebrow, fallback.eyebrow),
  funnelEyebrow: textValue(doc.funnelEyebrow, fallback.funnelEyebrow),
  funnelHeading: textValue(doc.funnelHeading, fallback.funnelHeading),
  funnelLinks: funnelLinkValues(doc.funnelLinks, fallback.funnelLinks),
  headline: textValue(doc.headline, fallback.headline),
  intro: textValue(doc.intro, fallback.intro),
  messageLabel: textValue(doc.messageLabel, fallback.messageLabel),
  postSubmitBody: textValue(doc.postSubmitBody, fallback.postSubmitBody),
  postSubmitEyebrow: textValue(doc.postSubmitEyebrow, fallback.postSubmitEyebrow),
  postSubmitHeading: textValue(doc.postSubmitHeading, fallback.postSubmitHeading),
  secondaryIntro: textValue(doc.secondaryIntro, fallback.secondaryIntro),
  seoDescription: textValue(doc.seoDescription, fallback.seoDescription),
  seoTitle: textValue(doc.seoTitle, fallback.seoTitle),
  submitAnotherLabel: textValue(doc.submitAnotherLabel, fallback.submitAnotherLabel),
  submitLabel: textValue(doc.submitLabel, fallback.submitLabel),
})

const textValue = <T extends string | undefined>(value: unknown, fallback: T): T => {
  return typeof value === 'string' && value.trim() ? (value.trim() as T) : fallback
}

const benefitValues = (values: PageCopyDoc['benefits'], fallback: ProductPageCopy['benefits']) => {
  const benefits = values?.map((item) => item.body?.trim()).filter(Boolean) as string[] | undefined

  return benefits?.length ? benefits : fallback
}

const funnelLinkValues = (
  values: PageCopyDoc['funnelLinks'],
  fallback: ProductPageCopy['funnelLinks'],
) => {
  const links = values
    ?.map((item) => ({
      description: item.description?.trim() || '',
      href: item.href?.trim() || '',
      label: item.label?.trim() || '',
    }))
    .filter((item) => item.href && item.label)

  return links?.length ? links : fallback
}
