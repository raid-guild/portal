export const createGoogleCalendarURL = ({
  description,
  endsAt,
  location,
  startsAt,
  title,
}: {
  description?: string | null
  endsAt: string
  location?: string | null
  startsAt: string
  title: string
}): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    dates: `${toGoogleDate(startsAt)}/${toGoogleDate(endsAt)}`,
    text: title,
  })

  if (description) params.set('details', description)
  if (location) params.set('location', location)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const toGoogleDate = (value: string): string => {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}
