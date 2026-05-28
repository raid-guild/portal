import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { readVisiblePortalContent } from '@/access/portalVisibility'
import { createPosts, deletePosts, updatePosts } from '@/access/posts'
import { hasRole } from '@/access/roles'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { enforcePostWorkflow } from './hooks/enforcePostWorkflow'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidatePost } from './hooks/revalidatePost'
import { validateSafeURL } from '@/utilities/safeURL'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from '@/fields/slug'
import { getServerSideURL } from '@/utilities/getURL'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  access: {
    create: createPosts,
    delete: deletePosts,
    read: readVisiblePortalContent,
    update: updatePosts,
  },
  // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    defaultColumns: ['title', 'slug', 'visibility', '_status', 'publishedAt', 'updatedAt'],
    livePreview: {
      url: ({ data }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: 'posts',
        })

        return `${getServerSideURL()}${path}`
      },
    },
    preview: (data) => {
      const path = generatePreviewPath({
        slug: typeof data?.slug === 'string' ? data.slug : '',
        collection: 'posts',
      })

      return `${getServerSideURL()}${path}`
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'content',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'contentType',
              type: 'select',
              admin: {
                position: 'sidebar',
              },
              defaultValue: 'article',
              options: [
                {
                  label: 'Article',
                  value: 'article',
                },
                {
                  label: 'Recap',
                  value: 'recap',
                },
                {
                  label: 'Quote',
                  value: 'quote',
                },
                {
                  label: 'Clip',
                  value: 'clip',
                },
                {
                  label: 'Lesson',
                  value: 'lesson',
                },
                {
                  label: 'Announcement',
                  value: 'announcement',
                },
                {
                  label: 'Newsletter',
                  value: 'newsletter',
                },
              ],
            },
            {
              name: 'artifactKind',
              type: 'select',
              admin: {
                position: 'sidebar',
              },
              defaultValue: 'article',
              options: [
                {
                  label: 'Article',
                  value: 'article',
                },
                {
                  label: 'Embed',
                  value: 'embed',
                },
                {
                  label: 'Note',
                  value: 'note',
                },
              ],
            },
            {
              name: 'sourceSession',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              relationTo: 'events',
            },
            {
              name: 'parentThread',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              relationTo: 'threads',
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'derivedFromPosts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
            {
              name: 'visibility',
              type: 'select',
              access: {
                create: ({ req: { user } }) => hasRole(user, ['admin', 'editor', 'agent']),
                update: ({ req: { user } }) => hasRole(user, ['admin', 'editor', 'agent']),
              },
              admin: {
                position: 'sidebar',
              },
              defaultValue: 'public',
              options: [
                {
                  label: 'Public',
                  value: 'public',
                },
                {
                  label: 'Authenticated',
                  value: 'authenticated',
                },
                {
                  label: 'Members',
                  value: 'member',
                },
                {
                  label: 'Admin only',
                  value: 'admin',
                },
              ],
              required: true,
            },
            {
              name: 'wikiCandidate',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'wikiCandidateTopics',
              type: 'array',
              fields: [
                {
                  name: 'topic',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'sourceArtifactURL',
              type: 'text',
              validate: (value) =>
                validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
            },
            {
              name: 'sourceArtifactID',
              type: 'text',
            },
          ],
          label: 'Meta',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    beforeChange: [enforcePostWorkflow],
  },
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
}
