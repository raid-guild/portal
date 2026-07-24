import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { InquiryForm } from '../../_components/InquiryForm'
import { getInquiryPageCopy, inquiryPageFallbacks, type InquiryType } from '@/utilities/pageCopy'

type Args = {
  params: Promise<{
    type: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const isInquiryType = (type: string): type is InquiryType => type in inquiryPageFallbacks

export default async function InquiryPage({ params, searchParams }: Args) {
  const { type } = await params

  if (!isInquiryType(type)) notFound()

  const copy = await getInquiryPageCopy(type)
  const query = (await searchParams) || {}
  const initialMessage = getCohortInitialMessage(type, query)

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 portal-kicker">{copy.eyebrow}</p>
          <h1 className="portal-title-lg">{copy.headline}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{copy.intro}</p>
          <div className="mt-8 border border-border p-5 text-sm leading-6 text-muted-foreground">
            <p className="font-bold text-foreground">{copy.contextHeading}</p>
            <p className="mt-3">{copy.contextBody}</p>
          </div>
          <Link className="portal-link mt-8 inline-flex" href="/join">
            {copy.backLinkLabel}
          </Link>
        </div>
        <InquiryForm
          createAccountLabel={copy.createAccountLabel}
          initialMessage={initialMessage}
          messageLabel={copy.messageLabel || 'What should we know?'}
          postSubmitBody={copy.postSubmitBody}
          postSubmitEyebrow={copy.postSubmitEyebrow}
          postSubmitHeading={copy.postSubmitHeading}
          sourceRoute={`/inquire/${type}`}
          submitAnotherLabel={copy.submitAnotherLabel}
          submitLabel={copy.submitLabel}
          type={type}
        />
      </section>
    </main>
  )
}

const getCohortInitialMessage = (
  type: InquiryType,
  query: Record<string, string | string[] | undefined>,
) => {
  if (type !== 'general' || query.context !== 'cohort-interest') return undefined

  const rawLabel = typeof query.cohortTitle === 'string' ? query.cohortTitle : 'a future cohort'
  const cohortLabel = rawLabel
    .replace(/[^\p{L}\p{N} .,'&():-]/gu, '')
    .trim()
    .slice(0, 100)
  const safeLabel = cohortLabel || 'a future cohort'

  return query.intent === 'suggest-topic'
    ? `I would like to suggest a future topic for ${safeLabel}: `
    : `I'm interested in ${safeLabel}.`
}

export function generateStaticParams() {
  return Object.keys(inquiryPageFallbacks).map((type) => ({ type }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { type } = await params

  if (!isInquiryType(type)) {
    return {
      description: 'The requested RaidGuild inquiry type could not be found.',
      title: 'Inquiry not found',
    }
  }

  const copy = await getInquiryPageCopy(type)

  return {
    description: copy.seoDescription,
    title: copy.seoTitle,
  }
}
