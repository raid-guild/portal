'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'

export const WikiArticleGenerateControl = ({
  className = '',
  compact = false,
  topicID,
}: {
  className?: string
  compact?: boolean
  topicID: number
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [steeringPrompt, setSteeringPrompt] = useState('')
  const [tone, setTone] = useState<'error' | 'success'>('success')

  const generateArticle = async () => {
    setIsGenerating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/wiki/topics/article/generate', {
        body: JSON.stringify({
          steeringPrompt,
          topicID,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.message || 'Article generation failed.')
      }

      setTone('success')
      setMessage(result?.message || 'Article generation request was created.')
    } catch (error) {
      setTone('error')
      setMessage(error instanceof Error ? error.message : 'Article generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={className}>
      {compact ? null : (
        <label className="grid gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Steering
          </span>
          <textarea
            className="min-h-24 w-full border border-border bg-background/80 p-3 text-sm text-foreground outline-none focus:border-primary"
            onChange={(event) => setSteeringPrompt(event.target.value)}
            placeholder="Optional angle, sources, or constraints for the article draft"
            value={steeringPrompt}
          />
        </label>
      )}
      <button
        className="portal-admin-link mt-3 inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isGenerating}
        onClick={generateArticle}
        type="button"
      >
        {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Generate article
      </button>
      {message ? (
        <p
          className={
            tone === 'error'
              ? 'mt-3 text-sm text-destructive'
              : 'mt-3 text-sm leading-6 text-muted-foreground'
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
