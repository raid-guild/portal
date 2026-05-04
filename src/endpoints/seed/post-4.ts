import type { Post } from '@/payload-types'

export const post4: Partial<Post> = {
  slug: 'vendure-open-source-ecommerce',
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
              text: 'Discover how Vendure can revolutionize your e-commerce development and deployment process.',
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
              text: "In the ever-evolving world of e-commerce, finding the right platform can be a game-changer for your business. Today, we're excited to introduce you to Vendure, an open-source e-commerce solution that's been gaining traction in the developer community. Let's explore what makes Vendure stand out and how you can easily deploy it on Railway.",
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
              text: 'What is Vendure?',
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
              text: 'Vendure is a headless e-commerce framework built with TypeScript and Node.js. It provides a solid foundation for any commerce application, including inventory management, orders, customers, taxes, promotions, and more. What sets Vendure apart is its focus on developer experience and extensibility.',
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
              text: 'Key Features of Vendure',
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
              format: 1,
              mode: 'normal',
              style: '',
              text: 'Headless Architecture: ',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Allows for flexible front-end implementations',
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
              text: 'GraphQL API: ',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Powerful and efficient data querying',
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
              text: 'Admin UI: ',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Intuitive interface for managing your store',
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
            media: '{{IMAGE_1}}' // Changed from IMAGE_2 to IMAGE_1 to avoid using multiple images
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
              text: 'Deploying Vendure on Railway',
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
              text: "To make it easier for developers to get started with Vendure, we've created a one-click deploy template for Railway. This template sets up everything you need to run a Vendure store, including:",
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
              text: '• Complete Setup: ',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Vendure backend, admin dashboard, and storefront',
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
              text: '• Built-in Features: ',
              version: 1
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Asset storage and pre-installed plugins for Stripe payment and Sendgrid email',
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
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Ready to get started? Check out our full tutorial on deploying Vendure on Railway: ',
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
                  text: 'Vendure Deployment Tutorial',
                  version: 1
                }
              ],
              direction: 'ltr',
              fields: {
                linkType: 'custom',
                newTab: true,
                url: 'https://funkyton.com/vendure-tutorial/'
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
              format: 0,
              mode: 'normal',
              style: '',
              text: 'For those who want to explore the code, you can find our Vendure boilerplate on GitHub: ',
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
                  text: 'Vendure Railway Boilerplate',
                  version: 1
                }
              ],
              direction: 'ltr',
              fields: {
                linkType: 'custom',
                newTab: true,
                url: 'https://github.com/rpuls/vendure-boilerplate'
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
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Conclusion',
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
              text: "Vendure offers a powerful, flexible solution for businesses looking to build or upgrade their e-commerce platform. With its focus on developer experience and extensibility, it's an excellent choice for teams that want to create unique, tailored shopping experiences. By leveraging our Railway template, you can have a Vendure store up and running in no time, allowing you to focus on what matters most - growing your business.",
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
    description: 'Discover how Vendure can revolutionize your e-commerce development and deployment process.',
    // @ts-ignore
    image: '{{IMAGE_1}}',
    title: 'Vendure: A Powerful Open-Source E-commerce Solution'
  },
  relatedPosts: [], // this is populated by the seed script
  title: 'Vendure: A Powerful Open-Source E-commerce Solution'
}
