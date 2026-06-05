export const postVisibilityValues = ['public', 'authenticated', 'member', 'admin'] as const

export type PostVisibility = (typeof postVisibilityValues)[number]
export type PostVisibilityFilter = PostVisibility | 'all'

export const postVisibilityLabels: Record<PostVisibilityFilter, string> = {
  all: 'All visible',
  public: 'Public',
  authenticated: 'Portal',
  member: 'Members',
  admin: 'Admin',
}

export const getPostVisibilityLabel = (visibility?: string | null): string | null => {
  if (!visibility) return null
  if (!postVisibilityValues.includes(visibility as PostVisibility)) return null

  return postVisibilityLabels[visibility as PostVisibility]
}
