import type { Access, CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { fetchFallbackMedia, isLocalMediaFile, localMediaPath, mediaFallbackOrigin } from '../media/fallback'
import { isS3MediaStorage, PORTAL_MEDIA_PREFIX } from '../media/storage'

import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const mediaDir = path.resolve(dirname, '../../public/media')
const mediaWritesAllowed: Access = (args) => process.env.MEDIA_UPLOADS_PAUSED === 'true'
  ? false
  : authenticated(args)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: mediaWritesAllowed,
    delete: mediaWritesAllowed,
    read: ({ isReadingStaticFile }) => isS3MediaStorage() && isReadingStaticFile
      ? { prefix: { equals: PORTAL_MEDIA_PREFIX } }
      : true,
    update: mediaWritesAllowed,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  hooks: {
    beforeChange: [({ data }) => {
      // The bucket is shared with other apps. Ignore a client-supplied prefix on
      // create or update so every Portal upload remains in its own namespace.
      data.prefix = PORTAL_MEDIA_PREFIX
      return data
    }],
  },
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: mediaDir,
    handlers: [(req, { params }) => {
      // In S3 mode the adapter appended by Payload handles this route.
      if (isS3MediaStorage()) return
      // Payload calls upload handlers after checkFileAccess. Existing local uploads
      // continue through Payload's own file and range handling.
      if (!mediaFallbackOrigin(req) || !localMediaPath(mediaDir, params.filename)) return
      // Payload accepts void from a handler to use its filesystem path, although
      // its type omits Promise<Response | void> as a valid mixed result.
      return (async () => {
        if (await isLocalMediaFile(mediaDir, params.filename)) return undefined
        return fetchFallbackMedia(req, `/api/media/file/${encodeURIComponent(params.filename)}`)
      })() as Promise<Response>
    }],
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
    ],
  },
}
