export type MarkdownSection = { body: string; heading?: string }

export const clean = (value: string): string => value.replace(/\s+/g, ' ').trim()

export const escape = (value: string): string =>
  clean(value).replace(/([\\[\]()*_`#|])/g, '\\$1')

export const joinSections = (sections: MarkdownSection[]): string =>
  sections
    .filter((section) => section.body.trim().length > 0)
    .map((section) =>
      section.heading ? `## ${escape(section.heading)}\n\n${section.body.trim()}` : section.body.trim(),
    )
    .join('\n\n')

export const internalHref = (relationTo: string, slugOrId: string | number): string =>
  `/${relationTo}/${slugOrId}`

const isPopulated = <T extends { id: number }>(
  ref: T | number | null | undefined,
): ref is T => typeof ref === 'object' && ref !== null

/** A metadata line: "**Status:** active · **Kind:** internal-tool" — pairs with an empty value are skipped. */
export const keyValueLine = (pairs: Array<[string, string | null | undefined]>): string =>
  pairs
    .filter((pair): pair is [string, string] => Boolean(pair[1]))
    .map(([label, value]) => `**${label}:** ${escape(value)}`)
    .join(' · ')

/** Bullet list of plain strings — covers single-field arrays (openQuestions, themes, ...). */
export const bulletListSection = (
  heading: string,
  items: Array<string | null | undefined> | null | undefined,
): MarkdownSection => ({
  body: (items ?? [])
    .filter((item): item is string => Boolean(item))
    .map((item) => `- ${escape(item)}`)
    .join('\n'),
  heading,
})

/** Bullet list of {label, url?, note?} — covers link-list-shaped fields (resources, links, furtherReading, ...). */
export const linkListSection = (
  heading: string,
  items: Array<{ label?: string | null; note?: string | null; url?: string | null }> | null | undefined,
): MarkdownSection => {
  const lines = (items ?? [])
    .filter((item) => item.label)
    .map((item) => {
      const link = item.url ? `[${escape(item.label as string)}](${item.url})` : escape(item.label as string)
      return item.note ? `- ${link} — ${escape(item.note)}` : `- ${link}`
    })

  return { body: lines.join('\n'), heading }
}

/** {heading?, body} entries rendered as bolded sub-headings over prose — covers programSections, currentState, ... */
export const entriesSection = (
  heading: string,
  items: Array<{ heading?: string | null; body?: string | null }> | null | undefined,
): MarkdownSection => {
  const blocks = (items ?? [])
    .filter((item) => item.body)
    .map((item) =>
      item.heading
        ? `**${escape(item.heading)}**\n\n${clean(item.body as string)}`
        : clean(item.body as string),
    )

  return { body: blocks.join('\n\n'), heading }
}

/** Free-text pill/topic arrays (not relationships) rendered as a comma list. */
export const pillListSection = (
  heading: string,
  items: Array<{ topic?: string | null } | string> | null | undefined,
): MarkdownSection => {
  const values = (items ?? [])
    .map((item) => (typeof item === 'string' ? item : item.topic))
    .filter((value): value is string => Boolean(value))

  return { body: values.map(escape).join(', '), heading }
}

/** Bullet list of relation docs (populated objects only — unpopulated ids are silently skipped). */
export const relationListSection = <T extends { id: number }>(
  heading: string,
  docs: Array<T | number | null | undefined> | null | undefined,
  describe: (doc: T) => { href?: string; label: string; meta?: string },
): MarkdownSection => {
  const lines = (docs ?? []).filter(isPopulated).map((doc) => {
    const { href, label, meta } = describe(doc)
    const link = href ? `[${escape(label)}](${href})` : escape(label)
    return meta ? `- ${link} — ${escape(meta)}` : `- ${link}`
  })

  return { body: lines.join('\n'), heading }
}

/** A single populated relation rendered as one link line (e.g. sourceSession, parentThread, highlightedThread). */
export const relationLine = <T extends { id: number }>(
  ref: T | number | null | undefined,
  describe: (doc: T) => { href?: string; label: string },
): string => {
  if (!isPopulated(ref)) return ''

  const { href, label } = describe(ref)
  return href ? `[${escape(label)}](${href})` : escape(label)
}
