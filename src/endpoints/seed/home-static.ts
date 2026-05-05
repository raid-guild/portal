import type { Page } from '@/payload-types'

import { headingNode, lexicalRoot, lineBreakNode, paragraphNode, text } from './lexical'

// Used for pre-seeded content so that the homepage is not empty
// @ts-expect-error static fallback intentionally omits database-managed fields
export const homeStatic: Page = {
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'lowImpact',
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
      paragraphNode('Pledge now, or venture forth for the full tale.'),
    ]),
  },
  meta: {
    description:
      "RaidGuild's monthly cohort is a 4-week proving ground for builders entering the decentralized realm.",
    title: 'Forge Your Path. Earn Your Seat.',
  },
  title: 'Home',
}
