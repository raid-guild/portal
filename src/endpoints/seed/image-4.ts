import type { Media } from '@/payload-types'

export const image4: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
  alt: 'Vendure on railway Cover',
  caption: {
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
              text: 'Graphic by ',
              version: 1,
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
                  text: 'FUNKYTON',
                  version: 1,
                },
              ],
              direction: 'ltr',
              fields: {
                linkType: 'custom',
                newTab: true,
                url: 'https://funkyton.com/vendure-tutorial/',
              },
              format: '',
              indent: 0,
              version: 2,
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: ' on ',
              version: 1,
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
                  text: 'FUNKYTON',
                  version: 1,
                },
              ],
              direction: 'ltr',
              fields: {
                linkType: 'custom',
                newTab: true,
                url: 'https://res-1.cloudinary.com/hczpmiapo/image/upload/q_auto/v1/ghost-blog-images/vendure-cover.png',
              },
              format: '',
              indent: 0,
              version: 2,
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '.',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  },
}
