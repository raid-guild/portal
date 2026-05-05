import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  headingNode,
  horizontalRuleNode,
  lexicalRoot,
  lineBreakNode,
  paragraphNode,
  text,
} from './lexical'

export const home: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'highImpact',
    links: [
      {
        link: {
          type: 'custom',
          appearance: 'default',
          label: 'Pledge now',
          url: '/contact',
        },
      },
      {
        link: {
          type: 'custom',
          appearance: 'outline',
          label: 'Venture forth',
          url: '/posts',
        },
      },
    ],
    // @ts-expect-error seeded media placeholder is resolved during the seed run
    media: '{{IMAGE_1}}',
    richText: lexicalRoot([
      headingNode('h1', [
        text('FORGE YOUR PATH.'),
        lineBreakNode(),
        text('EARN YOUR SEAT.'),
      ]),
      paragraphNode(
        "RaidGuild's monthly cohort is a 4-week proving ground where you embark on real projects, train with battle-tested builders, and claim your place in the premier design and dev collective of the decentralized realm.",
      ),
      paragraphNode('Cohorts launch on the first Monday of each month. Limited seats.'),
    ]),
  },
  layout: [
    {
      blockName: 'Cohort invitation',
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: lexicalRoot([
            horizontalRuleNode(),
            headingNode('h2', [text('Pledge now, or venture forth for the full tale.')]),
          ]),
          enableLink: true,
          link: {
            type: 'custom',
            appearance: 'default',
            label: 'Start the journey',
            url: '/contact',
          },
        },
      ],
    },
  ],
  meta: {
    description:
      "RaidGuild's monthly cohort is a 4-week proving ground for builders entering the decentralized realm.",
    // @ts-expect-error seeded media placeholder is resolved during the seed run
    image: '{{IMAGE_1}}',
    title: 'Forge Your Path. Earn Your Seat.',
  },
  title: 'Home',
}
