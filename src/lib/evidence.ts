export interface Evidence {
  type: 'creator' | 'video'
  target_id: string
  title: string
  author: string
  url: string
  thumbnail_url: string | null
  timestamp: number
  page_url: string
}

export function collectEvidence(
  element: HTMLElement,
  type: 'creator' | 'video',
  targetId: string
): Evidence {
  const titleEl = element.querySelector('.bili-video-card__info--tit, .floor-single-card .title span, p.title span')
  const authorEl = element.querySelector('.bili-video-card__info--author, .sub-title span')
  const linkEl = element.querySelector('a[href*="bilibili.com/video/"], a[href*="live.bilibili.com"]')
  const imgEl = element.querySelector('img')

  return {
    type,
    target_id: targetId,
    title: titleEl?.textContent?.trim() || '',
    author: authorEl?.textContent?.trim() || '',
    url: linkEl?.getAttribute('href') || '',
    thumbnail_url: imgEl?.getAttribute('src') || null,
    timestamp: Date.now(),
    page_url: window.location.href,
  }
}

export function formatEvidenceForReport(evidence: Evidence): string {
  return [
    `Title: ${evidence.title}`,
    `Author: ${evidence.author}`,
    `URL: ${evidence.url}`,
    `Page: ${evidence.page_url}`,
    `Time: ${new Date(evidence.timestamp).toISOString()}`,
  ].join('\n')
}
