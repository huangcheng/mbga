export interface TypeFilter {
  id: string
  type: ContentType
  enabled: boolean
}

export interface KeywordFilter {
  id: string
  keyword: string
  matchIn: MatchTarget[]
  caseSensitive: boolean
  enabled: boolean
}

export interface IDFilter {
  id: string
  targetId: string
  type: 'video' | 'creator'
  enabled: boolean
}

export type ContentType = 'video' | 'live' | 'course' | 'bangumi' | 'article' | 'dynamic' | 'ad' | 'esports' | 'variety'

export type MatchTarget = 'title' | 'description' | 'tags' | 'author'

export interface Profile {
  id: string
  name: string
  description: string
  isDefault: boolean
  filters: {
    types: TypeFilter[]
    keywords: KeywordFilter[]
    ids: IDFilter[]
  }
  createdAt: number
  updatedAt: number
}

export interface Settings {
  pauseUntil: number | null
  showBlockedIndicator: boolean
  enableQuickBlock: boolean
  enabled: boolean
}

export interface Stats {
  totalBlocked: number
  blockedToday: number
  blockedByType: Record<string, number>
}

export interface StorageSchema {
  profile: Profile
  settings: Settings
  stats: Stats
}

export interface BlockedContent {
  element: HTMLElement
  reason: string
  filterType: 'type' | 'keyword' | 'id' | 'ad'
  filterId: string
}
