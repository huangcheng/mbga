import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageManager } from '../../src/lib/storage'

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
