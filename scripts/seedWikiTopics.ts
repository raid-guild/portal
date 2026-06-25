import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { seedWikiTopicTree } from '@/endpoints/seed/portal'

const apply = process.argv.includes('--apply') || process.env.WIKI_TOPIC_SEED_APPLY === 'true'

if (!apply) {
  console.log(`Wiki topic seed dry run.

This script only seeds the initial wikiTopics tree and links topics to existing wikiPages by slug.
Run with --apply or WIKI_TOPIC_SEED_APPLY=true to write records.`)
  process.exit(0)
}

const payload = await getPayload({ config: configPromise })

const before = await payload.find({
  collection: 'wikiTopics',
  depth: 0,
  limit: 1,
  overrideAccess: true,
})

await seedWikiTopicTree(payload)

const after = await payload.find({
  collection: 'wikiTopics',
  depth: 0,
  limit: 1,
  overrideAccess: true,
})

console.log(
  JSON.stringify(
    {
      afterTotal: after.totalDocs,
      beforeTotal: before.totalDocs,
      seeded: true,
    },
    null,
    2,
  ),
)
