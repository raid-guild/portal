type RichTextNode = {
  children?: RichTextNode[]
  fields?: Record<string, unknown>
  format?: number
  tag?: string
  text?: string
  type?: string
  value?: unknown
}

type MediaLike = {
  alt?: string
  caption?: {
    root?: {
      children?: RichTextNode[]
    }
  }
  sizes?: Record<string, { url?: string } | undefined>
  url?: string
}

type RenderContext = {
  portalURL: string
}

type RenderPortalPostEmailArgs = {
  portalURL: string
  post: {
    content?: {
      root?: {
        children?: RichTextNode[]
      }
    }
    slug?: string | null
    title?: string | null
  }
  preheader?: string
  subject: string
}

export type RenderedPortalPostEmail = {
  html: string
  postURL: string
  text: string
}

export const renderPortalPostEmail = ({
  portalURL,
  post,
  preheader,
  subject,
}: RenderPortalPostEmailArgs): RenderedPortalPostEmail => {
  const slug = stringValue(post.slug) || ''
  const postURL = slug ? `${portalURL}/posts/${slug}` : portalURL
  const nodes = post.content?.root?.children || []
  const context = { portalURL }
  const chunks: string[] = []

  if (preheader) {
    chunks.push(
      `<span style="display:none!important;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHTML(preheader)}</span>`,
    )
  }

  chunks.push(
    `<p style="margin:0 0 12px;color:#d7a846;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">RaidGuild Update</p>`,
  )
  chunks.push(
    `<h1 style="margin:0 0 20px;color:#fff6df;font-size:32px;line-height:1.15;">${escapeHTML(subject)}</h1>`,
  )
  chunks.push(renderNodes(nodes, context))
  chunks.push(
    `<p style="margin:32px 0 0;"><a href="${escapeAttribute(postURL)}" style="display:inline-block;background:#d7a846;color:#16110d;padding:13px 18px;text-decoration:none;font-size:13px;font-weight:700;">Open in Portal</a></p>`,
  )

  const html = chunks.filter(Boolean).join('\n')
  const text = htmlToText(`${subject}\n\n${renderText(nodes)}\n\n${postURL}`)

  return { html, postURL, text }
}

const renderNodes = (nodes: RichTextNode[] | undefined, context: RenderContext): string => {
  if (!Array.isArray(nodes)) return ''

  return nodes
    .map((node) => renderNode(node, context))
    .filter(Boolean)
    .join('\n')
}

const renderNode = (node: RichTextNode, context: RenderContext): string => {
  if (!node || typeof node !== 'object') return ''

  switch (node.type) {
    case 'text':
      return renderFormattedText(node)
    case 'linebreak':
      return '<br />'
    case 'paragraph': {
      const children = renderNodes(node.children, context).trim()
      if (!children) return ''

      return `<p style="margin:0 0 16px;color:#f6efe2;font-size:16px;line-height:1.65;">${children}</p>`
    }
    case 'heading': {
      const children = renderNodes(node.children, context).trim()
      if (!children) return ''

      const tag = ['h1', 'h2', 'h3', 'h4'].includes(node.tag || '') ? node.tag : 'h2'
      const styles = {
        h1: 'font-size:30px;line-height:1.18;margin:30px 0 14px;',
        h2: 'font-size:24px;line-height:1.25;margin:30px 0 12px;',
        h3: 'font-size:20px;line-height:1.3;margin:26px 0 10px;',
        h4: 'font-size:17px;line-height:1.35;margin:22px 0 10px;',
      }
      const style = styles[tag as keyof typeof styles]

      return `<${tag} style="${style}color:#fff6df;">${children}</${tag}>`
    }
    case 'list': {
      const tag = node.tag === 'ol' ? 'ol' : 'ul'
      const children = renderNodes(node.children, context).trim()
      if (!children) return ''

      return `<${tag} style="margin:0 0 18px 22px;padding:0;color:#f6efe2;font-size:16px;line-height:1.6;">${children}</${tag}>`
    }
    case 'listitem':
      return `<li style="margin:0 0 8px;">${renderNodes(node.children, context)}</li>`
    case 'quote': {
      const children = renderNodes(node.children, context).trim()
      if (!children) return ''

      return `<blockquote style="margin:22px 0;padding:14px 18px;border-left:3px solid #d7a846;background:#25211d;color:#f6efe2;">${children}</blockquote>`
    }
    case 'autolink':
    case 'link': {
      const url = safeURL(stringValue(node.fields?.url), context.portalURL)
      const children = renderNodes(node.children, context).trim() || escapeHTML(url)
      if (!url) return children

      return `<a href="${escapeAttribute(url)}" style="color:#d7a846;text-decoration:underline;">${children}</a>`
    }
    case 'upload':
      return renderMedia(node.value, context)
    case 'block': {
      const block = node.fields || {}

      if (block.blockType === 'mediaBlock') return renderMedia(block.media, context)
      if (block.blockType === 'banner') return renderBanner(block, context)
      if (block.blockType === 'code') return renderCode(block)

      return ''
    }
    default:
      return renderNodes(node.children, context)
  }
}

