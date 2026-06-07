import { describe, it, expect, beforeEach } from 'vitest'
import { collectEvidence, formatEvidenceForReport, Evidence } from '../../src/lib/evidence'

describe('evidence', () => {
  beforeEach(() => {
    // Reset window.location for each test
    Object.defineProperty(window, 'location', {
      value: { href: 'https://www.bilibili.com' },
      writable: true,
    })
  })

  describe('collectEvidence', () => {
    it('should collect evidence from a video card', () => {
      const card = document.createElement('div')
      card.innerHTML = `
        <a class="bili-video-card__info--tit" href="https://www.bilibili.com/video/BV123">Test Video Title</a>
        <a class="bili-video-card__info--author" href="https://space.bilibili.com/123">Test Author</a>
        <a href="https://www.bilibili.com/video/BV123">Link</a>
        <img src="https://example.com/thumb.jpg" />
      `

      const evidence = collectEvidence(card, 'video', 'BV123')

      expect(evidence.type).toBe('video')
      expect(evidence.target_id).toBe('BV123')
      expect(evidence.title).toBe('Test Video Title')
      expect(evidence.author).toBe('Test Author')
      expect(evidence.url).toBe('https://www.bilibili.com/video/BV123')
      expect(evidence.thumbnail_url).toBe('https://example.com/thumb.jpg')
      expect(evidence.page_url).toBe('https://www.bilibili.com')
      expect(evidence.timestamp).toBeGreaterThan(0)
    })

    it('should collect evidence from a creator card', () => {
      const card = document.createElement('div')
      card.className = 'floor-single-card'
      card.innerHTML = `
        <div class="title"><span>Creator Name</span></div>
        <span class="sub-title"><span>Creator Bio</span></span>
        <a href="https://live.bilibili.com/123">Live Link</a>
      `

      const evidence = collectEvidence(card, 'creator', '123')

      expect(evidence.type).toBe('creator')
      expect(evidence.target_id).toBe('123')
      expect(evidence.title).toBe('Creator Name')
      expect(evidence.author).toBe('Creator Bio')
    })

    it('should handle missing elements gracefully', () => {
      const card = document.createElement('div')
      card.innerHTML = '<div>Empty card</div>'

      const evidence = collectEvidence(card, 'video', 'BV456')

      expect(evidence.title).toBe('')
      expect(evidence.author).toBe('')
      expect(evidence.url).toBe('')
      expect(evidence.thumbnail_url).toBeNull()
    })
  })

  describe('formatEvidenceForReport', () => {
    it('should format evidence into a readable report string', () => {
      const evidence: Evidence = {
        type: 'video',
        target_id: 'BV123',
        title: 'Test Video',
        author: 'Test Author',
        url: 'https://www.bilibili.com/video/BV123',
        thumbnail_url: 'https://example.com/thumb.jpg',
        timestamp: 1700000000000,
        page_url: 'https://www.bilibili.com',
      }

      const report = formatEvidenceForReport(evidence)

      expect(report).toContain('Title: Test Video')
      expect(report).toContain('Author: Test Author')
      expect(report).toContain('URL: https://www.bilibili.com/video/BV123')
      expect(report).toContain('Page: https://www.bilibili.com')
      expect(report).toContain('Time: 2023-11-14T22:13:20.000Z')
    })

    it('should handle empty fields', () => {
      const evidence: Evidence = {
        type: 'creator',
        target_id: '456',
        title: '',
        author: '',
        url: '',
        thumbnail_url: null,
        timestamp: 1700000000000,
        page_url: 'https://www.bilibili.com',
      }

      const report = formatEvidenceForReport(evidence)

      expect(report).toContain('Title: ')
      expect(report).toContain('Author: ')
      expect(report).toContain('URL: ')
    })
  })
})
