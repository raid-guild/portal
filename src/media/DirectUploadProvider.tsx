'use client'

import { useUploadHandlers } from '@payloadcms/ui'
import { useEffect } from 'react'

import { PORTAL_MEDIA_PREFIX } from './storage'

export function DirectUploadProvider({
  children,
  enabled,
}: {
  children: React.ReactNode
  enabled: boolean
}) {
  const { setUploadHandler } = useUploadHandlers()

  useEffect(() => {
    if (!enabled) return
    setUploadHandler({
      collectionSlug: 'media',
      handler: async ({ file, updateFilename }) => {
        const mimeType = file.type || 'application/octet-stream'
        const authorizationController = new AbortController()
        const authorizationTimeout = setTimeout(() => authorizationController.abort(), 20_000)
        let authorization: Response
        try {
          authorization = await fetch('/api/portal-media-direct-upload', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            signal: authorizationController.signal,
            body: JSON.stringify({
              collectionSlug: 'media',
              filename: file.name,
              filesize: file.size,
              mimeType,
            }),
          })
        } catch {
          if (authorizationController.signal.aborted)
            throw new Error('Portal took too long to start the upload. Try again.')
          throw new Error('Could not contact Portal to start the upload. Try again.')
        } finally {
          clearTimeout(authorizationTimeout)
        }
        if (!authorization.ok)
          throw new Error(
            'Portal could not authorize this upload. Check your account and try again.',
          )
        const { filename, token, url } = await authorization.json()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000)
        let response: Response
        try {
          response = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': mimeType },
            signal: controller.signal,
          })
        } catch (error) {
          if (controller.signal.aborted) throw new Error('The upload timed out. Try again.')
          throw new Error('The upload connection failed. Try again.')
        } finally {
          clearTimeout(timeout)
        }
        if (!response.ok) throw new Error('Storage rejected the upload. Try again.')
        updateFilename(filename)
        return { prefix: PORTAL_MEDIA_PREFIX, token }
      },
    })
  }, [enabled, setUploadHandler])

  return children
}
