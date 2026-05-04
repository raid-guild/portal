import type { Post } from '@/payload-types'

export const post2: Partial<Post> = {
  slug: 'getting-started-payload-cms',
  _status: 'published',
  // @ts-ignore
  authors: ['{{AUTHOR}}'],
  content: {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Learn how to use and customize the Payload CMS Website Template for your projects.',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h2',
          version: 1
        },
        {
          type: 'block',
          fields: {
            blockName: 'Disclaimer',
            blockType: 'banner',
            content: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 1,
                        mode: 'normal',
                        style: '',
                        text: 'Disclaimer:',
                        version: 1
                      },
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: ' This content demonstrates the features of Payload CMS. To edit this post, ',
                        version: 1
                      },
                      {
                        type: 'link',
                        children: [
                          {
                            type: 'text',
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'navigate to the admin dashboard',
                            version: 1
                          }
                        ],
                        direction: 'ltr',
                        fields: {
                          linkType: 'custom',
                          newTab: true,
                          url: '/admin'
                        },
                        format: '',
                        indent: 0,
                        version: 3
                      },
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: '.',
                        version: 1
                      }
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 1,
                    version: 1
                  }
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1
              }
            },
            style: 'info'
          },
          format: '',
          version: 2
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: "Welcome to the Payload CMS Website Template! This powerful and flexible template is designed to help you quickly set up and customize your website. In this guide, we'll walk you through the key features and how to get started.",
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1
        },
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Key Features',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h2',
          version: 1
        },
        {
          type: 'block',
          fields: {
            blockName: '',
            blockType: 'mediaBlock',
            media: '{{IMAGE_1}}'
          },
          format: '',
          version: 2
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 1,
              mode: 'normal',
              style: '',
              text: 'Pre-configured Payload Config: ',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Start with a robust foundation for your CMS.',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 1,
              mode: 'normal',
              style: '',
              text: 'Authentication and Access Control: ',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Secure your content with built-in user management.',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 1,
              mode: 'normal',
              style: '',
              text: 'Layout Builder: ',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Create dynamic page layouts with a flexible block-based system.',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1
        },
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Getting Started',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h2',
          version: 1
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'To get started with the Payload CMS Website Template, follow these steps:',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 1,
              mode: 'normal',
              style: '',
              text: '1. Clone the repository: ',
              version: 1
            },
            {
              type: 'link',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Payload CMS Boilerplate',
                  version: 1
                }
              ],
              direction: 'ltr',
              fields: {
                linkType: 'custom',
                newTab: true,
                url: 'https://github.com/rpuls/payload-cms-boilerplate'
              },
              format: '',
              indent: 0,
              version: 3
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 1,
              mode: 'normal',
              style: '',
              text: '2. Install dependencies: ',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Run `yarn install` or `npm install`',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 1,
              mode: 'normal',
              style: '',
              text: '3. Set up environment variables',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 1,
              mode: 'normal',
              style: '',
              text: '4. Start development: ',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Run `yarn dev` or `npm run dev`',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1
        },
        {
          type: 'block',
          fields: {
            blockName: '',
            blockType: 'mediaBlock',
            media: '{{IMAGE_2}}'
          },
          format: '',
          version: 2
        },
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Customization and Deployment',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h2',
          version: 1
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'The template is highly customizable. You can modify collections, add new ones, and customize the layout builder. Check out the ',
              version: 1
            },
            {
              type: 'link',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Payload CMS documentation',
                  version: 1
                }
              ],
              direction: 'ltr',
              fields: {
                linkType: 'custom',
                newTab: true,
                url: 'https://payloadcms.com/docs'
              },
              format: '',
              indent: 0,
              version: 3
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: ' for detailed information on extending your project.',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1
        }
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1
    }
  },
  meta: {
    description: 'Learn how to use and customize the Payload CMS Website Template for your projects.',
    // @ts-ignore
    image: '{{IMAGE_1}}',
    title: 'Getting Started with Payload CMS Website Template'
  },
  relatedPosts: [], // this is populated by the seed script
  title: 'Getting Started with Payload CMS Website Template'
}
