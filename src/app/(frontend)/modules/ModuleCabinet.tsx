'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { ArrowUpRight, BookOpen, Gamepad2, Search, Wrench, ArrowRight, Star } from 'lucide-react'
import { categoryLabels, statusLabels } from './moduleDisplay'
import type { ModuleDestination } from './moduleDestination'
import styles from './cabinet.module.css'

const favoritesKey = 'raidguild:module-favorites:v1'
const readFavorites = (): number[] => {
  const saved: unknown = JSON.parse(localStorage.getItem(favoritesKey) || '[]')
  return Array.isArray(saved)
    ? saved.filter((id): id is number => Number.isSafeInteger(id) && id > 0)
    : []
}

export type CabinetModule = {
  id: number
  name: string
  summary: string
  category: keyof typeof categoryLabels
  status: keyof typeof statusLabels
  destination: ModuleDestination
  image: string | null
  imageAlt: string
  detail: string | null
  action: { href: string | null; label: string; opensNewWindow: boolean; signedLaunch: boolean }
}

export function ModuleCabinet({
  modules,
  canManage,
}: {
  modules: CabinetModule[]
  canManage: boolean
}) {
  const params = useSearchParams()
  const requested = params.get('view')
  const view: ModuleDestination | 'favorites' =
    requested === 'arcade' || requested === 'artifacts' || requested === 'favorites'
      ? requested
      : 'tools'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [favorites, setFavorites] = useState<number[]>([])
  const [favoritesReady, setFavoritesReady] = useState(false)
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  useEffect(() => {
    const refresh = () => {
      try {
        setFavorites(readFavorites())
      } catch {
        setFavorites([])
      }
      setFavoritesReady(true)
    }
    refresh()
    const onStorage = (event: StorageEvent) => {
      if (event.key === favoritesKey || event.key === null) refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const toggleFavorite = (id: number) => {
    const next = favorites.includes(id)
      ? favorites.filter((saved) => saved !== id)
      : [...favorites, id]
    setFavorites(next)
    try {
      localStorage.setItem(favoritesKey, JSON.stringify(next))
      setStorageUnavailable(false)
    } catch {
      setStorageUnavailable(true)
    }
  }
  const inView = modules.filter((module) =>
    view === 'favorites' ? favorites.includes(module.id) : module.destination === view,
  )
  const categories = [...new Set(inView.map((module) => module.category))]
  const activeCategory = categories.includes(category as CabinetModule['category'])
    ? category
    : 'all'
  const filtered = inView.filter(
    (module) =>
      (activeCategory === 'all' || module.category === activeCategory) &&
      `${module.name} ${module.summary}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const games = modules.filter((module) => module.destination === 'arcade')
  const counts = (destination: ModuleDestination | 'favorites') =>
    modules.filter((module) =>
      destination === 'favorites'
        ? favorites.includes(module.id)
        : module.destination === destination,
    ).length
  const changeView = () => {
    setCategory('all')
    setQuery('')
  }

  return (
    <main className={`${styles.shell} ${view === 'arcade' ? styles.arcadeMode : ''}`}>
      <div className={styles.layout}>
        <section className={styles.cabinet} aria-label="Module collection">
          <header className={styles.header}>
            <div className={styles.eyebrow}>
              The guild cabinet <span> / </span> Portal modules
            </div>
            {canManage && (
              <Link href="/admin/collections/modules" className={styles.manage}>
                Manage modules <ArrowUpRight size={13} />
              </Link>
            )}
          </header>
          <div className={styles.hero}>
            <span className={styles.ornament} aria-hidden="true">
              ✳
            </span>
            <h1>
              {view === 'arcade' ? (
                <>
                  One more
                  <br />
                  <em>adventure.</em>
                </>
              ) : (
                <>
                  Good things,
                  <br />
                  made by <em>the guild.</em>
                </>
              )}
            </h1>
            <p>
              {view === 'arcade'
                ? 'Small games. Strange worlds. Made to be played.'
                : 'A collection of useful tools and curious experiments.'}
            </p>
          </div>
          <div className={styles.controls}>
            <nav className={styles.tabs} aria-label="Module destinations">
              {(
                [
                  { key: 'tools', label: 'Tools', Icon: Wrench },
                  { key: 'artifacts', label: 'Artifacts', Icon: BookOpen },
                  { key: 'favorites', label: 'Favorites', Icon: Star },
                ] as const
              ).map(({ key, label, Icon }) => (
                <Link
                  key={key}
                  href={`/modules?view=${key}`}
                  scroll={false}
                  onClick={changeView}
                  aria-current={view === key ? 'page' : undefined}
                >
                  <Icon size={17} /> {label} <span>{counts(key)}</span>
                </Link>
              ))}
            </nav>
            <label className={styles.search}>
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Search modules"
                type="search"
                placeholder={`Search ${view}…`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          {view !== 'arcade' && (
            <Link
              className={styles.mobileArcade}
              href="/modules?view=arcade"
              scroll={false}
              onClick={changeView}
            >
              <span>
                <small>The guild arcade</small>
                <strong>The guild plays here.</strong>
              </span>
              <span>
                Enter the arcade <ArrowRight size={17} />
              </span>
            </Link>
          )}
          <div className={styles.sectionIntro}>
            <div>
              <p className={styles.eyebrow}>
                {view === 'favorites'
                  ? 'Your favorites'
                  : view === 'tools'
                    ? 'Your everyday toolkit'
                    : view === 'artifacts'
                      ? 'The curiosity collection'
                      : 'Choose your game'}
              </p>
              <p>
                {view === 'favorites'
                  ? 'Saved in this browser. Keep your go-to experiences close.'
                  : view === 'tools'
                    ? 'Find a useful next step.'
                    : view === 'artifacts'
                      ? 'Interactive ideas, built to explore.'
                      : 'Pick a world and step inside.'}
              </p>
            </div>
            <span className={styles.resultCount} role="status">
              {filtered.length} {filtered.length === 1 ? 'experience' : 'experiences'}
            </span>
          </div>
          {storageUnavailable && (
            <p role="status" className={styles.storageNotice}>
              Browser storage is unavailable. Favorites will last for this visit only.
            </p>
          )}
          {categories.length > 1 && (
            <div className={styles.filters} aria-label="Filter by category">
              <button
                type="button"
                aria-pressed={activeCategory === 'all'}
                onClick={() => setCategory('all')}
              >
                All
              </button>
              {categories.map((key) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={activeCategory === key}
                  onClick={() => setCategory(key)}
                >
                  {categoryLabels[key]}
                </button>
              ))}
            </div>
          )}
          <div className={`${styles.grid} ${view === 'artifacts' ? styles.artifactGrid : ''}`}>
            {filtered.map((module) => (
              <ModuleCard
                module={module}
                key={module.id}
                favorite={favorites.includes(module.id)}
                favoritesReady={favoritesReady}
                onToggleFavorite={() => toggleFavorite(module.id)}
              />
            ))}
          </div>
          {!filtered.length && (
            <div className={styles.empty}>
              <BookOpen size={30} aria-hidden="true" />
              <h2>
                {inView.length
                  ? 'Nothing here matches yet.'
                  : view === 'favorites'
                    ? favoritesReady
                      ? 'Your favorites start here.'
                      : 'Loading favorites…'
                    : `The ${view === 'artifacts' ? 'collection' : view} is waiting for its first arrival.`}
              </h2>
              <p>
                {inView.length
                  ? 'Try a different search or category.'
                  : view === 'favorites'
                    ? 'Star a tool, artifact, or game to find it here.'
                    : 'Check back for new guild experiences.'}
              </p>
              {inView.length > 0 && (
                <button
                  onClick={() => {
                    setQuery('')
                    setCategory('all')
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
          <footer className={styles.collectionFooter}>
            <span>Built by the guild. Open to discovery.</span>
            <span aria-hidden="true">✳</span>
          </footer>
        </section>
        <aside className={styles.arcade} aria-label="Guild arcade">
          <p className={styles.eyebrow}>
            <Gamepad2 size={17} /> The guild arcade
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.doorway}
            src="/assets/modules/arcade-doorway.webp"
            alt="A glowing doorway in a pixel-art dungeon"
          />
          <div className={styles.arcadeCopy}>
            <p className={styles.eyebrow}>Step away. Level up.</p>
            <h2>
              The guild
              <br />
              <em>plays here.</em>
            </h2>
            <p>
              A little competition.
              <br />A different kind of collaboration.
            </p>
            <Link
              className={styles.enter}
              href={view === 'arcade' ? '/modules?view=tools' : '/modules?view=arcade'}
              scroll={false}
              onClick={changeView}
            >
              {view === 'arcade' ? 'Back to the cabinet' : 'Enter the arcade'}{' '}
              <ArrowRight size={19} />
            </Link>
          </div>
          {games.length > 0 && (
            <div className={styles.gameShelf}>
              <p className={styles.eyebrow}>From the arcade</p>
              <div>
                {games.slice(0, 3).map((game) => (
                  <Link
                    href={game.detail || '/modules?view=arcade'}
                    key={game.id}
                    className={styles.gameCover}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={game.image || '/assets/modules/arcade-doorway.webp'} alt="" />
                    <span>{game.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <p className={styles.arcadeFoot}>Made by raiders. Played together.</p>
        </aside>
      </div>
    </main>
  )
}

function ModuleCard({
  module,
  favorite,
  favoritesReady,
  onToggleFavorite,
}: {
  module: CabinetModule
  favorite: boolean
  favoritesReady: boolean
  onToggleFavorite: () => void
}) {
  const action = module.action
  return (
    <article className={styles.card} aria-label={module.name}>
      <div className={styles.preview}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={module.image || '/assets/symbol-m800.svg'}
          alt={module.imageAlt}
          loading="lazy"
          className={!module.image ? styles.fallback : undefined}
        />
        <button
          type="button"
          className={styles.favorite}
          aria-label={`${favorite ? 'Remove' : 'Add'} ${module.name} ${favorite ? 'from' : 'to'} favorites`}
          aria-pressed={favorite}
          disabled={!favoritesReady}
          onClick={onToggleFavorite}
        >
          <Star size={18} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
        <span className={styles.badge}>{statusLabels[module.status]}</span>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardKicker}>
          {categoryLabels[module.category]}
          {action.signedLaunch && <span>Uses Portal sign-in</span>}
        </p>
        <h2>{module.detail ? <Link href={module.detail}>{module.name}</Link> : module.name}</h2>
        <p className={styles.summary}>{module.summary.replace(/^Standalone artifact:\s*/i, '')}</p>
        <div className={styles.cardLinks}>
          {action.href ? (
            <a
              href={action.href}
              target={action.opensNewWindow ? '_blank' : undefined}
              rel={action.opensNewWindow ? 'noopener noreferrer' : undefined}
            >
              {action.label} <ArrowUpRight size={15} />
            </a>
          ) : (
            <span>Coming soon</span>
          )}
          {module.detail && (
            <Link href={module.detail} aria-label={`View details for ${module.name}`}>
              Details <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
