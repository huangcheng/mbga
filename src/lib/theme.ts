export type Theme = 'system' | 'light' | 'dark'

export function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme()
  return theme
}

export function applyTheme(theme: Theme): void {
  const effective = getEffectiveTheme(theme)
  document.documentElement.setAttribute('data-theme', effective)
  document.documentElement.style.colorScheme = effective
}

export function listenToSystemThemeChanges(callback: (theme: 'light' | 'dark') => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light')
  }
  mediaQuery.addEventListener('change', handler)
  return () => mediaQuery.removeEventListener('change', handler)
}
