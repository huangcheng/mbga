import type { D1Database } from '@cloudflare/workers-types'

export interface BlacklistEntry {
  id: string
  type: 'creator' | 'video'
  target_id: string
  reasons: string
  evidence_text: string | null
  reporters: string
  status: 'pending' | 'confirmed' | 'rejected'
  ai_confidence: number
  created_at: string
  updated_at: string
}

export interface WhitelistEntry {
  id: string
  type: string
  target_id: string
  reason: string | null
  added_by: string
  created_at: string
}

export interface Report {
  id: string
  type: string
  target_id: string
  reporter_id: string
  reason: string
  evidence_text: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export class Database {
  constructor(private db: D1Database) {}

  // Blacklist
  async getBlacklist(limit = 100, offset = 0): Promise<BlacklistEntry[]> {
    return this.db.prepare(
      'SELECT * FROM blacklist WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind('confirmed', limit, offset).all()
      .then(r => r.results as unknown as BlacklistEntry[])
  }

  async getBlacklistById(type: string, targetId: string): Promise<BlacklistEntry | null> {
    return this.db.prepare(
      'SELECT * FROM blacklist WHERE type = ? AND target_id = ?'
    ).bind(type, targetId).first() as Promise<BlacklistEntry | null>
  }

  async addToBlacklist(entry: Omit<BlacklistEntry, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    await this.db.prepare(
      'INSERT INTO blacklist (id, type, target_id, reasons, evidence_text, reporters, status, ai_confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      crypto.randomUUID(),
      entry.type,
      entry.target_id,
      entry.reasons,
      entry.evidence_text,
      entry.reporters,
      entry.status,
      entry.ai_confidence
    ).run()
  }

  async updateBlacklistStatus(id: string, status: string): Promise<void> {
    await this.db.prepare(
      'UPDATE blacklist SET status = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(status, id).run()
  }

  // Whitelist
  async getWhitelist(limit = 100, offset = 0): Promise<WhitelistEntry[]> {
    return this.db.prepare(
      'SELECT * FROM whitelist ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all()
      .then(r => r.results as unknown as WhitelistEntry[])
  }

  async isWhitelisted(type: string, targetId: string): Promise<boolean> {
    const entry = await this.db.prepare(
      'SELECT 1 FROM whitelist WHERE type = ? AND target_id = ?'
    ).bind(type, targetId).first()
    return !!entry
  }

  // Reports
  async getPendingReports(limit = 50): Promise<Report[]> {
    return this.db.prepare(
      'SELECT * FROM reports WHERE status = ? ORDER BY created_at ASC LIMIT ?'
    ).bind('pending', limit).all()
      .then(r => r.results as unknown as Report[])
  }

  async addReport(report: Omit<Report, 'id' | 'created_at'>): Promise<void> {
    await this.db.prepare(
      'INSERT INTO reports (id, type, target_id, reporter_id, reason, evidence_text, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      crypto.randomUUID(),
      report.type,
      report.target_id,
      report.reporter_id,
      report.reason,
      report.evidence_text,
      report.status
    ).run()
  }

  async updateReportStatus(id: string, status: string): Promise<void> {
    await this.db.prepare(
      'UPDATE reports SET status = ? WHERE id = ?'
    ).bind(status, id).run()
  }

  // Review log
  async addReviewLog(action: string, targetType: string, targetId: string, actor: string, reason?: string): Promise<void> {
    await this.db.prepare(
      'INSERT INTO review_log (id, action, target_type, target_id, actor, reason) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), action, targetType, targetId, actor, reason || null).run()
  }

  async getAuditLog(limit = 100): Promise<any[]> {
    return this.db.prepare(
      'SELECT * FROM review_log ORDER BY created_at DESC LIMIT ?'
    ).bind(limit).all()
      .then(r => r.results)
  }

  // Batch check
  async batchCheck(ids: string[]): Promise<Map<string, BlacklistEntry>> {
    const result = new Map<string, BlacklistEntry>()
    // Check each ID (could be optimized with IN clause)
    for (const id of ids) {
      const entry = await this.db.prepare(
        'SELECT * FROM blacklist WHERE target_id = ? AND status = ?'
      ).bind(id, 'confirmed').first() as BlacklistEntry | null
      if (entry) {
        result.set(id, entry)
      }
    }
    return result
  }

  // Stats
  async getStats(): Promise<{ total: number; confirmed: number; pending: number }> {
    const total = await this.db.prepare('SELECT COUNT(*) as count FROM blacklist').first()
    const confirmed = await this.db.prepare('SELECT COUNT(*) as count FROM blacklist WHERE status = ?').bind('confirmed').first()
    const pending = await this.db.prepare('SELECT COUNT(*) as count FROM blacklist WHERE status = ?').bind('pending').first()
    return {
      total: (total as any)?.count || 0,
      confirmed: (confirmed as any)?.count || 0,
      pending: (pending as any)?.count || 0,
    }
  }
}
