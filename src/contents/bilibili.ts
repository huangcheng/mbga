import type { PlasmoCSConfig } from 'plasmo'
import { StorageManager } from '../lib/storage'
import { evaluateContent } from '../lib/rules'
import { SELECTORS } from '../lib/constants'
import { applyBlockOverlay, removeBlockOverlay } from './ui/blur-overlay'

export const config: PlasmoCSConfig = {
  matches: ['https://*.bilibili.com/*'],
  run_at: 'document_start',
}

const storage = new StorageManager()
let isProcessing = false

// Hide feed initially to prevent content flash
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

// Show feed after filtering
function showFeed(): void {
  const style = document.getElementById('mbga-initial-hide')
  if (style) {
    style.remove()
  }
}

// Process a single video card
async function processCard(card: HTMLElement): Promise<void> {
  const settings = await storage.getSettings()
  if (!settings.enabled) return

  // Check if paused
  if (settings.pauseUntil && Date.now() < settings.pauseUntil) return

  const profile = await storage.getProfile()
  const links = card.querySelectorAll('a[href]')
  let url = ''
  let title = ''
  let author = ''

  links.forEach(link => {
    const href = link.getAttribute('href') || ''
    if (href.includes('bilibili.com/video/') || href.includes('live.bilibili.com')) {
      url = href.startsWith('//') ? `https:${href}` : href
    }
  })

  const titleEl = card.querySelector(SELECTORS.VIDEO_TITLE)
  const authorEl = card.querySelector(SELECTORS.VIDEO_AUTHOR)
  title = titleEl?.textContent?.trim() || ''
  author = authorEl?.textContent?.trim() || ''

  const result = evaluateContent({ url, title, author, element: card }, profile)

  if (result.blocked) {
    applyBlockOverlay(card, result.reason || 'Blocked by MBGA')
    await storage.incrementStats(result.filterType || 'unknown')
  }
}

// Process all visible cards
async function processAllCards(): Promise<void> {
  if (isProcessing) return
  isProcessing = true

  try {
    const cards = document.querySelectorAll(SELECTORS.VIDEO_CARD)
    for (const card of cards) {
      await processCard(card as HTMLElement)
    }
  } finally {
    isProcessing = false
    showFeed()
  }
}

// Watch for new cards (SPA navigation)
function setupMutationObserver(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          const cards = node.querySelectorAll?.(SELECTORS.VIDEO_CARD)
          if (cards) {
            cards.forEach((card: HTMLElement) => processCard(card))
          }
        }
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

// Initialize
async function init(): Promise<void> {
  hideFeed()

  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve)
    })
  }

  await processAllCards()
  setupMutationObserver()
}

init()
