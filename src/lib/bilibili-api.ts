import { StorageManager } from './storage'

interface BilibiliBlacklistItem {
  mid: number  // user ID
  uname: string  // username
  face: string  // avatar URL
}

interface BilibiliBlacklistResponse {
  code: number
  message: string
  data: {
    list: BilibiliBlacklistItem[]
    total: number
  }
}

/**
 * Fetch the user's blacklist from Bilibili API
 * Uses the user's existing cookies (no auth needed if logged in)
 */
export async function fetchBilibiliBlacklist(): Promise<BilibiliBlacklistItem[]> {
  const allItems: BilibiliBlacklistItem[] = []
  let page = 1
  const pageSize = 20

  while (true) {
    const url = `https://api.bilibili.com/x/relation/blacks?re_version=0&pn=${page}&ps=${pageSize}&jsonp=jsonp`
    
    const response = await fetch(url, {
      credentials: 'include',  // Include cookies
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    const data: BilibiliBlacklistResponse = await response.json()

    if (data.code !== 0) {
      throw new Error(`Bilibili API error: ${data.message}`)
    }

    if (!data.data.list || data.data.list.length === 0) {
      break
    }

    allItems.push(...data.data.list)

    // Check if we've fetched all items
    if (allItems.length >= data.data.total) {
      break
    }

    page++
  }

  return allItems
}

/**
 * Import Bilibili blacklist into extension storage
 */
export async function importBilibiliBlacklist(): Promise<{ imported: number; total: number }> {
  const storage = new StorageManager()
  
  // Fetch blacklist from Bilibili
  const blacklist = await fetchBilibiliBlacklist()
  
  // Get current profile
  const profile = await storage.getProfile()
  
  // Get existing creator IDs to avoid duplicates
  const existingIds = new Set(
    profile.filters.ids
      .filter(f => f.type === 'creator')
      .map(f => f.targetId)
  )
  
  // Add new creator IDs
  let imported = 0
  for (const item of blacklist) {
    if (!existingIds.has(String(item.mid))) {
      await storage.addIDFilter({
        targetId: String(item.mid),
        type: 'creator',
        enabled: true
      })
      existingIds.add(String(item.mid))
      imported++
    }
  }

  return {
    imported,
    total: blacklist.length
  }
}
