import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import {
  createContentReactions,
  deleteContentReactions,
  readContentReactions,
  updateContentReactions,
} from '@/access/contentReactions'
import { getRelationshipID } from '@/access/projectStewards'
import { canEditContent, hideFromNonEditors } from '@/access/roles'
import type { ContentReaction } from '@/payload-types'
import { REACTABLE_COLLECTIONS, REACTABLE_COLLECTION_SLUGS } from '@/utilities/contentReactions'

/**
 * Forces `user` to the requester's own id for non-editors (defense in depth — the
 * route already sets it correctly), and rejects a bookmark that has no resolved user.
 * Editors keep the ability to set an explicit `user` for admin-side data correction.
 */
const forceActorAndValidateBookmark: CollectionBeforeValidateHook<ContentReaction> = ({
  data,
  operation,
  req,
}) => {
  if (!data) return data
  if (operation !== 'create') return data

  const requesterCanEdit = canEditContent(req.user)
  const userID = requesterCanEdit ? getRelationshipID(data.user) ?? req.user?.id : req.user?.id

  const nextData = {
    ...data,
    user: userID ?? null,
  }

  if (nextData.kind === 'bookmark' && !userID) {
    throw new Error('Bookmarks require a signed-in member.')
  }

  return nextData
}

export const ContentReactions: CollectionConfig = {
  slug: 'contentReactions',
  access: {
    create: createContentReactions,
    delete: deleteContentReactions,
    read: readContentReactions,
    update: updateContentReactions,
  },
  admin: {
    defaultColumns: ['kind', 'actorType', 'targetCollection', 'targetId', 'user', 'createdAt'],
    description:
      'Likes and bookmarks on posts, events, projects, threads, and wiki pages. Written only through the reactions API route.',
    group: 'Portal',
    hidden: hideFromNonEditors,
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      index: true,
      options: [
        { label: 'Like', value: 'like' },
        { label: 'Bookmark', value: 'bookmark' },
      ],
      required: true,
    },
    {
      name: 'actorType',
      type: 'select',
      admin: {
        description: 'Denormalised for simple analytics grouping.',
      },
      index: true,
      options: [
        { label: 'Member', value: 'member' },
        { label: 'Anonymous', value: 'anonymous' },
      ],
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      admin: {
        description: 'Null for anonymous likes.',
        position: 'sidebar',
      },
      index: true,
      relationTo: 'users',
    },
    {
      name: 'profile',
      type: 'relationship',
      admin: {
        description: "Snapshot of the member's profile, for profile-level joins.",
        position: 'sidebar',
      },
      relationTo: 'profiles',
    },
    {
      name: 'anonymousId',
      type: 'text',
      admin: {
        description: "The visitor's portal_anon_id cookie value. Set only for anonymous likes.",
      },
      index: true,
    },
    {
      name: 'targetCollection',
      type: 'select',
      index: true,
      options: REACTABLE_COLLECTION_SLUGS.map((slug) => ({
        label: REACTABLE_COLLECTIONS[slug].label,
        value: slug,
      })),
      required: true,
    },
    {
      name: 'targetId',
      type: 'number',
      index: true,
      required: true,
    },
    {
      name: 'ipHash',
      type: 'text',
      admin: {
        description: 'Salted SHA-256 hash of the request IP, for abuse analysis only.',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [forceActorAndValidateBookmark],
  },
  // No config `indexes`: uniqueness here needs two PARTIAL unique indexes (one for
  // member rows, one for anonymous rows), which Payload's config indexes can't
  // express. They're declared directly in the migration SQL — same situation as
  // DailyEngagements.
  timestamps: true,
}
