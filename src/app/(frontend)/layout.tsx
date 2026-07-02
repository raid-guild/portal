import type { Metadata } from 'next'

import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { WidgetBubble } from './_components/WidgetBubble'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { isWidgetBubbleEnabled } from '@/utilities/widgetBubble'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

const plausibleInitScript = `
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const widgetBubbleEnabled = isWidgetBubbleEnabled()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <script
          async
          src="https://plausible-production-78b3.up.railway.app/js/pa-GcMa0n3OprdetpF64tprs.js"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: plausibleInitScript,
          }}
        />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link
          href="/feed.xml"
          rel="alternate"
          title="RaidGuild Portal Posts"
          type="application/rss+xml"
        />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          <LivePreviewListener />

          <Header />
          {children}
          {widgetBubbleEnabled ? (
            <React.Suspense fallback={null}>
              <WidgetBubble />
            </React.Suspense>
          ) : null}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@RaidGuild',
  },
}
