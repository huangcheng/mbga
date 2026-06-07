import type { PlasmoCSConfig } from 'plasmo'
import { StorageManager } from '../lib/storage'
import { evaluateContent } from '../lib/rules'
import { SELECTORS, BADGE_TYPE_MAP } from '../lib/constants'
import { applyBlockOverlay, removeBlockOverlay } from './ui/blur-overlay'
import { setupQuickBlock } from './ui/quick-block'

export const config: PlasmoCSConfig = {
  matches: ['https://*.bilibili.com/*'],
  run_at: 'document_start',
}

console.log('[MBGA] Content script loaded!')

// Add toast animation CSS
const toastStyle = document.createElement('style')
toastStyle.textContent = `
  @keyframes mbga-toast {
    0% { opacity: 0; transform: translateY(-20px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
`
document.head?.appendChild(toastStyle)

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
    // Handle both absolute and protocol-relative URLs
    const fullUrl = href.startsWith('//') ? `https:${href}` : href
    
    // Match video URLs
    if (fullUrl.includes('bilibili.com/video/')) {
      url = fullUrl
    }
    // Match live stream URLs
    else if (fullUrl.includes('live.bilibili.com')) {
      url = fullUrl
    }
    // Match ad URLs (cm.bilibili.com)
    else if (fullUrl.includes('cm.bilibili.com')) {
      url = fullUrl
    }
  })

  // Detect badge type (赛事, 综艺, etc.)
  const badgeEl = card.querySelector('.floor-title, .badge span')
  const badgeText = badgeEl?.textContent?.trim() || ''
  const badgeType = BADGE_TYPE_MAP[badgeText] || null

  // Also detect live streams by card content
  const cardText = card.textContent || ''
  const hasLiveIndicator = cardText.includes('直播中') || 
                           card.querySelector('[class*="live-tag"]') !== null

  const titleEl = card.querySelector(SELECTORS.VIDEO_TITLE)
  const authorEl = card.querySelector(SELECTORS.VIDEO_AUTHOR)
  title = titleEl?.textContent?.trim() || ''
  author = authorEl?.textContent?.trim() || ''

  // Debug logging
  const filterCount = profile.filters.types.length + profile.filters.keywords.length + profile.filters.ids.length
  const isAd = url.includes('cm.bilibili.com')
  if (url || title || hasLiveIndicator || badgeType) {
    console.log(`[MBGA] Card: url=${url?.substring(0, 60)}, title=${title?.substring(0, 30)}, live=${hasLiveIndicator}, ad=${isAd}, badge=${badgeType}, filters=${filterCount}`)
  }

  const result = evaluateContent({ url, title, author, element: card, badgeType }, profile)

  if (result.blocked) {
    console.log(`[MBGA] BLOCKED: ${result.reason}`)
    applyBlockOverlay(card, result.reason || 'Blocked by MBGA')
    await storage.incrementStats(result.filterType || 'unknown')
  }
}

// Process all visible cards
async function processAllCards(): Promise<void> {
  if (isProcessing) return
  isProcessing = true

  try {
    // Use the combined selector to match both video cards and live stream cards
    const cards = document.querySelectorAll(SELECTORS.ALL_CARDS)
    console.log(`[MBGA] Found ${cards.length} cards to process`)
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
      // Check added nodes
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          // Check if the added node is a card (video or live)
          if (node.matches?.(SELECTORS.ALL_CARDS)) {
            processCard(node)
          }
          // Check for cards inside added nodes
          const cards = node.querySelectorAll?.(SELECTORS.ALL_CARDS)
          if (cards) {
            cards.forEach((card: HTMLElement) => processCard(card))
          }
        }
      }
      
      // Also check if existing cards were modified (content loaded into skeletons)
      if (mutation.type === 'childList' && mutation.target instanceof HTMLElement) {
        const target = mutation.target
        // Check if the target is a card or is inside a card
        const card = target.closest?.(SELECTORS.ALL_CARDS)
        if (card) {
          processCard(card as HTMLElement)
        }
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  })
  
  // Also set up a periodic check for cards that were populated
  setInterval(() => {
    const cards = document.querySelectorAll(SELECTORS.ALL_CARDS)
    cards.forEach(card => {
      const htmlCard = card as HTMLElement
      // Only process cards that haven't been processed yet and have content
      if (!htmlCard.classList.contains('mbga-blocked') && !htmlCard.dataset.mbgaProcessed) {
        const title = htmlCard.querySelector(SELECTORS.VIDEO_TITLE)
        if (title?.textContent?.trim()) {
          htmlCard.dataset.mbgaProcessed = 'true'
          processCard(htmlCard)
        }
      }
    })
  }, 1000)
}

// Initialize
async function init(): Promise<void> {
  try {
    console.log('[MBGA] Initializing...')
    hideFeed()
    console.log('[MBGA] Feed hidden')

    if (document.readyState === 'loading') {
      console.log('[MBGA] Waiting for DOMContentLoaded...')
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve)
      })
    }

    console.log('[MBGA] Processing cards...')
    await processAllCards()
    console.log('[MBGA] Cards processed, setting up observer...')
    setupMutationObserver()
    console.log('[MBGA] Setting up quick block...')
    setupQuickBlock()
    console.log('[MBGA] Initialization complete!')
  } catch (error) {
    console.error('[MBGA] Error during initialization:', error)
  }
}

init()
