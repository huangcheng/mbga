import { StorageManager } from '../../lib/storage'
import { addReportButton } from './report-button'

const storage = new StorageManager()

/**
 * Add MBGA options to Bilibili's "not interested" popup menu
 */
export function setupQuickBlock(): void {
  console.log('[MBGA] Quick block setup started')
  
  // Watch for the popup appearing
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          // Check for the popup panel
          const popup = node.querySelector?.('.bili-video-card__info--no-interest-panel') 
            || (node.classList?.contains('bili-video-card__info--no-interest-panel') ? node : null)
            || node.querySelector?.('.vui_popover-content')
          
          if (popup) {
            console.log('[MBGA] Popup detected, adding options')
            addMBGAOptions(popup as HTMLElement)
          }
        }
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
  
  console.log('[MBGA] Quick block observer set up')
}

/**
 * Add MBGA block options to the popup menu
 */
function addMBGAOptions(panel: HTMLElement): void {
  console.log('[MBGA] addMBGAOptions called')
  
  // The popup is floating, not inside the card
  // Find the card by looking at what's being hovered/focused
  const card = findAssociatedCard()
  console.log('[MBGA] Found card:', !!card)
  if (!card) return

  // Check if already added
  if ((panel as any).__mbgaAdded) return
  ;(panel as any).__mbgaAdded = true

  // Get video URL
  const link = card.querySelector('a[href*="bilibili.com/video/"], a[href*="live.bilibili.com"]')
  const url = link?.getAttribute('href') || ''
  const fullUrl = url.startsWith('//') ? `https:${url}` : url

  // Get creator info
  const authorEl = card.querySelector('.bili-video-card__info--author, .sub-title span')
  const authorName = authorEl?.textContent?.trim() || ''

  // Get creator ID from space link
  const spaceLink = card.querySelector('a[href*="space.bilibili.com"]')
  const spaceUrl = spaceLink?.getAttribute('href') || ''
  const creatorId = extractCreatorIdFromUrl(spaceUrl)

  // Get video ID
  const videoId = extractVideoIdFromUrl(fullUrl)

  console.log('[MBGA] Creator:', authorName, 'ID:', creatorId, 'Video:', videoId)

  // Add separator
  const separator = document.createElement('div')
  separator.className = 'mbga-quick-block'
  separator.style.cssText = 'height: 1px; background: #e3e5e7; margin: 4px 0;'
  panel.appendChild(separator)

  // Add "Block UP主" option
  if (creatorId) {
    const blockCreator = createMenuItem(
      '🚫 屏蔽UP主',
      () => handleBlockCreator(creatorId, authorName)
    )
    panel.appendChild(blockCreator)
  }

  // Add "Block 视频" option
  if (videoId) {
    const blockVideo = createMenuItem(
      '🚫 屏蔽此视频',
      () => handleBlockVideo(videoId)
    )
    panel.appendChild(blockVideo)
  }

  // Add report button
  addReportButton(panel, card as HTMLElement)
}

/**
 * Find the video card associated with the popup
 */
function findAssociatedCard(): HTMLElement | null {
  // Method 1: Find the last hovered card
  const hoveredCard = document.querySelector('.bili-video-card:hover, .floor-single-card:hover')
  if (hoveredCard) return hoveredCard as HTMLElement

  // Method 2: Find the card with the no-interest button visible
  const visibleButtons = document.querySelectorAll('.bili-video-card__info--no-interest')
  for (const btn of visibleButtons) {
    if ((btn as HTMLElement).style.display !== 'none') {
      return btn.closest('.bili-video-card, .floor-single-card') as HTMLElement
    }
  }

  // Method 3: Find any card that has focus or is being interacted with
  const cards = document.querySelectorAll('.bili-video-card.is-rcmd, .floor-single-card')
  for (const card of cards) {
    const rect = card.getBoundingClientRect()
    // Check if mouse is over this card area
    if (rect.width > 0 && rect.height > 0) {
      return card as HTMLElement
    }
  }

  return null
}

/**
 * Create a menu item element
 */
function createMenuItem(text: string, onClick: () => void): HTMLElement {
  const item = document.createElement('div')
  item.className = 'bili-video-card__info--no-interest-panel--item mbga-quick-block'
  item.textContent = text
  item.style.cssText = 'cursor: pointer; padding: 8px 12px; font-size: 12px;'
  item.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    onClick()
  })
  return item
}

/**
 * Handle blocking a creator
 */
async function handleBlockCreator(creatorId: string, name: string): Promise<void> {
  try {
    await storage.addIDFilter({
      targetId: creatorId,
      type: 'creator',
      enabled: true
    })
    showToast(`已屏蔽UP主: ${name}`)
  } catch (error) {
    showToast('屏蔽失败', 'error')
  }
}

/**
 * Handle blocking a video
 */
async function handleBlockVideo(videoId: string): Promise<void> {
  try {
    await storage.addIDFilter({
      targetId: videoId,
      type: 'video',
      enabled: true
    })
    showToast(`已屏蔽视频: ${videoId}`)
  } catch (error) {
    showToast('屏蔽失败', 'error')
  }
}

/**
 * Show a toast notification
 */
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#67c23a' : '#f56c6c'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    z-index: 99999;
    animation: mbga-toast 3s ease-in-out;
  `
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

/**
 * Extract creator ID from space URL
 */
function extractCreatorIdFromUrl(url: string): string | null {
  const match = url.match(/space\.bilibili\.com\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Extract video ID from URL
 */
function extractVideoIdFromUrl(url: string): string | null {
  const match = url.match(/\/video\/(BV[a-zA-Z0-9]+)/)
  return match ? match[1] : null
}
