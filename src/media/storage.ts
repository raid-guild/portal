export const PORTAL_MEDIA_PREFIX = 'portal/media'

export const isS3MediaStorage = () => {
  const mode = process.env.MEDIA_STORAGE || 'local'
  if (mode !== 'local' && mode !== 's3') throw new Error('MEDIA_STORAGE must be local or s3')
  return mode === 's3'
}

export function mediaS3Config() {
  if (!isS3MediaStorage()) return null

  const bucket = process.env.MEDIA_S3_BUCKET?.trim()
  const endpoint = process.env.MEDIA_S3_ENDPOINT?.trim()
  const region = process.env.MEDIA_S3_REGION?.trim()
  const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.MEDIA_S3_SECRET_ACCESS_KEY?.trim()
  if (!bucket || !endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error('MEDIA_STORAGE=s3 requires MEDIA_S3_BUCKET, MEDIA_S3_ENDPOINT, MEDIA_S3_REGION, MEDIA_S3_ACCESS_KEY_ID, and MEDIA_S3_SECRET_ACCESS_KEY')
  }
  const url = new URL(endpoint)
  const localTestEndpoint = process.env.MEDIA_S3_ALLOW_INSECURE_LOCAL === 'true' &&
    url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if ((!localTestEndpoint && url.protocol !== 'https:') || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('MEDIA_S3_ENDPOINT must be an HTTPS origin without credentials, path, query, or hash (loopback HTTP requires MEDIA_S3_ALLOW_INSECURE_LOCAL=true)')
  }
  return { bucket, endpoint: url.origin, region, credentials: { accessKeyId, secretAccessKey } }
}
