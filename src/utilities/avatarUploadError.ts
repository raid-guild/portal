export const avatarUploadError = (status: number): string => {
  if (status === 403) return 'Verify your email before uploading an avatar.'
  if (status === 401) return 'Your session has expired. Sign in again to upload an avatar.'
  return 'Unable to upload avatar. Please try again.'
}
