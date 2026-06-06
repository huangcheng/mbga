import type { IDFilter } from '../../lib/types'

export interface ContentIds {
  videoId: string | null
  creatorId: string | null
}

export function extractVideoId(url: string): string | null {
  const match = url.match(/\/video\/(BV[a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

export function extractCreatorId(url: string): string | null {
  const match = url.match(/space\.bilibili\.com\/(\d+)/)
  return match ? match[1] : null
}

export function extractIdsFromElement(element: HTMLElement): ContentIds {
  const links = element.querySelectorAll('a[href]')
  let videoId: string | null = null
  let creatorId: string | null = null

  links.forEach(link => {
    const href = link.getAttribute('href') || ''
    if (!videoId) videoId = extractVideoId(href)
    if (!creatorId) creatorId = extractCreatorId(href)
  })

  return { videoId, creatorId }
}

export function shouldBlockById(
  ids: ContentIds,
  filters: IDFilter[]
): boolean {
  return filters.some(filter => {
    if (!filter.enabled) return false

    if (filter.type === 'video' && ids.videoId) {
      return ids.videoId === filter.targetId
    }

    if (filter.type === 'creator' && ids.creatorId) {
      return ids.creatorId === filter.targetId
    }

    return false
  })
}
