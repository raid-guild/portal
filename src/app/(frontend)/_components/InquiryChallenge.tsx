'use client'

import React, { useEffect, useRef, useState } from 'react'

const siteKey = process.env.NEXT_PUBLIC_INQUIRY_TURNSTILE_SITE_KEY
const developmentMode =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_INQUIRY_PROTECTION_MODE === 'development'

type Turnstile = {
  remove: (id: string) => void
  render: (
    container: HTMLElement,
    options: {
      action: string
      callback: (token: string) => void
      'error-callback': () => void
      'expired-callback': () => void
      'timeout-callback': () => void
      'refresh-expired': 'manual'
      'response-field': false
      retry: 'never'
      sitekey: string
    },
  ) => string
}

const getTurnstile = () => (window as Window & { turnstile?: Turnstile }).turnstile
let scriptPromise: Promise<Turnstile> | undefined

function loadTurnstile(): Promise<Turnstile> {
  const existing = getTurnstile()
  if (existing) return Promise.resolve(existing)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script')
    const fail = () => {
      clearTimeout(timeout)
      script.remove()
      reject(new Error('Verification could not load.'))
    }
    const timeout = setTimeout(fail, 15000)
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => {
      clearTimeout(timeout)
      const api = getTurnstile()
      if (api) resolve(api)
      else fail()
    }
    script.onerror = fail
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    scriptPromise = undefined
    throw error
  })
  return scriptPromise
}

export function useInquiryChallenge() {
  const [token, setToken] = useState<string | null>(null)
  const [generation, setGeneration] = useState(0)
  return {
    generation,
    ready: developmentMode || Boolean(token),
    reset: () => {
      setToken(null)
      setGeneration((value) => value + 1)
    },
    setToken,
    token,
  }
}

export function InquiryChallenge({
  generation,
  onToken,
}: {
  generation: number
  onToken: (token: string | null) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('Loading verification…')
  const [canRetry, setCanRetry] = useState(false)

  useEffect(() => {
    if (developmentMode || !siteKey) return
    let active = true
    let widget: string | undefined
    let api: Turnstile | undefined

    const fail = (message: string) => {
      if (!active) return
      onToken(null)
      setStatus(message)
      setCanRetry(true)
    }

    void loadTurnstile()
      .then((loaded) => {
        if (!active || !container.current) return
        api = loaded
        setStatus('Complete the verification before submitting.')
        widget = api.render(container.current, {
          action: 'inquiry',
          callback: (token) => {
            if (!active) return
            onToken(token)
            setStatus('Verification complete.')
            setCanRetry(false)
          },
          'error-callback': () => fail('Verification is unavailable. Retry or try again later.'),
          'expired-callback': () => fail('Verification expired. Please verify again.'),
          'timeout-callback': () => fail('Verification timed out. Please verify again.'),
          'refresh-expired': 'manual',
          'response-field': false,
          retry: 'never',
          sitekey: siteKey,
        })
      })
      .catch(() => fail('Verification could not load. Check your connection and retry.'))

    return () => {
      active = false
      if (api && widget !== undefined) api.remove(widget)
    }
  }, [attempt, generation, onToken])

  return (
    <div className="mt-5">
      <div aria-hidden="true" className="hidden">
        <label htmlFor="inquiry-website">Leave this field empty</label>
        <input
          autoComplete="off"
          id="inquiry-website"
          maxLength={200}
          name="website"
          tabIndex={-1}
        />
      </div>
      {!developmentMode && (
        <>
          <div ref={container} />
          <p aria-live="polite" className="mt-2 text-sm text-muted-foreground" role="status">
            {siteKey
              ? status
              : 'Inquiry verification is temporarily unavailable. Please try again later.'}
          </p>
          {canRetry && (
            <button
              className="portal-admin-link mt-2"
              onClick={() => {
                onToken(null)
                setStatus('Loading verification…')
                setCanRetry(false)
                setAttempt((value) => value + 1)
              }}
              type="button"
            >
              Retry verification
            </button>
          )}
        </>
      )}
    </div>
  )
}

export async function inquiryResponseError(response: Response): Promise<string> {
  if (response.status === 429) {
    return 'Too many inquiries have been submitted. Please wait before trying again. Your entries are still here.'
  }
  if (response.status === 503) {
    return 'Inquiry submission is temporarily unavailable. Please try again later. Your entries are still here.'
  }
  const json = await response.json().catch(() => null)
  const message = json?.errors?.[0]?.message || json?.message
  return typeof message === 'string'
    ? message
    : 'Unable to submit inquiry. Please verify again and retry. Your entries are still here.'
}
