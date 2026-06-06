# MBGA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-browser extension that filters Bilibili content by type, keyword, and creator ID.

**Architecture:** Plasmo extension with content script injection at document_start, Zustand for state management, chrome.storage for persistence.

**Tech Stack:** Plasmo, React, Tailwind CSS, Zustand, Vitest, Playwright

---

## File Structure

```
mbga/
├── package.json
├── plasmo.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── src/
│   ├── background/
│   │   └── index.ts                    # Service worker entry
│   ├── contents/
│   │   ├── bilibili.ts                 # Main content script
│   │   ├── filters/
│   │   │   ├── type-filter.ts          # Type-based filtering
│   │   │   ├── keyword-filter.ts       # Keyword matching
│   │   │   ├── id-filter.ts            # Creator/video ID blocking
│   │   │   └── ad-filter.ts            # Ad/promotion blocking
│   │   └── ui/
│   │       ├── blur-overlay.ts         # Blocked content overlay
│   │       └── quick-block.ts          # Context menu integration
│   ├── popup/
│   │   ├── index.tsx                   # Popup entry
│   │   └── components/
│   │       ├── Toggle.tsx              # Enable/disable toggle
│   │       ├── PauseButton.tsx         # Pause filtering
│   │       └── Stats.tsx               # Quick stats display
│   ├── options/
│   │   ├── index.tsx                   # Options page entry
│   │   └── components/
│   │       ├── FilterManager.tsx       # Filter CRUD UI
│   │       ├── ImportExport.tsx        # Backup/restore
│   │       └── Dashboard.tsx           # Stats dashboard
│   ├── lib/
│   │   ├── storage.ts                  # Storage abstraction
│   │   ├── rules.ts                    # Rule engine
│   │   ├── types.ts                    # TypeScript types
│   │   └── constants.ts                # DOM selectors, URLs
│   └── assets/
│       └── icon.png                    # Extension icon
├── tests/
│   ├── unit/
│   │   ├── filters/
│   │   │   ├── type-filter.test.ts
│   │   │   ├── keyword-filter.test.ts
│   │   │   └── id-filter.test.ts
│   │   ├── storage.test.ts
│   │   └── rules.test.ts
│   └── e2e/
│       └── bilibili.test.ts
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-06-07-mbga-design.md
        └── plans/
            └── 2026-06-07-mbga-implementation.md
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `plasmo.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.gitignore`

- [ ] **Step 1: Initialize Plasmo project**

```bash
cd F:\mbga
npm create plasmo@latest . -- --template=with-tailwindcss
```

Expected: Plasmo scaffolds project with React, Tailwind CSS, TypeScript

- [ ] **Step 2: Install dependencies**

```bash
npm install zustand @plasmohq/storage
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
})
```

Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "plasmo dev",
    "build": "plasmo build",
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 5: Initialize git and commit**

```bash
git init
git add .
git commit -m "chore: initialize MBGA project with Plasmo"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write failing test for types**

Create `tests/unit/types.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import type { TypeFilter, KeywordFilter, IDFilter, Profile, StorageSchema } from '../../src/lib/types'

describe('Type definitions', () => {
  it('should allow creating a TypeFilter', () => {
    const filter: TypeFilter = {
      id: 'test-id',
      type: 'live',
      enabled: true,
    }
    expect(filter.type).toBe('live')
  })

  it('should allow creating a KeywordFilter', () => {
    const filter: KeywordFilter = {
      id: 'test-id',
      keyword: '影视飓风',
      matchIn: ['title'],
      caseSensitive: false,
      enabled: true,
    }
    expect(filter.keyword).toBe('影视飓风')
  })

  it('should allow creating an IDFilter', () => {
    const filter: IDFilter = {
      id: 'test-id',
      targetId: '12345678',
      type: 'creator',
      enabled: true,
    }
    expect(filter.type).toBe('creator')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/unit/types.test.ts
```

Expected: FAIL with "Cannot find module '../../src/lib/types'"

- [ ] **Step 3: Create type definitions**

Create `src/lib/types.ts`:
```typescript
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

export type ContentType = 'video' | 'live' | 'course' | 'bangumi' | 'article' | 'dynamic' | 'ad'

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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/unit/types.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts tests/unit/types.test.ts
git commit -m "feat: add type definitions for filters and storage"
```

---

## Task 3: Storage Layer

**Files:**
- Create: `src/lib/storage.ts`
- Create: `tests/unit/storage.test.ts`

- [ ] **Step 1: Write failing test for storage**

Create `tests/unit/storage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { StorageManager } from '../../src/lib/storage'

// Mock chrome.storage
const mockStorage: Record<string, any> = {}
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string[]) => {
        const result: Record<string, any> = {}
        keys.forEach(key => {
          if (mockStorage[key]) result[key] = mockStorage[key]
        })
        return Promise.resolve(result)
      }),
      set: vi.fn((items: Record<string, any>) => {
        Object.assign(mockStorage, items)
        return Promise.resolve()
      }),
      remove: vi.fn((keys: string[]) => {
        keys.forEach(key => delete mockStorage[key])
        return Promise.resolve()
      }),
    },
  },
} as any

describe('StorageManager', () => {
  let storage: StorageManager

  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    storage = new StorageManager()
  })

  it('should return default profile when no data exists', async () => {
    const profile = await storage.getProfile()
    expect(profile.name).toBe('My Filters')
    expect(profile.filters.types).toEqual([])
  })

  it('should save and retrieve filters', async () => {
    await storage.addTypeFilter({ type: 'live', enabled: true })
    const profile = await storage.getProfile()
    expect(profile.filters.types).toHaveLength(1)
    expect(profile.filters.types[0].type).toBe('live')
  })

  it('should delete filters', async () => {
    await storage.addTypeFilter({ type: 'live', enabled: true })
    const profile = await storage.getProfile()
    const filterId = profile.filters.types[0].id
    await storage.deleteTypeFilter(filterId)
    const updated = await storage.getProfile()
    expect(updated.filters.types).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/unit/storage.test.ts
```

