'use client'

import { useEffect } from 'react'

import { trackPortalEvent } from '@/utilities/analytics'

const joinPath = '/join'

const getPlacement = (link: HTMLAnchorElement) => {
  const analyticsContext = link.closest<HTMLElement>('[data-analytics-placement]')

  if (analyticsContext?.dataset.analyticsPlacement) {
    return analyticsContext.dataset.analyticsPlacement
  }

  if (link.closest('header')) return 'header'
  if (link.closest('footer')) return 'footer'

  return 'page'
}

export const JoinCTAAnalytics = () => {
  useEffect(() => {
    const trackJoinClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return

      const link = event.target.closest<HTMLAnchorElement>('a[href]')
      if (!link) return

      let targetURL: URL

      try {
        targetURL = new URL(link.href, window.location.origin)
      } catch {
        return
      }

      if (targetURL.origin !== window.location.origin || targetURL.pathname !== joinPath) return

      const analyticsContext = link.closest<HTMLElement>('[data-analytics-placement]')
      const postSlug = analyticsContext?.dataset.analyticsPostSlug

      trackPortalEvent('Join CTA Clicked', {
        ...(postSlug ? { post_slug: postSlug } : {}),
        placement: getPlacement(link),
        target_path: targetURL.pathname,
      })
    }

    document.addEventListener('click', trackJoinClick)

    return () => document.removeEventListener('click', trackJoinClick)
  }, [])

  return null
}
