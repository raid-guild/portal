import { clean } from './markdownPrimitives'

type LexicalRichText = { root?: { children?: LexicalNode[] } } | null | undefined

type LexicalNode = {
  checked?: boolean
  children?: LexicalNode[]
  fields?: Record<string, unknown>
  format?: number | string
  listType?: string
  tag?: string
  text?: string
  type?: string
  value?: unknown
}

const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_STRIKETHROUGH = 1 << 2
const IS_CODE = 1 << 4

const STYLE_LABEL: Record<string, string> = {
  error: 'Error',
  info: 'Note',
  success: 'Success',
  warning: 'Warning',
}

/** Escapes markdown-syntax characters in inline text without touching whitespace. */
const escapeInline = (value: string): string => value.replace(/([\\[\]()*_`#|])/g, '\\$1')

const renderInline = (nodes: LexicalNode[] | undefined): string =>
  (nodes ?? []).map(renderInlineNode).join('')

const renderInlineNode = (node: LexicalNode): string => {
  switch (node.type) {
    case 'text':
      return renderText(node)
    case 'linebreak':
      return '  \n'
    case 'link':
    case 'autolink':
      return renderLink(node)
    default:
      return renderInline(node.children)
  }
}

const renderText = (node: LexicalNode): string => {
  const raw = node.text ?? ''
  if (!raw) return ''

  const format = Number(node.format ?? 0)

  if (format & IS_CODE) return `\`${raw.replace(/`/g, 'ˋ')}\``

  let out = escapeInline(raw)
  if (format & IS_BOLD) out = `**${out}**`
  if (format & IS_ITALIC) out = `*${out}*`
  if (format & IS_STRIKETHROUGH) out = `~~${out}~~`

  return out
}

const resolveLinkHref = (fields: Record<string, unknown>): string => {
  const doc = fields.doc as { relationTo?: string; value?: unknown } | undefined

  if (fields.linkType === 'internal' && doc && typeof doc.value === 'object' && doc.value !== null) {
    const value = doc.value as { slug?: string }
    if (doc.relationTo && value.slug) {
      return doc.relationTo === 'pages' ? `/${value.slug}` : `/${doc.relationTo}/${value.slug}`
    }
  }

  return typeof fields.url === 'string' ? fields.url : ''
}

const renderLink = (node: LexicalNode): string => {
  const text = renderInline(node.children).trim()
  const href = resolveLinkHref(node.fields ?? {})
  if (!href) return text

  return `[${text || href}](${href})`
}

const renderUpload = (node: LexicalNode): string => {
  const media = node.value
  if (!media || typeof media !== 'object') return ''

  const { alt, url } = media as { alt?: string | null; url?: string | null }
  if (!url) return ''

  return `![${(alt ?? '').replace(/[[\]]/g, '')}](${url})`
}

const renderListItems = (
  items: LexicalNode[],
  ordered: boolean,
  checklist: boolean,
  depth: number,
): string => {
  const indent = '  '.repeat(depth)
  let ordinal = 0

  return items
    .filter((item) => item.type === 'listitem')
    .map((item) => {
      const nestedLists = (item.children ?? []).filter((child) => child.type === 'list')
      const inlineChildren = (item.children ?? []).filter((child) => child.type !== 'list')
      const text = renderInline(inlineChildren).trim()

      let marker: string
      if (checklist) {
        marker = `- [${item.checked ? 'x' : ' '}]`
      } else if (ordered) {
        ordinal += 1
        marker = `${ordinal}.`
      } else {
        marker = '-'
      }

      const line = text ? `${indent}${marker} ${text}` : ''
      const nested = nestedLists.map((list) => renderNode(list, depth + 1)).join('\n')

      return [line, nested].filter(Boolean).join('\n')
    })
    .filter(Boolean)
    .join('\n')
}

