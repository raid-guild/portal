export const authChangeEvent = 'portal:auth-change'

export const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(authChangeEvent))
}
