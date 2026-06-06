import { describe, it, expect } from 'vitest'
import { extractVideoId, extractCreatorId, shouldBlockById } from '../../../src/contents/filters/id-filter'
import type { IDFilter } from '../../../src/lib/types'

describe('ID Filter', () => {
  describe('extractVideoId', () => {
    it('should extract BV ID from URL', () => {
      expect(extractVideoId('https://www.bilibili.com/video/BV1234567890')).toBe('BV1234567890')
    })

    it('should return null for non-video URLs', () => {
      expect(extractVideoId('https://www.example.com')).toBeNull()
    })
  })

  describe('extractCreatorId', () => {
    it('should extract creator ID from space URL', () => {
      expect(extractCreatorId('https://space.bilibili.com/12345678')).toBe('12345678')
    })

    it('should return null for non-space URLs', () => {
      expect(extractCreatorId('https://www.example.com')).toBeNull()
    })
  })

  describe('shouldBlockById', () => {
    it('should block when video ID matches', () => {
      const filters: IDFilter[] = [
        { id: '1', targetId: 'BV1234567890', type: 'video', enabled: true },
      ]
      expect(shouldBlockById({ videoId: 'BV1234567890', creatorId: null }, filters)).toBe(true)
    })

    it('should block when creator ID matches', () => {
      const filters: IDFilter[] = [
        { id: '1', targetId: '12345678', type: 'creator', enabled: true },
      ]
      expect(shouldBlockById({ videoId: null, creatorId: '12345678' }, filters)).toBe(true)
    })

    it('should not block when ID does not match', () => {
      const filters: IDFilter[] = [
        { id: '1', targetId: 'BV1234567890', type: 'video', enabled: true },
      ]
      expect(shouldBlockById({ videoId: 'BV9999999999', creatorId: null }, filters)).toBe(false)
    })

    it('should not block when filter is disabled', () => {
      const filters: IDFilter[] = [
        { id: '1', targetId: 'BV1234567890', type: 'video', enabled: false },
      ]
      expect(shouldBlockById({ videoId: 'BV1234567890', creatorId: null }, filters)).toBe(false)
    })
  })
})