const renderBanner = (fields: Record<string, unknown>): string => {
  const style = typeof fields.style === 'string' ? fields.style : 'info'
  const label = STYLE_LABEL[style] ?? 'Note'
  const content = fields.content as { root?: { children?: LexicalNode[] } } | undefined
  const body = content?.root?.children ? renderBlocks(content.root.children) : ''
  if (!body) return ''

  return body
    .split('\n')
    .map((line, index) => (index === 0 ? `> **${label}:** ${line}` : `> ${line}`))
    .join('\n')
}

const renderCode = (fields: Record<string, unknown>): string => {
  const code = typeof fields.code === 'string' ? fields.code : ''
  if (!code.trim()) return ''

  const language = typeof fields.language === 'string' ? fields.language : ''
  return `\`\`\`${language}\n${code}\n\`\`\``
}

const renderMediaBlock = (fields: Record<string, unknown>): string => {
  const media = fields.media
  if (!media || typeof media !== 'object') return ''

  const { alt, caption, url } = media as {
    alt?: string | null
    caption?: { root?: { children?: LexicalNode[] } } | null
    url?: string | null
  }
  if (!url) return ''

  const image = `![${(alt ?? '').replace(/[[\]]/g, '')}](${url})`
  const captionText = caption?.root?.children ? renderInline(caption.root.children).trim() : ''

  return captionText ? `${image}\n*${captionText}*` : image
}

const renderInteractiveEmbed = (fields: Record<string, unknown>): string => {
  const url = typeof fields.url === 'string' ? fields.url : ''
  if (!url) return ''

  const title = typeof fields.title === 'string' && fields.title ? fields.title : 'Interactive artifact'
  const caption = typeof fields.caption === 'string' ? fields.caption : ''
  const link = `[${escapeInline(title)}](${url})`

  return caption ? `${link}\n${escapeInline(caption)}` : link
}

const renderBlockFields = (node: LexicalNode): string => {
  const fields = node.fields ?? {}

  switch (fields.blockType) {
    case 'banner':
      return renderBanner(fields)
    case 'code':
      return renderCode(fields)
    case 'mediaBlock':
      return renderMediaBlock(fields)
    case 'interactiveEmbed':
      return renderInteractiveEmbed(fields)
    default:
      return ''
  }
}

const renderNode = (node: LexicalNode, listDepth = 0): string => {
  switch (node.type) {
    case 'paragraph':
      return renderInline(node.children).trim()
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number((node.tag ?? 'h2').replace('h', '')) || 2))
      const text = renderInline(node.children).trim()
      return text ? `${'#'.repeat(level)} ${text}` : ''
    }
    case 'horizontalrule':
      return '---'
    case 'quote': {
      const text = renderInline(node.children).trim()
      return text
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    }
    case 'list': {
      const ordered = node.tag === 'ol'
      const checklist = node.listType === 'check'
      return renderListItems(node.children ?? [], ordered, checklist, listDepth)
    }
    case 'upload':
      return renderUpload(node)
    case 'block':
      return renderBlockFields(node)
    default:
      return node.children ? renderBlocks(node.children) : ''
  }
}

const renderBlocks = (nodes: LexicalNode[] | undefined): string =>
  (nodes ?? [])
    .map((node) => renderNode(node))
    .filter((chunk) => chunk.trim().length > 0)
    .join('\n\n')

/** Full markdown rendering of a Payload Lexical richText field, including custom blocks. */
export const renderLexical = (richText: LexicalRichText): string => renderBlocks(richText?.root?.children)

const flattenText = (nodes: LexicalNode[] | undefined): string[] =>
  (nodes ?? []).flatMap((node) => {
    if (node.type === 'text') return node.text ? [node.text] : []
    if (node.type === 'block') {
      const fields = node.fields ?? {}
      if (fields.blockType === 'interactiveEmbed' && typeof fields.title === 'string') {
        return [fields.title]
      }
      return []
    }
    return flattenText(node.children)
  })

/** A short plain-text excerpt of a richText field, for list-view summaries (no summary field exists on Posts). */
export const lexicalToPlainExcerpt = (richText: LexicalRichText, maxLength = 220): string => {
  const text = clean(flattenText(richText?.root?.children).join(' '))
  if (text.length <= maxLength) return text

  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}