const renderFormattedText = (node: RichTextNode): string => {
  let html = escapeHTML(node.text || '')
  const format = Number(node.format || 0)

  if (format & 1) html = `<strong>${html}</strong>`
  if (format & 2) html = `<em>${html}</em>`
  if (format & 4) html = `<s>${html}</s>`
  if (format & 8) html = `<u>${html}</u>`
  if (format & 16) html = `<code>${html}</code>`

  return html
}

const renderMedia = (media: unknown, context: RenderContext): string => {
  if (!media || typeof media !== 'object') return ''

  const mediaObject = media as MediaLike
  const url = absoluteURL(
    mediaObject.url ||
      mediaObject.sizes?.large?.url ||
      mediaObject.sizes?.medium?.url ||
      mediaObject.sizes?.thumbnail?.url,
    context.portalURL,
  )

  if (!url) return ''

  const alt = escapeAttribute(mediaObject.alt || '')
  const caption = mediaObject.caption?.root?.children?.length
    ? `<div style="margin:8px 0 22px;color:#b8ad9b;font-size:13px;line-height:1.5;">${renderNodes(mediaObject.caption.root.children, context)}</div>`
    : ''

  return `
<figure style="margin:24px 0;">
  <img src="${escapeAttribute(url)}" alt="${alt}" style="display:block;width:100%;max-width:620px;height:auto;border:1px solid #3b3328;" />
  ${caption}
</figure>`.trim()
}

const renderBanner = (block: Record<string, unknown>, context: RenderContext): string => {
  const content = getLexicalChildren(block.content).length
    ? renderNodes(getLexicalChildren(block.content), context)
    : escapeHTML(stringValue(block.text))

  return `<div style="margin:22px 0;padding:16px 18px;background:#25211d;border:1px solid #3b3328;color:#f6efe2;">${content}</div>`
}

const renderCode = (block: Record<string, unknown>): string =>
  `<pre style="margin:22px 0;padding:16px;background:#0d0c0b;color:#f6efe2;overflow:auto;"><code>${escapeHTML(stringValue(block.code))}</code></pre>`

const renderText = (nodes: RichTextNode[] | undefined): string => {
  if (!Array.isArray(nodes)) return ''

  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object') return ''
      if (node.type === 'text') return node.text || ''
      if (node.type === 'upload') return ''

      return renderText(node.children || getLexicalChildren(node.fields?.content))
    })
    .filter(Boolean)
    .join(' ')
}

const getLexicalChildren = (value: unknown): RichTextNode[] => {
  if (!value || typeof value !== 'object') return []

  const root = (value as { root?: { children?: RichTextNode[] } }).root

  return Array.isArray(root?.children) ? root.children : []
}

const htmlToText = (value: string): string =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h1|h2|h3|h4|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const safeURL = (value: string, baseURL: string): string => {
  if (!value) return ''

  try {
    const url = new URL(value, baseURL)

    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

const absoluteURL = (value: string | undefined, baseURL: string): string => {
  if (!value) return ''

  try {
    return new URL(value, baseURL).toString()
  } catch {
    return ''
  }
}

const stringValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const escapeHTML = (value: string): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const escapeAttribute = (value: string): string => escapeHTML(value).replace(/`/g, '&#96;')
