import React from 'react'

import '../(frontend)/globals.css'

export default function DevPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html data-theme="dark" lang="en">
      <body>{children}</body>
    </html>
  )
}