Expected: FAIL with "Cannot find module '../../src/lib/storage'"

- [ ] **Step 3: Create storage manager**

Create `src/lib/storage.ts`:
```typescript
import type { Profile, TypeFilter, KeywordFilter, IDFilter, Settings, Stats, StorageSchema } from './types'

const DEFAULT_PROFILE: Profile = {
  id: crypto.randomUUID(),
  name: 'My Filters',
  description: 'Default filter profile',
  isDefault: true,
  filters: {
    types: [],
    keywords: [],
    ids: [],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const DEFAULT_SETTINGS: Settings = {
  pauseUntil: null,
  showBlockedIndicator: true,
  enableQuickBlock: true,
  enabled: true,
}

const DEFAULT_STATS: Stats = {
  totalBlocked: 0,
  blockedToday: 0,
  blockedByType: {},
}

export class StorageManager {
  async getProfile(): Promise<Profile> {
    const result = await chrome.storage.local.get(['profile'])
    return result.profile || { ...DEFAULT_PROFILE }
  }

  async getSettings(): Promise<Settings> {
    const result = await chrome.storage.local.get(['settings'])
    return result.settings || { ...DEFAULT_SETTINGS }
  }

  async getStats(): Promise<Stats> {
    const result = await chrome.storage.local.get(['stats'])
    return result.stats || { ...DEFAULT_STATS }
  }

  async addTypeFilter(filter: Omit<TypeFilter, 'id'>): Promise<void> {
    const profile = await this.getProfile()
    profile.filters.types.push({
      ...filter,
      id: crypto.randomUUID(),
    })
    profile.updatedAt = Date.now()
    await chrome.storage.local.set({ profile })
  }

  async deleteTypeFilter(filterId: string): Promise<void> {
    const profile = await this.getProfile()
    profile.filters.types = profile.filters.types.filter(f => f.id !== filterId)
    profile.updatedAt = Date.now()
    await chrome.storage.local.set({ profile })
  }

  async addKeywordFilter(filter: Omit<KeywordFilter, 'id'>): Promise<void> {
    const profile = await this.getProfile()
    profile.filters.keywords.push({
      ...filter,
      id: crypto.randomUUID(),
    })
    profile.updatedAt = Date.now()
    await chrome.storage.local.set({ profile })
  }

  async deleteKeywordFilter(filterId: string): Promise<void> {
    const profile = await this.getProfile()
    profile.filters.keywords = profile.filters.keywords.filter(f => f.id !== filterId)
    profile.updatedAt = Date.now()
    await chrome.storage.local.set({ profile })
  }

  async addIDFilter(filter: Omit<IDFilter, 'id'>): Promise<void> {
    const profile = await this.getProfile()
    profile.filters.ids.push({
      ...filter,
      id: crypto.randomUUID(),
    })
    profile.updatedAt = Date.now()
    await chrome.storage.local.set({ profile })
  }

  async deleteIDFilter(filterId: string): Promise<void> {
    const profile = await this.getProfile()
    profile.filters.ids = profile.filters.ids.filter(f => f.id !== filterId)
    profile.updatedAt = Date.now()
    await chrome.storage.local.set({ profile })
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    const current = await this.getSettings()
    await chrome.storage.local.set({ settings: { ...current, ...settings } })
  }

  async incrementStats(filterType: string): Promise<void> {
    const stats = await this.getStats()
    stats.totalBlocked++
    stats.blockedToday++
    stats.blockedByType[filterType] = (stats.blockedByType[filterType] || 0) + 1
    await chrome.storage.local.set({ stats })
  }

  async exportData(): Promise<string> {
    const profile = await this.getProfile()
    const settings = await this.getSettings()
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: Date.now(),
      profile,
      settings,
    }, null, 2)
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json)
    if (data.profile) {
      await chrome.storage.local.set({ profile: data.profile })
    }
    if (data.settings) {
      await chrome.storage.local.set({ settings: data.settings })
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/unit/storage.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts tests/unit/storage.test.ts
git commit -m "feat: add storage manager with CRUD operations"
```

---

## Task 4: Constants and DOM Selectors

**Files:**
- Create: `src/lib/constants.ts`

- [ ] **Step 1: Create constants file**

Create `src/lib/constants.ts`:
```typescript
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

// DOM selectors
export const SELECTORS = {
  VIDEO_CARD: '.bili-video-card.is-rcmd',
  VIDEO_CARD_WRAP: '.bili-video-card__wrap',
  VIDEO_COVER: '.bili-video-card__cover',
  VIDEO_TITLE: '.bili-video-card__info--title',
  VIDEO_AUTHOR: '.bili-video-card__info--author',
  VIDEO_DATE: '.bili-video-card__info--date',
  VIDEO_STATS: '.bili-video-card__stats',
  FEED_CONTAINER: '.bili-feed-card',
  LIVE_INDICATOR: '[class*="live-tag"], [class*="live-status"]',
  AD_INDICATOR: '[class*="ad"], [class*="promote"]',
} as const

// Content type detection
export const CONTENT_TYPE_MAP: Record<string, ContentType> = {
  'video/': 'video',
  'live.bilibili.com': 'live',
  'cheese/': 'course',
  'bangumi/': 'bangumi',
  'read/': 'article',
  't.bilibili.com': 'dynamic',
  'cm.bilibili.com': 'ad',
}

// Filter execution order
export const FILTER_ORDER = ['type', 'id', 'keyword', 'ad'] as const

// Block display settings
export const BLOCK_STYLES = {
  BLUR_CSS: 'filter: brightness(0) saturate(0); pointer-events: none;',
  OVERLAY_CLASS: 'mbga-blocked-overlay',
  BADGE_CLASS: 'mbga-blocked-badge',
} as const
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add constants for DOM selectors and URL patterns"
```

