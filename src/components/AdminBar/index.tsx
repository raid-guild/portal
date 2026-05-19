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
    <div className={`${baseClass} bg-moloch-900 py-2 text-scroll-100`}>
      <div className="container">
        <div className="flex items-center justify-between py-2 text-sm font-medium text-scroll-100">
          <span>Preview mode</span>
          <button
            className="text-scroll-100 hover:text-primary"
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
