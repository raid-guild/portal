import Link from 'next/link'

import type { HomeFeaturedModule } from '@/modules/getHomeFeaturedModules'
import { categoryLabels } from '../modules/moduleDisplay'

export function FeaturedModules({
  modules,
  className = '',
}: {
  modules: HomeFeaturedModule[]
  className?: string
}) {
  return (
    <section aria-labelledby="featured-modules-heading" className={className}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="portal-kicker">Explore the guild</p>
          <h2 className="mt-2 portal-heading" id="featured-modules-heading">
            Featured Modules
          </h2>
        </div>
        <Link
          className="text-sm font-bold text-foreground underline decoration-primary/50"
          href="/modules"
        >
          All modules
        </Link>
      </div>
      {modules.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {modules.map((module) => (
            <article className="portal-card overflow-hidden p-0" key={module.slug}>
              {module.image ? (
                <img alt="" className="aspect-video w-full object-cover" src={module.image} />
              ) : null}
              <div className="p-5">
                <p className="portal-kicker">{categoryLabels[module.category]}</p>
                <h3 className="mt-2 portal-heading-sm">{module.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {module.summary}
                </p>
                <Link
                  className="mt-5 inline-block text-sm font-bold text-foreground underline decoration-primary/50"
                  href={module.href}
                >
                  {module.actionLabel}
                  <span className="sr-only"> {module.title}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Featured modules will appear here soon.
        </p>
      )}
    </section>
  )
}
