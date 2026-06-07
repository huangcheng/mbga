export function applyBlockOverlay(element: HTMLElement, reason: string): void {
  if (element.classList.contains('mbga-blocked')) return

  element.classList.add('mbga-blocked')
  
  // Remove the entire card from DOM
  const parent = element.closest('.feed-card, .floor-single-card')
  if (parent) {
    parent.remove()
  } else {
    element.remove()
  }
}

export function removeBlockOverlay(element: HTMLElement): void {
  // Can't un-remove from DOM
  element.classList.remove('mbga-blocked')
}
