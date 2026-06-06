import { BILIBILI_URLS } from '../../lib/constants'

const AD_INDICATORS = [
  'cm.bilibili.com',
  'ad-card',
  'promote',
  'sponsor',
  '广告',
]

export function isAdvertisement(element: HTMLElement): boolean {
  // Check links for ad URLs
  const links = element.querySelectorAll('a[href]')
  for (const link of links) {
    const href = link.getAttribute('href') || ''
    if (href.includes(BILIBILI_URLS.AD)) {
      return true
    }
  }

  // Check classes for ad indicators
  const classes = element.className || ''
  if (typeof classes === 'string') {
    for (const indicator of AD_INDICATORS) {
      if (classes.includes(indicator)) {
        return true
      }
    }
  }

  // Check for ad text content
  const text = element.textContent || ''
  if (text.includes('广告') || text.includes('推广')) {
    return true
  }

  return false
}
