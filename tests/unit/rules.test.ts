import { describe, it, expect } from 'vitest'
import { evaluateContent } from '../../src/lib/rules'
import type { Profile } from '../../src/lib/types'

describe('Rule Engine', () => {
  const createProfile = (overrides?: Partial<Profile>): Profile => ({
    id: 'test',
    name: 'Test Profile',
    description: '',
    isDefault: true,
    filters: {
      types: [],
      keywords: [],
      ids: [],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  })

  describe('evaluateContent', () => {
    it('should block content matching type filter', () => {
      const profile = createProfile({
        filters: {
          types: [{ id: '1', type: 'live', enabled: true }],
          keywords: [],
          ids: [],
        },
      })

      const result = evaluateContent({
        url: 'https://live.bilibili.com/123456',
        title: 'Live Stream',
        author: 'Streamer',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(true)
      expect(result.reason).toContain('live')
      expect(result.filterType).toBe('type')
    })

    it('should block content matching keyword filter', () => {
      const profile = createProfile({
        filters: {
          types: [],
          keywords: [{ id: '1', keyword: '影视飓风', matchIn: ['title'], caseSensitive: false, enabled: true }],
          ids: [],
        },
      })

      const result = evaluateContent({
        url: 'https://www.bilibili.com/video/BV1234567890',
        title: '影视飓风新视频',
        author: 'Test',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(true)
      expect(result.reason).toContain('影视飓风')
      expect(result.filterType).toBe('keyword')
    })

    it('should block content matching ID filter (video)', () => {
      const profile = createProfile({
        filters: {
          types: [],
          keywords: [],
          ids: [{ id: '1', targetId: 'BV1234567890', type: 'video', enabled: true }],
        },
      })

      const result = evaluateContent({
        url: 'https://www.bilibili.com/video/BV1234567890',
        title: 'Test Video',
        author: 'Test',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(true)
      expect(result.reason).toContain('video')
      expect(result.reason).toContain('BV1234567890')
      expect(result.filterType).toBe('id')
    })

    it('should block content matching ID filter (creator)', () => {
      const profile = createProfile({
        filters: {
          types: [],
          keywords: [],
          ids: [{ id: '1', targetId: '123456', type: 'creator', enabled: true }],
        },
      })

      const result = evaluateContent({
        url: 'https://space.bilibili.com/123456',
        title: 'Creator Page',
        author: 'Creator',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(true)
      expect(result.reason).toContain('creator')
      expect(result.reason).toContain('123456')
      expect(result.filterType).toBe('id')
    })

    it('should not block content matching no filters', () => {
      const profile = createProfile()

      const result = evaluateContent({
        url: 'https://www.bilibili.com/video/BV1234567890',
        title: 'Normal Video',
        author: 'Normal Author',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(false)
      expect(result.reason).toBeNull()
      expect(result.filterType).toBeNull()
      expect(result.filterId).toBeNull()
    })

    it('should not block when type filter is disabled', () => {
      const profile = createProfile({
        filters: {
          types: [{ id: '1', type: 'live', enabled: false }],
          keywords: [],
          ids: [],
        },
      })

      const result = evaluateContent({
        url: 'https://live.bilibili.com/123456',
        title: 'Live Stream',
        author: 'Streamer',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(false)
    })

    it('should not block when keyword filter is disabled', () => {
      const profile = createProfile({
        filters: {
          types: [],
          keywords: [{ id: '1', keyword: '屏蔽', matchIn: ['title'], caseSensitive: false, enabled: false }],
          ids: [],
        },
      })

      const result = evaluateContent({
        url: 'https://www.bilibili.com/video/BV1234567890',
        title: '屏蔽测试',
        author: 'Test',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(false)
    })

    it('should not block when ID filter is disabled', () => {
      const profile = createProfile({
        filters: {
          types: [],
          keywords: [],
          ids: [{ id: '1', targetId: 'BV1234567890', type: 'video', enabled: false }],
        },
      })

      const result = evaluateContent({
        url: 'https://www.bilibili.com/video/BV1234567890',
        title: 'Test Video',
        author: 'Test',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(false)
    })

    it('should prioritize type filter over ID and keyword filters', () => {
      const profile = createProfile({
        filters: {
          types: [{ id: 'type-1', type: 'live', enabled: true }],
          keywords: [{ id: 'kw-1', keyword: '测试', matchIn: ['title'], caseSensitive: false, enabled: true }],
          ids: [{ id: 'id-1', targetId: 'BV1234567890', type: 'video', enabled: true }],
        },
      })

      const result = evaluateContent({
        url: 'https://live.bilibili.com/123456',
        title: '测试直播',
        author: 'Streamer',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(true)
      expect(result.filterType).toBe('type')
      expect(result.filterId).toBe('type-1')
    })

    it('should prioritize ID filter over keyword filter', () => {
      const profile = createProfile({
        filters: {
          types: [],
          keywords: [{ id: 'kw-1', keyword: '测试', matchIn: ['title'], caseSensitive: false, enabled: true }],
          ids: [{ id: 'id-1', targetId: 'BV1234567890', type: 'video', enabled: true }],
        },
      })

      const result = evaluateContent({
        url: 'https://www.bilibili.com/video/BV1234567890',
        title: '测试视频',
        author: 'Test',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(true)
      expect(result.filterType).toBe('id')
      expect(result.filterId).toBe('id-1')
    })

    it('should handle keyword matching in author field', () => {
      const profile = createProfile({
        filters: {
          types: [],
          keywords: [{ id: '1', keyword: '营销号', matchIn: ['author'], caseSensitive: false, enabled: true }],
          ids: [],
        },
      })

      const result = evaluateContent({
        url: 'https://www.bilibili.com/video/BV1234567890',
        title: 'Some Video',
        author: '某某营销号',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(true)
      expect(result.reason).toContain('营销号')
    })

    it('should respect case sensitivity in keyword matching', () => {
      const profile = createProfile({
        filters: {
          types: [],
          keywords: [{ id: '1', keyword: 'Test', matchIn: ['title'], caseSensitive: true, enabled: true }],
          ids: [],
        },
      })

      const resultCaseMatch = evaluateContent({
        url: 'https://www.bilibili.com/video/BV1234567890',
        title: 'Test Video',
        author: 'Test',
        element: document.createElement('div'),
      }, profile)
      expect(resultCaseMatch.blocked).toBe(true)

      const resultCaseNoMatch = evaluateContent({
        url: 'https://www.bilibili.com/video/BV1234567890',
        title: 'test video',
        author: 'Test',
        element: document.createElement('div'),
      }, profile)
      expect(resultCaseNoMatch.blocked).toBe(false)
    })

    it('should return filterId in the result', () => {
      const profile = createProfile({
        filters: {
          types: [{ id: 'type-filter-abc', type: 'video', enabled: true }],
          keywords: [],
          ids: [],
        },
      })

      const result = evaluateContent({
        url: 'https://www.bilibili.com/video/BV1234567890',
        title: 'Test Video',
        author: 'Test',
        element: document.createElement('div'),
      }, profile)

      expect(result.blocked).toBe(true)
      expect(result.filterId).toBe('type-filter-abc')
    })
  })
})
