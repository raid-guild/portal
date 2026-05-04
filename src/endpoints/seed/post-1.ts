import type { Post } from '@/payload-types'

export const post1: Partial<Post> = {
  slug: 'exploring-payload-cms',
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
              text: 'Discover the features and flexibility of Payload CMS for building modern websites.',
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
            style: 'info'
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
              text: 'Key Features of Payload CMS',
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
              text: 'Payload CMS is a powerful and flexible content management system that empowers developers to build robust and scalable websites. Here are some of its standout features:',
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
              text: 'Headless Architecture:',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: ' Freedom to use any front-end technology you prefer, giving you maximum flexibility in your development approach.',
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
              text: 'TypeScript Support:',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: ' Built-in type safety and enhanced development experience for more reliable code.',
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
              text: 'Customizable Admin UI:',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: ' Tailor the admin interface to your specific needs and workflow requirements.',
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
              text: 'Powerful Access Control:',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: ' Fine-grained permissions and robust security features to protect your content.',
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
            media: '{{IMAGE_1}}'
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
              text: 'Why Choose Payload CMS?',
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
              text: 'Payload CMS offers a unique combination of flexibility and ease of use. Its headless architecture allows you to use any front-end technology you prefer, while its powerful admin UI makes content management a breeze.',
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
            blockName: 'Premium Content',
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
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Advanced Payload CMS Techniques',
                        version: 1
                      }
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    tag: 'h3',
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
                        text: "In this premium section, we'll dive deeper into advanced Payload CMS techniques, including custom field types, hooks, and API customization. These insights will help you leverage the full power of Payload CMS in your projects.",
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
            style: 'success'
          },
          format: '',
          version: 2
        }
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1
    }
  },
  meta: {
    description: 'Discover the features and flexibility of Payload CMS for building modern websites.',
    // @ts-ignore
    image: '{{IMAGE_1}}',
    title: 'Exploring the Power of Payload CMS'
  },
  relatedPosts: [], // this is populated by the seed script
  title: 'Exploring the Power of Payload CMS'
}
