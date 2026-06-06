import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SELECTORS } from '../../src/lib/constants'

// Extract hideFeed and showFeed for testing
// We'll recreate them here since they're not exported
function createHideFeed(): { hideFeed: () => void; showFeed: () => void } {
  function hideFeed(): void {
    const style = document.createElement('style')
    style.id = 'mbga-initial-hide'
    style.textContent = `
      ${SELECTORS.FEED_CONTAINER} {
        visibility: hidden !important;
      }
    `
    // Use documentElement which always exists, even at document_start
    const parent = document.head || document.documentElement
    parent.appendChild(style)
  }

  function showFeed(): void {
    const style = document.getElementById('mbga-initial-hide')
    if (style) {
      style.remove()
    }
  }

  return { hideFeed, showFeed }
}

describe('Content Script - hideFeed/showFeed', () => {
  let hideFeed: () => void
  let showFeed: () => void

  beforeEach(() => {
    // Clean up any existing style elements
    document.querySelectorAll('#mbga-initial-hide').forEach(el => el.remove())
    ;({ hideFeed, showFeed } = createHideFeed())
  })

  describe('hideFeed', () => {
    it('should append style to document.head when head exists', () => {
      // document.head exists by default in jsdom
      hideFeed()

      const style = document.getElementById('mbga-initial-hide')
      expect(style).not.toBeNull()
      expect(style).toBeInstanceOf(HTMLStyleElement)
      expect(style?.textContent).toContain(SELECTORS.FEED_CONTAINER)
      expect(style?.textContent).toContain('visibility: hidden !important')
      expect(document.head.contains(style)).toBe(true)
    })

    it('should append style to document.documentElement when head is null', () => {
      // Simulate document_start where document.head is null
      Object.defineProperty(document, 'head', {
        value: null,
        configurable: true,
      })

      hideFeed()

      const style = document.getElementById('mbga-initial-hide')
      expect(style).not.toBeNull()
      expect(style).toBeInstanceOf(HTMLStyleElement)
      expect(document.documentElement.contains(style)).toBe(true)
    })
  })

  describe('showFeed', () => {
    it('should remove the style element', () => {
      hideFeed()
      expect(document.getElementById('mbga-initial-hide')).not.toBeNull()

      showFeed()

      expect(document.getElementById('mbga-initial-hide')).toBeNull()
    })

    it('should not throw when style element does not exist', () => {
      // Ensure no style exists
      expect(document.getElementById('mbga-initial-hide')).toBeNull()

      // Should not throw
      expect(() => showFeed()).not.toThrow()
    })
  })
})
