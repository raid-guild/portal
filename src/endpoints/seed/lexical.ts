type LexicalNode = {
  [k: string]: unknown
  type: string
  version: number
}

const textNode = (text: string) =>
  ({
    type: 'text',
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text,
    version: 1,
  }) satisfies LexicalNode

export const lexicalRoot = (children: LexicalNode[]) => ({
  root: {
    type: 'root',
    children,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

export const headingNode = (tag: 'h1' | 'h2' | 'h3' | 'h4', children: LexicalNode[]) =>
  ({
    type: 'heading',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    tag,
    version: 1,
  }) satisfies LexicalNode

export const lineBreakNode = () =>
  ({
    type: 'linebreak',
    version: 1,
  }) satisfies LexicalNode

export const horizontalRuleNode = () =>
  ({
    type: 'horizontalrule',
    version: 1,
  }) satisfies LexicalNode

export const paragraphNode = (text: string) =>
  ({
    type: 'paragraph',
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }) satisfies LexicalNode

export const text = textNode
