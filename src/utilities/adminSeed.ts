export const isAdminSeedActionAllowed = (): boolean => {
  if (process.env.ENABLE_ADMIN_SEED_ACTION === 'true') return true

  const isHosted = Boolean(process.env.VERCEL) || Object.keys(process.env).some((key) =>
    key.startsWith('RAILWAY_'),
  )

  return !isHosted
}
