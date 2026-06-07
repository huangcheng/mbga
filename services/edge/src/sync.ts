import type { D1Database } from '@cloudflare/workers-types'

interface SyncResult {
  blacklist_count: number
  whitelist_count: number
  synced_at: string
}

export async function syncDataSnapshots(db: D1Database): Promise<SyncResult> {
  // Fetch confirmed blacklist entries
  const blacklist = await db.prepare(
    'SELECT id, type, target_id, reasons, evidence_text, reporters, created_at FROM blacklist WHERE status = ? ORDER BY created_at DESC'
  ).bind('confirmed').all()

  // Fetch whitelist entries
  const whitelist = await db.prepare(
    'SELECT id, type, target_id, reason, added_by, created_at FROM whitelist ORDER BY created_at DESC'
  ).all()

  const now = new Date().toISOString()

  // Format blacklist for public consumption
  const blacklistData = {
    version: '1.0.0',
    updated_at: now,
    entries: blacklist.results.map((entry: any) => ({
      id: entry.id,
      type: entry.type,
      target_id: entry.target_id,
      reasons: JSON.parse(entry.reasons),
      evidence_text: entry.evidence_text,
      reporters: JSON.parse(entry.reporters).length,
      confirmed_at: entry.created_at,
    })),
  }

  // Format whitelist for public consumption
  const whitelistData = {
    version: '1.0.0',
    updated_at: now,
    entries: whitelist.results.map((entry: any) => ({
      id: entry.id,
      type: entry.type,
      target_id: entry.target_id,
      reason: entry.reason,
      added_by: entry.added_by,
      created_at: entry.created_at,
    })),
  }

  // In production, these would be written to R2 or a public URL
  // For now, return the data for logging
  return {
    blacklist_count: blacklistData.entries.length,
    whitelist_count: whitelistData.entries.length,
    synced_at: now,
  }
}
