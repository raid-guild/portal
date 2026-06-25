import type { CollectionAfterChangeHook } from 'payload'

import type { Module } from '@/payload-types'
import { createNotificationsForEligibleUsers } from '@/notifications/createNotification'
import { toSafeURL } from '@/utilities/safeURL'

export const createModulePublishedNotifications: CollectionAfterChangeHook<Module> = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (context.skipNotificationHooks) return doc
  if (operation !== 'create' && operation !== 'update') return doc
  if (!isEligibleForModuleNotification(doc)) return doc
  if (previousDoc && isEligibleForModuleNotification(previousDoc)) return doc

  try {
    await createNotificationsForEligibleUsers({
      buildNotification: (user) => ({
        data: {
          actionLabel: getModuleActionLabel(doc),
          actionURL: getModuleActionURL(doc),
          body: doc.summary || undefined,
          metadata: {
            moduleStatus: doc.status,
            moduleVisibility: doc.visibility,
          },
          priority: 'normal',
          relatedModule: doc.id,
          title: `New module: ${doc.name}`,
          type: 'module_published',
        },
        dedupeKey: `module:${doc.id}:published:user:${user.id}`,
      }),
      preferenceKey: 'moduleAnnouncements',
      req,
      visibility: doc.visibility,
    })
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      moduleID: doc.id,
      msg: 'Failed to create module published notifications.',
    })
  }

  return doc
}

const isEligibleForModuleNotification = (module: Partial<Module>) =>
  module.enabled === true &&
  (module.status === 'active' || module.status === 'experimental') &&
  module.visibility !== 'admin'

const getModuleActionLabel = (module: Module) =>
  module.moduleKind === 'external' ? 'Open module app' : 'Open module'

const getModuleActionURL = (module: Module) => {
  if (module.moduleKind === 'external' && module.authMode === 'signed_launch' && module.slug) {
    return `/api/modules/${module.slug}/launch`
  }

  return (
    toSafeURL(module.entryRoute, { allowRelative: true, protocols: ['http:', 'https:'] }) ||
    '/modules'
  )
}
