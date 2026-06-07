const API_BASE = 'https://mbga-edge.your-subdomain.workers.dev' // TODO: Configure

interface BlacklistEntry {
  id: string
  type: 'creator' | 'video'
  target_id: string
  reasons: string[]
  evidence_text: string | null
  status: string
}

interface CommunityCache {
  blacklist: Map<string, BlacklistEntry>
  whitelist: Set<string>
  lastSync: number
}

const CACHE_KEY = 'mbga_community_cache'
const SYNC_INTERVAL = 6 * 60 * 60 * 1000 // 6 hours

export class CommunityListClient {
  private cache: CommunityCache = {
    blacklist: new Map(),
    whitelist: new Set(),
    lastSync: 0,
  }

  async init(): Promise<void> {
    await this.loadCache()
    if (this.shouldSync()) {
      await this.sync()
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([CACHE_KEY])
      if (result[CACHE_KEY]) {
        const data = result[CACHE_KEY]
        this.cache = {
          blacklist: new Map(Object.entries(data.blacklist || {})),
          whitelist: new Set(data.whitelist || []),
          lastSync: data.lastSync || 0,
        }
      }
    } catch (e) {
      console.warn('[MBGA] Failed to load community cache:', e)
    }
  }

  private async saveCache(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [CACHE_KEY]: {
          blacklist: Object.fromEntries(this.cache.blacklist),
          whitelist: Array.from(this.cache.whitelist),
          lastSync: this.cache.lastSync,
        },
      })
    } catch (e) {
      console.warn('[MBGA] Failed to save community cache:', e)
    }
  }

  private shouldSync(): boolean {
    return Date.now() - this.cache.lastSync > SYNC_INTERVAL
  }

  async sync(): Promise<void> {
    try {
      // Fetch blacklist
      const blacklistRes = await fetch(`${API_BASE}/v1/blacklist?limit=10000`)
      if (blacklistRes.ok) {
        const data = await blacklistRes.json()
        this.cache.blacklist.clear()
        for (const entry of data.entries) {
          this.cache.blacklist.set(entry.target_id, {
            ...entry,
            reasons: JSON.parse(entry.reasons),
          })
        }
      }

      // Fetch whitelist
      const whitelistRes = await fetch(`${API_BASE}/v1/whitelist?limit=10000`)
      if (whitelistRes.ok) {
        const data = await whitelistRes.json()
        this.cache.whitelist.clear()
        for (const entry of data.entries) {
          this.cache.whitelist.add(entry.target_id)
        }
      }

      this.cache.lastSync = Date.now()
      await this.saveCache()
      console.log(`[MBGA] Synced ${this.cache.blacklist.size} blacklist entries`)
    } catch (e) {
      console.warn('[MBGA] Failed to sync community lists:', e)
    }
  }

  isBlocked(targetId: string): BlacklistEntry | null {
    return this.cache.blacklist.get(targetId) || null
  }

  isWhitelisted(targetId: string): boolean {
    return this.cache.whitelist.has(targetId)
  }

  getBlacklistSize(): number {
    return this.cache.blacklist.size
  }

  getWhitelistSize(): number {
    return this.cache.whitelist.size
  }

  getLastSync(): number {
    return this.cache.lastSync
  }
}
