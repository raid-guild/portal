'use client'

export type InquiryAnalyticsType = 'client' | 'general' | 'grant' | 'opportunity' | 'sponsor'

export type PortalAnalyticsEvent =
  | 'Account Created'
  | 'Inquiry Account Clicked'
  | 'Inquiry CTA Clicked'
  | 'Inquiry Failed'
  | 'Inquiry Started'
  | 'Inquiry Submitted'
  | 'Join CTA Clicked'
  | 'Profile Completed'

type AnalyticsProperties = Record<string, boolean | number | string>

type PlausibleFunction = (
  eventName: PortalAnalyticsEvent,
  options?: {
    props?: AnalyticsProperties
  },
) => void

declare global {
  interface Window {
    plausible?: PlausibleFunction
  }
}

const signupContextKey = 'portal_signup_analytics_context'

type SignupAnalyticsContext = {
  inquiryType?: InquiryAnalyticsType
  signupContext: 'direct' | 'inquiry'
}

export const trackPortalEvent = (eventName: PortalAnalyticsEvent, props?: AnalyticsProperties) => {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') return

  try {
    window.plausible(eventName, props ? { props } : undefined)
  } catch {
    // Analytics must never interrupt the visitor's action.
  }
}

export const rememberSignupAnalyticsContext = (context: SignupAnalyticsContext) => {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(signupContextKey, JSON.stringify(context))
  } catch {
    // Storage may be unavailable in privacy-restricted browsing contexts.
  }
}

export const consumeSignupAnalyticsContext = (): SignupAnalyticsContext | null => {
  if (typeof window === 'undefined') return null

  let value: string | null = null

  try {
    value = window.sessionStorage.getItem(signupContextKey)
    window.sessionStorage.removeItem(signupContextKey)
  } catch {
    return null
  }

  if (!value) return null

  try {
    return JSON.parse(value) as SignupAnalyticsContext
  } catch {
    return null
  }
}
