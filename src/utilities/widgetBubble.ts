export const isWidgetBubbleEnabled = () => {
  const value = process.env.NEXT_PUBLIC_WIDGET_BUBBLE_ENABLED?.trim().toLowerCase()

  return !value || !['0', 'false', 'off'].includes(value)
}
