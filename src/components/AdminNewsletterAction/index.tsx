'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

export default function AdminNewsletterAction() {
  const { id, isEditing } = useDocumentInfo()

  if (!isEditing || !id) return null

  return (
    <a
      className="btn btn--style-secondary btn--size-medium"
      href={`/newsletter?postId=${encodeURIComponent(String(id))}`}
      rel="noopener noreferrer"
      target="_blank"
      title="Save the post draft first, then open Newsletter to sync it to listmonk."
    >
      Newsletter
    </a>
  )
}
