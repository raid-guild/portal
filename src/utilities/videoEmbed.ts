export const getYouTubeEmbedURL = (href: string | null | undefined): string | null => {
  if (!href) return null

  try {
    const url = new URL(href)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    let videoID = ''

    if (host === 'youtu.be') {
      videoID = url.pathname.split('/').filter(Boolean)[0] || ''
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      if (url.pathname === '/watch') {
        videoID = url.searchParams.get('v') || ''
      } else {
        const [, route, id] = url.pathname.split('/')

        if (route === 'embed' || route === 'shorts' || route === 'live') {
          videoID = id || ''
        }
      }
    }

    if (!/^[A-Za-z0-9_-]{11}$/.test(videoID)) return null

    return `https://www.youtube-nocookie.com/embed/${videoID}`
  } catch {
    return null
  }
}

export const validateYouTubeURL = (value: unknown): true | string =>
  !value || getYouTubeEmbedURL(String(value))
    ? true
    : 'Enter a valid YouTube video, Short, live, or embed URL.'