---

## Task 5: Type Filter

**Files:**
- Create: `src/contents/filters/type-filter.ts`
- Create: `tests/unit/filters/type-filter.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/filters/type-filter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { detectContentType, shouldBlockByType } from '../../../src/contents/filters/type-filter'
import type { TypeFilter } from '../../../src/lib/types'

describe('Type Filter', () => {
  describe('detectContentType', () => {
    it('should detect video URLs', () => {
      expect(detectContentType('https://www.bilibili.com/video/BV1234567890')).toBe('video')
    })

    it('should detect live URLs', () => {
      expect(detectContentType('https://live.bilibili.com/123456')).toBe('live')
    })

    it('should detect course URLs', () => {
      expect(detectContentType('https://www.bilibili.com/cheese/play/ss123456')).toBe('course')
    })

    it('should detect bangumi URLs', () => {
      expect(detectContentType('https://www.bilibili.com/bangumi/play/ep123456')).toBe('bangumi')
    })

    it('should return null for unknown URLs', () => {
      expect(detectContentType('https://www.example.com')).toBeNull()
    })
  })

  describe('shouldBlockByType', () => {
    it('should block when type matches enabled filter', () => {
      const filters: TypeFilter[] = [
        { id: '1', type: 'live', enabled: true },
      ]
      expect(shouldBlockByType('live', filters)).toBe(true)
    })

    it('should not block when type matches disabled filter', () => {
      const filters: TypeFilter[] = [
        { id: '1', type: 'live', enabled: false },
      ]
      expect(shouldBlockByType('live', filters)).toBe(false)
    })

    it('should not block when type does not match', () => {
      const filters: TypeFilter[] = [
        { id: '1', type: 'live', enabled: true },
      ]
      expect(shouldBlockByType('video', filters)).toBe(false)
    })

    it('should handle empty filters', () => {
      expect(shouldBlockByType('live', [])).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/unit/filters/type-filter.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement type filter**

Create `src/contents/filters/type-filter.ts`:
```typescript
import type { ContentType, TypeFilter } from '../../lib/types'
import { BILIBILI_URLS, CONTENT_TYPE_MAP } from '../../lib/constants'

export function detectContentType(url: string): ContentType | null {
  for (const [pattern, type] of Object.entries(CONTENT_TYPE_MAP)) {
    if (url.includes(pattern)) {
      return type
    }
  }
  return null
}

export function shouldBlockByType(
  contentType: ContentType,
  filters: TypeFilter[]
): boolean {
  return filters.some(
    filter => filter.enabled && filter.type === contentType
  )
}

