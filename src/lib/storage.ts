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
    return result.profile || JSON.parse(JSON.stringify(DEFAULT_PROFILE))
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
