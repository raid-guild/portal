import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import path from 'path'
import type { Plugin, PayloadRequest } from 'payload'
import { APIError } from 'payload'
import { sanitizeFilename } from 'payload/shared'

import { hasVerifiedAccount } from '@/access/roles'
import { mediaS3Config, PORTAL_MEDIA_PREFIX } from './storage'

const maxFileSize = 250 * 1024 * 1024
const tokenLifetime = 10 * 60 * 1000

type UploadGrant = {
  filename: string
  filesize: number
  mimeType: string
  userId: number | string
  expiresAt: number
}

const signGrant = (grant: UploadGrant) => {
  const payload = Buffer.from(JSON.stringify(grant)).toString('base64url')
  const signature = createHmac('sha256', process.env.PAYLOAD_SECRET || '')
    .update(payload)
    .digest('base64url')
  return `${payload}.${signature}`
}

const verifyGrant = (token: unknown, req: PayloadRequest, filename: string) => {
  if (typeof token !== 'string') throw new APIError('Upload authorization is missing.', 403)
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) throw new APIError('Upload authorization is invalid.', 403)
  const expected = createHmac('sha256', process.env.PAYLOAD_SECRET || '')
    .update(payload)
    .digest()
  const actual = Buffer.from(signature, 'base64url')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new APIError('Upload authorization is invalid.', 403)
  }
  let grant: UploadGrant
  try {
    grant = JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch {
    throw new APIError('Upload authorization is invalid.', 403)
  }
  if (
    grant.filename !== filename ||
    grant.userId !== req.user?.id ||
    grant.expiresAt < Date.now()
  ) {
    throw new APIError('Upload authorization has expired or changed.', 403)
  }
  return grant
}

const uploadsAllowed = (req: PayloadRequest) =>
  process.env.MEDIA_UPLOADS_PAUSED !== 'true' && hasVerifiedAccount(req.user)

export const directMediaUploads: Plugin = (config) => {
  const enabled = process.env.MEDIA_STORAGE === 's3' && process.env.MEDIA_DIRECT_UPLOADS === 'true'
  config.admin = config.admin || {}
  config.admin.components = config.admin.components || {}
  config.admin.components.providers = [
    ...(config.admin.components.providers || []),
    { path: '@/media/DirectUploadProvider#DirectUploadProvider', clientProps: { enabled } },
  ]
  if (!enabled) return config
  const storage = mediaS3Config()!
  const s3 = new S3Client({
    endpoint: storage.endpoint,
    region: storage.region,
    credentials: storage.credentials,
    forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === 'true',
  })

  config.endpoints = [
    ...(config.endpoints || []),
    {
      path: '/media/direct-upload',
      method: 'post',
      handler: async (req) => {
        if (!uploadsAllowed(req))
          throw new APIError('Media uploads are unavailable for this account.', 403)
        const body = await req.json?.()
        if (
          body?.collectionSlug !== 'media' ||
          typeof body.filename !== 'string' ||
          typeof body.mimeType !== 'string' ||
          !body.mimeType ||
          !Number.isSafeInteger(body.filesize) ||
          body.filesize < 1 ||
          body.filesize > maxFileSize
        ) {
          throw new APIError('Choose a valid file smaller than 250 MB.', 400)
        }
        const cleanName = sanitizeFilename(path.basename(body.filename))
        if (!cleanName || cleanName === '.' || cleanName === '..') {
          throw new APIError('The filename is invalid.', 400)
        }
        const extension = path.extname(cleanName)
        const name = cleanName.slice(0, 100 - extension.length)
        const filename = `${name}-${randomUUID()}${extension}`
        const grant: UploadGrant = {
          filename,
          filesize: body.filesize,
          mimeType: body.mimeType,
          userId: req.user!.id,
          expiresAt: Date.now() + tokenLifetime,
        }
        const url = await getSignedUrl(
          s3,
          new PutObjectCommand({
            Bucket: storage.bucket,
            Key: `${PORTAL_MEDIA_PREFIX}/${filename}`,
            ContentType: grant.mimeType,
            ContentLength: grant.filesize,
          }),
          { expiresIn: 600, signableHeaders: new Set(['content-length', 'content-type']) },
        )
        return Response.json({ filename, token: signGrant(grant), url })
      },
    },
  ]

  config.collections = config.collections?.map((collection) => {
    if (collection.slug !== 'media' || !collection.upload || typeof collection.upload !== 'object')
      return collection
    const handlers = collection.upload.handlers || []
    return {
      ...collection,
      upload: {
        ...collection.upload,
        handlers: [
          async (req, args) => {
            const context = args.params.clientUploadContext
            if (!context) {
              for (const handler of handlers) {
                const response = await handler(req, args)
                if (response) return response
              }
              throw new APIError('The media file could not be found.', 404)
            }
            if (
              !uploadsAllowed(req) ||
              args.params.collection !== 'media' ||
              typeof context !== 'object' ||
              !('prefix' in context) ||
              context.prefix !== PORTAL_MEDIA_PREFIX ||
              !('token' in context)
            ) {
              throw new APIError('Media upload authorization is invalid.', 403)
            }
            const grant = verifyGrant(context.token, req, args.params.filename)
            // The S3 handler is the only source for an authorized client upload.
            const response = await handlers[handlers.length - 1](req, args)
            if (
              !response?.ok ||
              Number(response.headers.get('content-length')) !== grant.filesize ||
              response.headers.get('content-type') !== grant.mimeType
            ) {
              throw new APIError(
                'The uploaded file could not be verified. Try the upload again.',
                400,
              )
            }
            return response
          },
        ],
      },
    }
  })
  return config
}
