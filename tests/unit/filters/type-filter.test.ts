import { describe, it, expect } from 'vitest'
import { detectContentType, shouldBlockByType } from '../../../src/contents/filters/type-filter'
import type { TypeFilter } from '../../../src/lib/types'

describe('Type Filter', () => {
  describe('detectContentType', () => {
    it('should detect video URLs', () => {
      expect(detectContentType('https://www.bilibili.com/video/BV1234567890')).toBe('video')
    })

    it('should detect live URLs', () => {
      expect(detectContentType('https://live.bilibili.com/123456')).toBe('live')
    })

    it('should detect course URLs', () => {
      expect(detectContentType('https://www.bilibili.com/cheese/play/ss123456')).toBe('course')
    })

    it('should detect bangumi URLs', () => {
      expect(detectContentType('https://www.bilibili.com/bangumi/play/ep123456')).toBe('bangumi')
    })

    it('should return null for unknown URLs', () => {
      expect(detectContentType('https://www.example.com')).toBeNull()
    })
  })

  describe('shouldBlockByType', () => {
    it('should block when type matches enabled filter', () => {
      const filters: TypeFilter[] = [
        { id: '1', type: 'live', enabled: true },
      ]
      expect(shouldBlockByType('live', filters)).toBe(true)
    })

    it('should not block when type matches disabled filter', () => {
      const filters: TypeFilter[] = [
        { id: '1', type: 'live', enabled: false },
      ]
      expect(shouldBlockByType('live', filters)).toBe(false)
    })

    it('should not block when type does not match', () => {
      const filters: TypeFilter[] = [
        { id: '1', type: 'live', enabled: true },
      ]
      expect(shouldBlockByType('video', filters)).toBe(false)
    })

    it('should handle empty filters', () => {
      expect(shouldBlockByType('live', [])).toBe(false)
    })
  })
})
