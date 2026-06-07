import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommunityListClient } from '../../src/lib/community'

// Mock chrome.storage
const mockStorage: Record<string, any> = {}
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string[]) => {
        const result: Record<string, any> = {}
        keys.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = JSON.parse(JSON.stringify(mockStorage[key]))
          }
        })
        return Promise.resolve(result)
      }),
      set: vi.fn((items: Record<string, any>) => {
        Object.assign(mockStorage, items)
        return Promise.resolve()
      }),
    },
  },
} as any

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('CommunityListClient', () => {
  let client: CommunityListClient

  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    mockFetch.mockReset()
    client = new CommunityListClient()
  })

  describe('init', () => {
    it('should load empty cache when no stored data exists', async () => {
      await client.init()
      expect(client.getBlacklistSize()).toBe(0)
      expect(client.getWhitelistSize()).toBe(0)
      expect(client.getLastSync()).toBe(0)
    })

    it('should load cached data from storage', async () => {
      mockStorage['mbga_community_cache'] = {
        blacklist: { '123': { target_id: '123', type: 'creator', reasons: '["spam"]', status: 'active' } },
        whitelist: ['456'],
        lastSync: Date.now() - 1000,
      }
      await client.init()
      expect(client.getBlacklistSize()).toBe(1)
      expect(client.getWhitelistSize()).toBe(1)
      expect(client.isBlocked('123')).toBeTruthy()
      expect(client.isWhitelisted('456')).toBe(true)
    })

    it('should sync when cache is stale', async () => {
      mockStorage['mbga_community_cache'] = {
        blacklist: {},
        whitelist: [],
        lastSync: 0,
      }
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ entries: [{ target_id: '789', type: 'video', reasons: '["spam"]', status: 'active' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ entries: [{ target_id: '101' }] }),
        })

      await client.init()

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(client.getBlacklistSize()).toBe(1)
      expect(client.getWhitelistSize()).toBe(1)
    })

    it('should not sync when cache is fresh', async () => {
      mockStorage['mbga_community_cache'] = {
        blacklist: {},
        whitelist: [],
        lastSync: Date.now(),
      }

      await client.init()

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('isBlocked', () => {
    it('should return null for non-blocked targets', async () => {
      await client.init()
      expect(client.isBlocked('unknown')).toBeNull()
    })

    it('should return entry for blocked targets after sync', async () => {
      // Simulate data that was synced (reasons already parsed)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          entries: [{ target_id: 'blocked-123', type: 'creator', reasons: '["spam","scam"]', evidence_text: 'test', status: 'active' }],
        }),
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] }),
      })

      await client.sync()
      const entry = client.isBlocked('blocked-123')
      expect(entry).not.toBeNull()
      expect(entry!.type).toBe('creator')
      expect(entry!.reasons).toEqual(['spam', 'scam'])
    })
  })

  describe('isWhitelisted', () => {
    it('should return false for non-whitelisted targets', async () => {
      await client.init()
      expect(client.isWhitelisted('unknown')).toBe(false)
    })

    it('should return true for whitelisted targets', async () => {
      mockStorage['mbga_community_cache'] = {
        blacklist: {},
        whitelist: ['safe-456'],
        lastSync: Date.now(),
      }
      await client.init()
      expect(client.isWhitelisted('safe-456')).toBe(true)
    })
  })

  describe('sync', () => {
    it('should fetch and cache blacklist entries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          entries: [
            { target_id: 'v1', type: 'video', reasons: '["spam"]', status: 'active' },
            { target_id: 'c1', type: 'creator', reasons: '["scam"]', status: 'active' },
          ],
        }),
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] }),
      })

      await client.sync()
      expect(client.getBlacklistSize()).toBe(2)
      expect(client.isBlocked('v1')).not.toBeNull()
      expect(client.isBlocked('c1')).not.toBeNull()
    })

    it('should handle fetch failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await client.sync()
      // Should not throw, cache remains unchanged
      expect(client.getBlacklistSize()).toBe(0)
    })

    it('should handle non-ok responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: false })

      await client.sync()
      // Should not throw
      expect(client.getBlacklistSize()).toBe(0)
    })
  })
})
