import type { KeywordFilter, MatchTarget } from '../../lib/types'

export interface ContentData {
  title: string
  author: string
  description: string
  tags: string[]
}

function matchKeyword(
  text: string,
  keyword: string,
  caseSensitive: boolean
): boolean {
  if (caseSensitive) {
    return text.includes(keyword)
  }
  return text.toLowerCase().includes(keyword.toLowerCase())
}

function getFieldValue(content: ContentData, field: MatchTarget): string {
  switch (field) {
    case 'title':
      return content.title
    case 'author':
      return content.author
    case 'description':
      return content.description
    case 'tags':
      return content.tags.join(' ')
    default:
      return ''
  }
}

export function shouldBlockByKeyword(
  content: ContentData,
  filters: KeywordFilter[]
): boolean {
  return filters.some(filter => {
    if (!filter.enabled) return false

    return filter.matchIn.some(field => {
      const value = getFieldValue(content, field)
      return matchKeyword(value, filter.keyword, filter.caseSensitive)
    })
  })
}

export function extractContentFromElement(element: HTMLElement): ContentData {
  const titleEl = element.querySelector('.bili-video-card__info--title')
  const authorEl = element.querySelector('.bili-video-card__info--author')

  return {
    title: titleEl?.textContent?.trim() || '',
    author: authorEl?.textContent?.trim() || '',
    description: '',
    tags: [],
  }
}
