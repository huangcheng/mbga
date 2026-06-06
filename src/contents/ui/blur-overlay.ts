import { BLOCK_STYLES } from '../../lib/constants'

export function applyBlockOverlay(element: HTMLElement, reason: string): void {
  if (element.classList.contains('mbga-blocked')) return

  element.classList.add('mbga-blocked')
  element.style.cssText = BLOCK_STYLES.BLUR_CSS

  const overlay = document.createElement('div')
  overlay.className = BLOCK_STYLES.OVERLAY_CLASS
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10;
    cursor: pointer;
  `

  const badge = document.createElement('div')
  badge.className = BLOCK_STYLES.BADGE_CLASS
  badge.style.cssText = `
    background: #fb7299;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
  `
  badge.textContent = `Blocked by MBGA: ${reason}`

  overlay.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    removeBlockOverlay(element)
  })

  overlay.appendChild(badge)
  element.style.position = 'relative'
  element.appendChild(overlay)
}

export function removeBlockOverlay(element: HTMLElement): void {
  element.classList.remove('mbga-blocked')
  element.style.cssText = ''
  const overlay = element.querySelector(`.${BLOCK_STYLES.OVERLAY_CLASS}`)
  if (overlay) {
    overlay.remove()
  }
}
