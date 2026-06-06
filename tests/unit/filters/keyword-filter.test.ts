import { describe, it, expect } from 'vitest'
import { shouldBlockByKeyword } from '../../../src/contents/filters/keyword-filter'
import type { KeywordFilter } from '../../../src/lib/types'

describe('Keyword Filter', () => {
  const createContent = (title: string, author: string = 'Test Author') => ({
    title,
    author,
    description: '',
    tags: [],
  })

  it('should block when keyword matches title', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: '影视飓风', matchIn: ['title'], caseSensitive: false, enabled: true },
    ]
    expect(shouldBlockByKeyword(createContent('影视飓风新视频'), filters)).toBe(true)
  })

  it('should block when keyword matches author', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: '影视飓风', matchIn: ['author'], caseSensitive: false, enabled: true },
    ]
    expect(shouldBlockByKeyword(createContent('视频标题', '影视飓风'), filters)).toBe(true)
  })

  it('should not block when keyword does not match', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: '影视飓风', matchIn: ['title'], caseSensitive: false, enabled: true },
    ]
    expect(shouldBlockByKeyword(createContent('其他视频'), filters)).toBe(false)
  })

  it('should respect case sensitivity', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: 'TEST', matchIn: ['title'], caseSensitive: true, enabled: true },
    ]
    expect(shouldBlockByKeyword(createContent('test video'), filters)).toBe(false)
    expect(shouldBlockByKeyword(createContent('TEST video'), filters)).toBe(true)
  })

  it('should not block when filter is disabled', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: '影视飓风', matchIn: ['title'], caseSensitive: false, enabled: false },
    ]
    expect(shouldBlockByKeyword(createContent('影视飓风新视频'), filters)).toBe(false)
  })

  it('should handle multiple filters', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: '影视飓风', matchIn: ['title'], caseSensitive: false, enabled: true },
      { id: '2', keyword: '广告', matchIn: ['title'], caseSensitive: false, enabled: true },
    ]
    expect(shouldBlockByKeyword(createContent('影视飓风新视频'), filters)).toBe(true)
    expect(shouldBlockByKeyword(createContent('广告视频'), filters)).toBe(true)
    expect(shouldBlockByKeyword(createContent('正常视频'), filters)).toBe(false)
  })
})
