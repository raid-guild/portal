'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

import './index.scss'

const baseClass = 'admin-bar'

export const AdminBar: React.FC<{
  adminBarProps?: {
    preview?: boolean
  }
}> = ({ adminBarProps }) => {
  const router = useRouter()

  if (!adminBarProps?.preview) return null

  const exitPreview = async () => {
    await fetch('/next/exit-preview')
    router.push('/')
    router.refresh()
  }

  return (
    <div className={`${baseClass} border-b border-border bg-card py-2 text-card-foreground`}>
      <div className="container">
        <div className="flex items-center justify-between py-2 text-sm font-medium">
          <span>Preview mode</span>
          <button
            className="text-card-foreground hover:text-primary"
            onClick={exitPreview}
            type="button"
          >
            Exit preview
          </button>
        </div>
      </div>
    </div>
  )
}
