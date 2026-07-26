import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

const socialLinks = [
  {
    label: 'GitHub',
    url: 'https://github.com/raid-guild/',
  },
  {
    label: 'X',
    url: 'https://x.com/RaidGuild',
  },
  {
    label: 'Discord',
    url: 'https://discord.gg/K7qFnBT9Ba',
  },
]

export async function Footer() {
  const footer: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footer?.navItems || []

  return (
    <footer className="border-t border-border bg-card text-foreground" data-portal-footer>
      <div className="container flex flex-col gap-8 py-8 md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        <div className="flex flex-col-reverse items-start gap-4 md:flex-row md:items-center">
          <ThemeSelector />
          <nav className="flex flex-col md:flex-row gap-4" aria-label="Footer navigation">
            {navItems.map(({ link }, i) => {
              return <CMSLink className="text-foreground hover:text-primary" key={i} {...link} />
            })}
          </nav>
          <nav className="flex gap-4" aria-label="RaidGuild social links">
            {socialLinks.map((link) => (
              <a
                className="text-foreground transition-colors hover:text-primary"
                href={link.url}
                key={link.label}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
