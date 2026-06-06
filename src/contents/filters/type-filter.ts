import type { ContentType, TypeFilter } from '../../lib/types'
import { CONTENT_TYPE_MAP } from '../../lib/constants'

export function detectContentType(url: string): ContentType | null {
  for (const [pattern, type] of Object.entries(CONTENT_TYPE_MAP)) {
    if (url.includes(pattern)) {
      return type
    }
  }
  return null
}

export function shouldBlockByType(
  contentType: ContentType,
  filters: TypeFilter[]
): boolean {
  return filters.some(
    filter => filter.enabled && filter.type === contentType
  )
}

export function detectContentTypeFromElement(
  element: HTMLElement,
  linkUrl?: string
): ContentType | null {
  // Try URL-based detection first
  if (linkUrl) {
    const urlType = detectContentType(linkUrl)
    if (urlType) return urlType
  }

  // Try DOM-based detection
  const classes = element.className || ''
  if (typeof classes === 'string') {
    if (classes.includes('live')) return 'live'
    if (classes.includes('cheese')) return 'course'
    if (classes.includes('bangumi')) return 'bangumi'
  }

  return null
}
