import type { Profile } from './types'
import { detectContentType } from '../contents/filters/type-filter'
import { shouldBlockByKeyword } from '../contents/filters/keyword-filter'
import { extractVideoId, extractCreatorId } from '../contents/filters/id-filter'

export interface ContentData {
  url: string
  title: string
  author: string
  element: HTMLElement
}

export interface EvaluationResult {
  blocked: boolean
  reason: string | null
  filterType: 'type' | 'keyword' | 'id' | 'ad' | null
  filterId: string | null
}

/**
 * Evaluates content against a blocking profile.
 * Checks filters in priority order: type → ID → keyword.
 * Returns on first match (short-circuit evaluation).
 */
export function evaluateContent(
  content: ContentData,
  profile: Profile
): EvaluationResult {
  const { filters } = profile

  // 1. Check type filter (fastest - URL pattern matching)
  const contentType = detectContentType(content.url)
  if (contentType) {
    const typeMatch = filters.types.find(
      f => f.enabled && f.type === contentType
    )
    if (typeMatch) {
      return {
        blocked: true,
        reason: `Blocked type: ${contentType}`,
        filterType: 'type',
        filterId: typeMatch.id,
      }
    }
  }

  // 2. Check ID filter (video ID or creator ID)
  const videoId = extractVideoId(content.url)
  const creatorId = extractCreatorId(content.url)
  const idMatch = filters.ids.find(f => {
    if (!f.enabled) return false
    if (f.type === 'video' && videoId) return f.targetId === videoId
    if (f.type === 'creator' && creatorId) return f.targetId === creatorId
    return false
  })
  if (idMatch) {
    return {
      blocked: true,
      reason: `Blocked ${idMatch.type}: ${idMatch.targetId}`,
      filterType: 'id',
      filterId: idMatch.id,
    }
  }

  // 3. Check keyword filter (most expensive - text matching)
  const keywordMatch = shouldBlockByKeyword(
    {
      title: content.title,
      author: content.author,
      description: '',
      tags: [],
    },
    filters.keywords
  )
  if (keywordMatch) {
    const matchedFilter = filters.keywords.find(f => f.enabled && f.keyword)
    return {
      blocked: true,
      reason: `Blocked keyword: ${matchedFilter?.keyword}`,
      filterType: 'keyword',
      filterId: matchedFilter?.id || null,
    }
  }

  return {
    blocked: false,
    reason: null,
    filterType: null,
    filterId: null,
  }
}