export function detectContentTypeFromElement(
  element: HTMLElement,
  linkUrl?: string
): ContentType | null {
  // Try URL-based detection first
  if (linkUrl) {
    const urlType = detectContentType(linkUrl)
    if (urlType) return urlType
  }

  // Try DOM-based detection
  const classes = element.className || ''
  if (typeof classes === 'string') {
    if (classes.includes('live')) return 'live'
    if (classes.includes('cheese')) return 'course'
    if (classes.includes('bangumi')) return 'bangumi'
  }

  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/unit/filters/type-filter.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/contents/filters/type-filter.ts tests/unit/filters/type-filter.test.ts
git commit -m "feat: add type filter with URL and DOM detection"
```

---

## Task 6: Keyword Filter

**Files:**
- Create: `src/contents/filters/keyword-filter.ts`
- Create: `tests/unit/filters/keyword-filter.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/filters/keyword-filter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { shouldBlockByKeyword } from '../../../src/contents/filters/keyword-filter'
import type { KeywordFilter } from '../../../src/lib/types'

describe('Keyword Filter', () => {
  const createContent = (title: string, author: string = 'Test Author') => ({
    title,
    author,
    description: '',
    tags: [],
  })

  it('should block when keyword matches title', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: '影视飓风', matchIn: ['title'], caseSensitive: false, enabled: true },
    ]
    expect(shouldBlockByKeyword(createContent('影视飓风新视频'), filters)).toBe(true)
  })

  it('should block when keyword matches author', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: '影视飓风', matchIn: ['author'], caseSensitive: false, enabled: true },
    ]
    expect(shouldBlockByKeyword(createContent('视频标题', '影视飓风'), filters)).toBe(true)
  })

  it('should not block when keyword does not match', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: '影视飓风', matchIn: ['title'], caseSensitive: false, enabled: true },
    ]
    expect(shouldBlockByKeyword(createContent('其他视频'), filters)).toBe(false)
  })

  it('should respect case sensitivity', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: 'TEST', matchIn: ['title'], caseSensitive: true, enabled: true },
    ]
    expect(shouldBlockByKeyword(createContent('test video'), filters)).toBe(false)
    expect(shouldBlockByKeyword(createContent('TEST video'), filters)).toBe(true)
  })

  it('should not block when filter is disabled', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: '影视飓风', matchIn: ['title'], caseSensitive: false, enabled: false },
    ]
    expect(shouldBlockByKeyword(createContent('影视飓风新视频'), filters)).toBe(false)
  })

  it('should handle multiple filters', () => {
    const filters: KeywordFilter[] = [
      { id: '1', keyword: '影视飓风', matchIn: ['title'], caseSensitive: false, enabled: true },
      { id: '2', keyword: '广告', matchIn: ['title'], caseSensitive: false, enabled: true },
    ]
    expect(shouldBlockByKeyword(createContent('影视飓风新视频'), filters)).toBe(true)
    expect(shouldBlockByKeyword(createContent('广告视频'), filters)).toBe(true)
    expect(shouldBlockByKeyword(createContent('正常视频'), filters)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/unit/filters/keyword-filter.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement keyword filter**

Create `src/contents/filters/keyword-filter.ts`:
```typescript
import type { KeywordFilter, MatchTarget } from '../../lib/types'

interface ContentData {
  title: string
  author: string
  description: string
  tags: string[]
}

function matchKeyword(
  text: string,
  keyword: string,
  caseSensitive: boolean
): boolean {
  if (caseSensitive) {
    return text.includes(keyword)
  }
  return text.toLowerCase().includes(keyword.toLowerCase())
}

function getFieldValue(content: ContentData, field: MatchTarget): string {
  switch (field) {
    case 'title':
      return content.title
    case 'author':
      return content.author
    case 'description':
      return content.description
    case 'tags':
      return content.tags.join(' ')
    default:
      return ''
  }
}

export function shouldBlockByKeyword(
  content: ContentData,
  filters: KeywordFilter[]
): boolean {
  return filters.some(filter => {
    if (!filter.enabled) return false

    return filter.matchIn.some(field => {
      const value = getFieldValue(content, field)
      return matchKeyword(value, filter.keyword, filter.caseSensitive)
    })
  })
}

export function extractContentFromElement(element: HTMLElement): ContentData {
  const titleEl = element.querySelector('.bili-video-card__info--title')
  const authorEl = element.querySelector('.bili-video-card__info--author')

  return {
    title: titleEl?.textContent?.trim() || '',
    author: authorEl?.textContent?.trim() || '',
    description: '',
    tags: [],
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/unit/filters/keyword-filter.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/contents/filters/keyword-filter.ts tests/unit/filters/keyword-filter.test.ts
git commit -m "feat: add keyword filter with case sensitivity support"
```

---

## Task 7: ID Filter

**Files:**
- Create: `src/contents/filters/id-filter.ts`
- Create: `tests/unit/filters/id-filter.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/filters/id-filter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { extractVideoId, extractCreatorId, shouldBlockById } from '../../../src/contents/filters/id-filter'
import type { IDFilter } from '../../../src/lib/types'

describe('ID Filter', () => {
  describe('extractVideoId', () => {
    it('should extract BV ID from URL', () => {
      expect(extractVideoId('https://www.bilibili.com/video/BV1234567890')).toBe('BV1234567890')
    })

    it('should return null for non-video URLs', () => {
      expect(extractVideoId('https://www.example.com')).toBeNull()
    })
  })

  describe('extractCreatorId', () => {
    it('should extract creator ID from space URL', () => {
      expect(extractCreatorId('https://space.bilibili.com/12345678')).toBe('12345678')
    })

    it('should return null for non-space URLs', () => {
      expect(extractCreatorId('https://www.example.com')).toBeNull()
    })
  })

  describe('shouldBlockById', () => {
    it('should block when video ID matches', () => {
      const filters: IDFilter[] = [
        { id: '1', targetId: 'BV1234567890', type: 'video', enabled: true },
      ]
      expect(shouldBlockById({ videoId: 'BV1234567890', creatorId: null }, filters)).toBe(true)
    })

    it('should block when creator ID matches', () => {
      const filters: IDFilter[] = [
        { id: '1', targetId: '12345678', type: 'creator', enabled: true },
      ]
      expect(shouldBlockById({ videoId: null, creatorId: '12345678' }, filters)).toBe(true)
    })

    it('should not block when ID does not match', () => {
      const filters: IDFilter[] = [
        { id: '1', targetId: 'BV1234567890', type: 'video', enabled: true },
      ]
      expect(shouldBlockById({ videoId: 'BV9999999999', creatorId: null }, filters)).toBe(false)
    })

    it('should not block when filter is disabled', () => {
      const filters: IDFilter[] = [
        { id: '1', targetId: 'BV1234567890', type: 'video', enabled: false },
      ]
      expect(shouldBlockById({ videoId: 'BV1234567890', creatorId: null }, filters)).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/unit/filters/id-filter.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement ID filter**

Create `src/contents/filters/id-filter.ts`:
```typescript
import type { IDFilter } from '../../lib/types'

interface ContentIds {
  videoId: string | null
  creatorId: string | null
}

export function extractVideoId(url: string): string | null {
  const match = url.match(/\/video\/(BV[a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

export function extractCreatorId(url: string): string | null {
  const match = url.match(/space\.bilibili\.com\/(\d+)/)
  return match ? match[1] : null
}

export function extractIdsFromElement(element: HTMLElement): ContentIds {
  const links = element.querySelectorAll('a[href]')
  let videoId: string | null = null
  let creatorId: string | null = null

  links.forEach(link => {
    const href = link.getAttribute('href') || ''
    if (!videoId) videoId = extractVideoId(href)
    if (!creatorId) creatorId = extractCreatorId(href)
  })

  return { videoId, creatorId }
}

export function shouldBlockById(
  ids: ContentIds,
  filters: IDFilter[]
): boolean {
  return filters.some(filter => {
    if (!filter.enabled) return false

    if (filter.type === 'video' && ids.videoId) {
      return ids.videoId === filter.targetId
    }

    if (filter.type === 'creator' && ids.creatorId) {
      return ids.creatorId === filter.targetId
    }

    return false
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/unit/filters/id-filter.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/contents/filters/id-filter.ts tests/unit/filters/id-filter.test.ts
git commit -m "feat: add ID filter for videos and creators"
```

---

## Task 8: Ad Filter

**Files:**
- Create: `src/contents/filters/ad-filter.ts`
- Create: `tests/unit/filters/ad-filter.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/filters/ad-filter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { isAdvertisement } from '../../../src/contents/filters/ad-filter'

describe('Ad Filter', () => {
  it('should detect ad by URL', () => {
    const element = document.createElement('div')
    const link = document.createElement('a')
    link.href = 'https://cm.bilibili.com/some-ad'
    element.appendChild(link)
    expect(isAdvertisement(element)).toBe(true)
  })

  it('should detect ad by class', () => {
    const element = document.createElement('div')
    element.className = 'bili-video-card__wrap ad-card'
    expect(isAdvertisement(element)).toBe(true)
  })

  it('should not detect regular content as ad', () => {
    const element = document.createElement('div')
    element.className = 'bili-video-card__wrap'
    const link = document.createElement('a')
    link.href = 'https://www.bilibili.com/video/BV1234567890'
    element.appendChild(link)
    expect(isAdvertisement(element)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/unit/filters/ad-filter.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement ad filter**

Create `src/contents/filters/ad-filter.ts`:
```typescript
import { BILIBILI_URLS, SELECTORS } from '../../lib/constants'

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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/unit/filters/ad-filter.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/contents/filters/ad-filter.ts tests/unit/filters/ad-filter.test.ts
git commit -m "feat: add ad filter with URL and class detection"
```

---

## Task 9: Rule Engine

**Files:**
- Create: `src/lib/rules.ts`
- Create: `tests/unit/rules.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/rules.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { evaluateContent } from '../../src/lib/rules'
import type { Profile } from '../../src/lib/types'

describe('Rule Engine', () => {
  const createProfile = (overrides?: Partial<Profile>): Profile => ({
    id: 'test',
    name: 'Test Profile',
    description: '',
    isDefault: true,
    filters: {
      types: [],
      keywords: [],
      ids: [],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  })

  it('should block content matching type filter', () => {
    const profile = createProfile({
      filters: {
        types: [{ id: '1', type: 'live', enabled: true }],
        keywords: [],
        ids: [],
      },
    })

    const result = evaluateContent({
      url: 'https://live.bilibili.com/123456',
      title: 'Live Stream',
      author: 'Streamer',
      element: document.createElement('div'),
    }, profile)

    expect(result.blocked).toBe(true)
    expect(result.reason).toContain('live')
  })

  it('should block content matching keyword filter', () => {
    const profile = createProfile({
      filters: {
        types: [],
        keywords: [{ id: '1', keyword: '影视飓风', matchIn: ['title'], caseSensitive: false, enabled: true }],
        ids: [],
      },
    })

    const result = evaluateContent({
      url: 'https://www.bilibili.com/video/BV1234567890',
      title: '影视飓风新视频',
      author: 'Test',
      element: document.createElement('div'),
    }, profile)

    expect(result.blocked).toBe(true)
    expect(result.reason).toContain('影视飓风')
  })

  it('should not block content matching no filters', () => {
    const profile = createProfile()

    const result = evaluateContent({
      url: 'https://www.bilibili.com/video/BV1234567890',
      title: 'Normal Video',
      author: 'Normal Author',
      element: document.createElement('div'),
    }, profile)

    expect(result.blocked).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/unit/rules.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement rule engine**

Create `src/lib/rules.ts`:
```typescript
import type { Profile, ContentType } from './types'
import { detectContentType } from '../contents/filters/type-filter'
import { shouldBlockByKeyword } from '../contents/filters/keyword-filter'
import { extractVideoId, extractCreatorId, shouldBlockById } from '../contents/filters/id-filter'

interface ContentData {
  url: string
  title: string
  author: string
  element: HTMLElement
}

interface EvaluationResult {
  blocked: boolean
  reason: string | null
  filterType: 'type' | 'keyword' | 'id' | 'ad' | null
  filterId: string | null
}

export function evaluateContent(
  content: ContentData,
  profile: Profile
): EvaluationResult {
  const { filters } = profile

  // 1. Check type filter (fastest)
  const contentType = detectContentType(content.url)
  if (contentType) {
    const typeMatch = filters.types.find(
      f => f.enabled && f.type === contentType
    )
    if (typeMatch) {
      return {
        blocked: true,
        reason: `Blocked type: ${contentType}`,
        filterType: 'type',
        filterId: typeMatch.id,
      }
    }
  }

  // 2. Check ID filter
  const videoId = extractVideoId(content.url)
  const creatorId = extractCreatorId(content.url)
  const idMatch = filters.ids.find(f => {
    if (!f.enabled) return false
    if (f.type === 'video' && videoId) return f.targetId === videoId
    if (f.type === 'creator' && creatorId) return f.targetId === creatorId
    return false
  })
  if (idMatch) {
    return {
      blocked: true,
      reason: `Blocked ${idMatch.type}: ${idMatch.targetId}`,
      filterType: 'id',
      filterId: idMatch.id,
    }
  }

  // 3. Check keyword filter
  const keywordMatch = shouldBlockByKeyword(
    {
      title: content.title,
      author: content.author,
      description: '',
      tags: [],
    },
    filters.keywords
  )
  if (keywordMatch) {
    const matchedFilter = filters.keywords.find(f => f.enabled)
    return {
      blocked: true,
      reason: `Blocked keyword: ${matchedFilter?.keyword}`,
      filterType: 'keyword',
      filterId: matchedFilter?.id || null,
    }
  }

  return {
    blocked: false,
    reason: null,
    filterType: null,
    filterId: null,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/unit/rules.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/rules.ts tests/unit/rules.test.ts
git commit -m "feat: add rule engine for content evaluation"
```

---

## Task 10: Content Script

**Files:**
- Create: `src/contents/bilibili.ts`

- [ ] **Step 1: Create content script**

Create `src/contents/bilibili.ts`:
```typescript
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
  document.head.appendChild(style)
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
  // Hide feed immediately
  hideFeed()

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve)
    })
  }

  // Process existing cards
  await processAllCards()

  // Watch for new cards
  setupMutationObserver()
}

// Start when script loads
init()
```

- [ ] **Step 2: Commit**

```bash
git add src/contents/bilibili.ts
git commit -m "feat: add main content script with filter pipeline"
```

---

## Task 11: Blur Overlay UI

**Files:**
- Create: `src/contents/ui/blur-overlay.ts`

- [ ] **Step 1: Create blur overlay**

Create `src/contents/ui/blur-overlay.ts`:
```typescript
import { BLOCK_STYLES } from '../../lib/constants'

export function applyBlockOverlay(element: HTMLElement, reason: string): void {
  // Skip if already blocked
  if (element.classList.contains('mbga-blocked')) return

  // Add blocked class
  element.classList.add('mbga-blocked')

  // Apply blur effect
  element.style.cssText = BLOCK_STYLES.BLUR_CSS

  // Create overlay
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

  // Create badge
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

  // Add click to reveal
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
```

- [ ] **Step 2: Commit**

```bash
git add src/contents/ui/blur-overlay.ts
git commit -m "feat: add blur overlay for blocked content"
```

---

## Task 12: Background Service Worker

**Files:**
- Create: `src/background/index.ts`

- [ ] **Step 1: Create background script**

Create `src/background/index.ts`:
```typescript
import { StorageManager } from '../lib/storage'

const storage = new StorageManager()

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PROFILE') {
    storage.getProfile().then(sendResponse)
    return true
  }

  if (message.type === 'GET_SETTINGS') {
    storage.getSettings().then(sendResponse)
    return true
  }

  if (message.type === 'INCREMENT_STATS') {
    storage.incrementStats(message.filterType).then(() => {
      sendResponse({ success: true })
    })
    return true
  }
})

// Initialize default data on install
chrome.runtime.onInstalled.addListener(async () => {
  const profile = await storage.getProfile()
  if (!profile) {
    // Storage will return defaults
    console.log('MBGA installed with default settings')
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/background/index.ts
git commit -m "feat: add background service worker"
```

---

## Task 13: Popup UI

**Files:**
- Create: `src/popup/index.tsx`
- Create: `src/popup/components/Toggle.tsx`
- Create: `src/popup/components/PauseButton.tsx`
- Create: `src/popup/components/Stats.tsx`

- [ ] **Step 1: Create Toggle component**

Create `src/popup/components/Toggle.tsx`:
```typescript
import React from 'react'

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-[#fb7299]' : 'bg-gray-300'
      }`}>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
```

- [ ] **Step 2: Create PauseButton component**

Create `src/popup/components/PauseButton.tsx`:
```typescript
import React from 'react'

interface PauseButtonProps {
  pauseUntil: number | null
  onPause: (minutes: number) => void
  onResume: () => void
}

export function PauseButton({ pauseUntil, onPause, onResume }: PauseButtonProps) {
  const isPaused = pauseUntil && Date.now() < pauseUntil

  if (isPaused) {
    const remaining = Math.ceil((pauseUntil - Date.now()) / 60000)
    return (
      <button
        onClick={onResume}
        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded">
        Resume ({remaining}m left)
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onPause(30)}
        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
        30m
      </button>
      <button
        onClick={() => onPause(60)}
        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
        1h
      </button>
      <button
        onClick={() => onPause(120)}
        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
        2h
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create Stats component**

Create `src/popup/components/Stats.tsx`:
```typescript
import React from 'react'

interface StatsProps {
  totalBlocked: number
  blockedToday: number
}

export function Stats({ totalBlocked, blockedToday }: StatsProps) {
  return (
    <div className="text-sm text-gray-600">
      <div>Blocked today: {blockedToday}</div>
      <div>Total blocked: {totalBlocked}</div>
    </div>
  )
}
```

- [ ] **Step 4: Create Popup entry**

Create `src/popup/index.tsx`:
```typescript
import React, { useState, useEffect } from 'react'
import { Toggle } from './components/Toggle'
import { PauseButton } from './components/PauseButton'
import { Stats } from './components/Stats'
import './style.css'

function IndexPopup() {
  const [enabled, setEnabled] = useState(true)
  const [pauseUntil, setPauseUntil] = useState<number | null>(null)
  const [stats, setStats] = useState({ totalBlocked: 0, blockedToday: 0 })

  useEffect(() => {
    // Load settings
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (settings) => {
      if (settings) {
        setEnabled(settings.enabled)
        setPauseUntil(settings.pauseUntil)
      }
    })

    // Load stats
    chrome.storage.local.get(['stats'], (result) => {
      if (result.stats) {
        setStats(result.stats)
      }
    })
  }, [])

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled)
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { enabled: newEnabled },
    })
  }

  const handlePause = (minutes: number) => {
    const until = Date.now() + minutes * 60000
    setPauseUntil(until)
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { pauseUntil: until },
    })
  }

  const handleResume = () => {
    setPauseUntil(null)
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { pauseUntil: null },
    })
  }

  return (
    <div className="w-80 p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-[#fb7299]">MBGA</h1>
        <Toggle enabled={enabled} onChange={handleToggle} />
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Pause filtering:</p>
        <PauseButton
          pauseUntil={pauseUntil}
          onPause={handlePause}
          onResume={handleResume}
        />
      </div>

      <div className="mb-4">
        <Stats {...stats} />
      </div>

      <a
        href="#"
        onClick={() => chrome.runtime.openOptionsPage()}
        className="text-sm text-[#fb7299] hover:underline">
        Open Settings →
      </a>
    </div>
  )
}

export default IndexPopup
```

- [ ] **Step 5: Create popup stylesheet**

Create `src/popup/style.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Commit**

```bash
git add src/popup/
git commit -m "feat: add popup UI with toggle, pause, and stats"
```

---

## Task 14: Options Page

**Files:**
- Create: `src/options/index.tsx`
- Create: `src/options/components/FilterManager.tsx`
- Create: `src/options/components/ImportExport.tsx`

- [ ] **Step 1: Create FilterManager component**

Create `src/options/components/FilterManager.tsx`:
```typescript
import React, { useState, useEffect } from 'react'
import type { TypeFilter, KeywordFilter, IDFilter } from '../../lib/types'

interface FilterManagerProps {
  typeFilters: TypeFilter[]
  keywordFilters: KeywordFilter[]
  idFilters: IDFilter[]
  onAddType: (type: string) => void
  onAddKeyword: (keyword: string, matchIn: string[]) => void
  onAddId: (targetId: string, type: string) => void
  onDelete: (filterType: string, filterId: string) => void
}

export function FilterManager({
  typeFilters,
  keywordFilters,
  idFilters,
  onAddType,
  onAddKeyword,
  onAddId,
  onDelete,
}: FilterManagerProps) {
  const [newKeyword, setNewKeyword] = useState('')
  const [newId, setNewId] = useState('')
  const [idType, setIdType] = useState<'video' | 'creator'>('creator')

  return (
    <div className="space-y-6">
      {/* Type Filters */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Content Type Filters</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {['live', 'course', 'bangumi', 'ad'].map(type => (
            <button
              key={type}
              onClick={() => onAddType(type)}
              className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
              Block {type}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {typeFilters.map(filter => (
            <div key={filter.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>{filter.type}</span>
              <button
                onClick={() => onDelete('type', filter.id)}
                className="text-red-500 text-sm">
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Keyword Filters */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Keyword Filters</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Enter keyword..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={() => {
              if (newKeyword) {
                onAddKeyword(newKeyword, ['title', 'author'])
                setNewKeyword('')
              }
            }}
            className="px-4 py-2 bg-[#fb7299] text-white rounded">
            Add
          </button>
        </div>
        <div className="space-y-2">
          {keywordFilters.map(filter => (
            <div key={filter.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>{filter.keyword}</span>
              <button
                onClick={() => onDelete('keyword', filter.id)}
                className="text-red-500 text-sm">
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ID Filters */}
      <div>
        <h3 className="text-lg font-semibold mb-3">ID Filters</h3>
        <div className="flex gap-2 mb-3">
          <select
            value={idType}
            onChange={(e) => setIdType(e.target.value as 'video' | 'creator')}
            className="px-3 py-2 border rounded">
            <option value="creator">Creator ID</option>
            <option value="video">Video BV</option>
          </select>
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="Enter ID..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={() => {
              if (newId) {
                onAddId(newId, idType)
                setNewId('')
              }
            }}
            className="px-4 py-2 bg-[#fb7299] text-white rounded">
            Add
          </button>
        </div>
        <div className="space-y-2">
          {idFilters.map(filter => (
            <div key={filter.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>{filter.type}: {filter.targetId}</span>
              <button
                onClick={() => onDelete('id', filter.id)}
                className="text-red-500 text-sm">
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ImportExport component**

Create `src/options/components/ImportExport.tsx`:
```typescript
import React, { useRef } from 'react'

interface ImportExportProps {
  onExport: () => Promise<string>
  onImport: (data: string) => Promise<void>
}

export function ImportExport({ onExport, onImport }: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    const data = await onExport()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mbga-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    try {
      await onImport(text)
      alert('Import successful!')
    } catch (err) {
      alert('Import failed: Invalid file format')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Export Data</h3>
        <p className="text-sm text-gray-600 mb-3">
          Download your filters and settings as a JSON file.
        </p>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-[#fb7299] text-white rounded">
          Export
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Import Data</h3>
        <p className="text-sm text-gray-600 mb-3">
          Import filters and settings from a JSON file.
        </p>
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
          Import
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create Options page entry**

Create `src/options/index.tsx`:
```typescript
import React, { useState, useEffect } from 'react'
import { FilterManager } from './components/FilterManager'
import { ImportExport } from './components/ImportExport'
import { StorageManager } from '../lib/storage'
import type { Profile } from '../lib/types'
import './style.css'

const storage = new StorageManager()

function OptionsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<'filters' | 'import-export'>('filters')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const p = await storage.getProfile()
    setProfile(p)
  }

  const handleAddType = async (type: string) => {
    await storage.addTypeFilter({ type: type as any, enabled: true })
    await loadProfile()
  }

  const handleAddKeyword = async (keyword: string, matchIn: string[]) => {
    await storage.addKeywordFilter({
      keyword,
      matchIn: matchIn as any,
      caseSensitive: false,
      enabled: true,
    })
    await loadProfile()
  }

  const handleAddId = async (targetId: string, type: string) => {
    await storage.addIDFilter({
      targetId,
      type: type as 'video' | 'creator',
      enabled: true,
    })
    await loadProfile()
  }

  const handleDelete = async (filterType: string, filterId: string) => {
    if (filterType === 'type') await storage.deleteTypeFilter(filterId)
    if (filterType === 'keyword') await storage.deleteKeywordFilter(filterId)
    if (filterType === 'id') await storage.deleteIDFilter(filterId)
    await loadProfile()
  }

  if (!profile) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-[#fb7299]">
            Make Bilibili Great Again
          </h1>
          <p className="text-gray-600 mt-1">Extension Settings</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('filters')}
            className={`px-4 py-2 rounded ${
              activeTab === 'filters'
                ? 'bg-[#fb7299] text-white'
                : 'bg-white'
            }`}>
            Filters
          </button>
          <button
            onClick={() => setActiveTab('import-export')}
            className={`px-4 py-2 rounded ${
              activeTab === 'import-export'
                ? 'bg-[#fb7299] text-white'
                : 'bg-white'
            }`}>
            Import/Export
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'filters' && (
            <FilterManager
              typeFilters={profile.filters.types}
              keywordFilters={profile.filters.keywords}
              idFilters={profile.filters.ids}
              onAddType={handleAddType}
              onAddKeyword={handleAddKeyword}
              onAddId={handleAddId}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'import-export' && (
            <ImportExport
              onExport={storage.exportData}
              onImport={storage.importData}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default OptionsPage
```

- [ ] **Step 4: Create options stylesheet**

Create `src/options/style.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Commit**

```bash
git add src/options/
git commit -m "feat: add options page with filter management and import/export"
```

---

## Task 15: Integration Test

**Files:**
- Create: `tests/e2e/bilibili.test.ts`

- [ ] **Step 1: Write E2E test**

Create `tests/e2e/bilibili.test.ts`:
```typescript
import { test, expect } from '@playwright/test'

test.describe('MBGA Extension', () => {
  test.beforeEach(async ({ page }) => {
    // Load Bilibili homepage
    await page.goto('https://www.bilibili.com')
    await page.waitForSelector('.bili-video-card')
  })

  test('should hide feed initially', async ({ page }) => {
    // Feed should be hidden on load
    const feed = await page.$('.bili-feed-card')
    const visibility = await feed?.evaluate(el =>
      window.getComputedStyle(el).visibility
    )
    expect(visibility).toBe('hidden')
  })

  test('should block live streams when type filter enabled', async ({ page }) => {
    // Enable live stream filter via storage
    await page.evaluate(() => {
      chrome.storage.local.set({
        profile: {
          id: 'test',
          name: 'Test',
          filters: {
            types: [{ id: '1', type: 'live', enabled: true }],
            keywords: [],
            ids: [],
          },
        },
      })
    })

    // Reload page
    await page.reload()
    await page.waitForSelector('.bili-video-card')

    // Check that live streams are blocked
    const liveLinks = await page.$$('a[href*="live.bilibili.com"]')
    for (const link of liveLinks) {
      const parent = await link.evaluateHandle(el => el.closest('.bili-video-card'))
      if (parent) {
        const hasOverlay = await parent.evaluate(el =>
          el.querySelector('.mbga-blocked-overlay') !== null
        )
        expect(hasOverlay).toBe(true)
      }
    }
  })

  test('should block keywords', async ({ page }) => {
    // Add keyword filter
    await page.evaluate(() => {
      chrome.storage.local.set({
        profile: {
          id: 'test',
          name: 'Test',
          filters: {
            types: [],
            keywords: [{ id: '1', keyword: '测试', matchIn: ['title'], caseSensitive: false, enabled: true }],
            ids: [],
          },
        },
      })
    })

    await page.reload()
    await page.waitForSelector('.bili-video-card')

    // Verify blocked content has overlay
    const cards = await page.$$('.bili-video-card.mbga-blocked')
    expect(cards.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/bilibili.test.ts
git commit -m "test: add E2E tests for extension functionality"
```

---

## Task 16: Final Build and Verification

- [ ] **Step 1: Run all unit tests**

```bash
npm run test:run
```

Expected: All tests pass

- [ ] **Step 2: Build extension**

```bash
npm run build
```

Expected: Build succeeds, extension files in `build/` directory

- [ ] **Step 3: Load extension in Chrome**

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `build/chrome-mv3-dev` folder

- [ ] **Step 4: Test on Bilibili**

1. Navigate to `https://www.bilibili.com`
2. Verify content is hidden initially
3. Add filters via popup/options
4. Verify blocked content shows overlay
5. Test import/export

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: MBGA v1.0.0 ready for release"
```

---

*Plan generated: 2026-06-07*
*Based on spec: docs/superpowers/specs/2026-06-07-mbga-design.md*
