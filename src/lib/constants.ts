import type { ContentType } from './types'

// Bilibili URL patterns
export const BILIBILI_URLS = {
  VIDEO: 'bilibili.com/video/',
  LIVE: 'live.bilibili.com/',
  COURSE: 'bilibili.com/cheese/',
  BANGUMI: 'bilibili.com/bangumi/',
  ARTICLE: 'bilibili.com/read/',
  DYNAMIC: 't.bilibili.com/',
  AD: 'cm.bilibili.com/',
} as const

// DOM selectors for Bilibili elements
export const SELECTORS = {
  // Video cards in main feed
  VIDEO_CARD: '.bili-video-card:not(.bili-video-card__skeleton)',
  // Live stream cards (different structure!)
  LIVE_CARD: '.floor-single-card',
  // Both card types combined
  ALL_CARDS: '.bili-video-card:not(.bili-video-card__skeleton), .floor-single-card',
  VIDEO_CARD_WRAP: '.bili-video-card__wrap',
  VIDEO_COVER: '.bili-video-card__cover',
  VIDEO_TITLE: '.bili-video-card__info--tit, .floor-single-card .title span, p.title span',
  VIDEO_AUTHOR: '.bili-video-card__info--author, .floor-single-card .sub-title span',
  VIDEO_DATE: '.bili-video-card__info--date',
  VIDEO_STATS: '.bili-video-card__stats',
  FEED_CONTAINER: '.bili-feed-card',
  LIVE_INDICATOR: '[class*="live-tag"], [class*="live-status"], .living, span:has-text("直播中")',
  AD_INDICATOR: '[class*="ad"], [class*="promote"]',
} as const

// Map URL patterns to content types
export const CONTENT_TYPE_MAP: Record<string, ContentType> = {
  'video/': 'video',
  'live.bilibili.com': 'live',
  'cheese/': 'course',
  'bangumi/': 'bangumi',
  'read/': 'article',
  't.bilibili.com': 'dynamic',
  'cm.bilibili.com': 'ad',
}

// Badge text to content type mapping
export const BADGE_TYPE_MAP: Record<string, ContentType> = {
  '赛事': 'esports',
  '直播中': 'live',
  '综艺': 'variety',
  '番剧': 'bangumi',
  '国创': 'bangumi',
  '课堂': 'course',
}

// Filter execution order (fastest to slowest)
export const FILTER_ORDER = ['type', 'id', 'keyword', 'ad'] as const

// CSS styles for blocked content
export const BLOCK_STYLES = {
  BLUR_CSS: 'filter: brightness(0) saturate(0); pointer-events: none;',
  OVERLAY_CLASS: 'mbga-blocked-overlay',
  BADGE_CLASS: 'mbga-blocked-badge',
} as const
