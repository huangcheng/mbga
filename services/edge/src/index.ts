import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Database } from './db'
import listApp from './pages/list'

type Bindings = {
  DB: D1Database
  ADMIN_TOKEN: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('*', cors())

// Public list page
app.route('/', listApp)

// Public API
app.get('/v1/blacklist', async (c) => {
  const db = new Database(c.env.DB)
  const limit = Number(c.req.query('limit') || '100')
  const offset = Number(c.req.query('offset') || '0')
  const entries = await db.getBlacklist(limit, offset)
  return c.json({ entries, count: entries.length })
})

app.get('/v1/whitelist', async (c) => {
  const db = new Database(c.env.DB)
  const limit = Number(c.req.query('limit') || '100')
  const offset = Number(c.req.query('offset') || '0')
  const entries = await db.getWhitelist(limit, offset)
  return c.json({ entries, count: entries.length })
})

app.get('/v1/check', async (c) => {
  const db = new Database(c.env.DB)
  const idsParam = c.req.query('ids')
  if (!idsParam) {
    return c.json({ error: 'ids parameter required' }, 400)
  }
  const ids = idsParam.split(',').slice(0, 100) // Max 100
  const results = await db.batchCheck(ids)
  const blocked: Record<string, any> = {}
  results.forEach((entry, id) => {
    blocked[id] = {
      type: entry.type,
      reasons: JSON.parse(entry.reasons),
      evidence_text: entry.evidence_text,
    }
  })
  return c.json({ blocked })
})

app.post('/v1/report', async (c) => {
  const db = new Database(c.env.DB)
  const body = await c.req.json()
  
  if (!body.type || !body.target_id || !body.reporter_id || !body.reason) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  await db.addReport({
    type: body.type,
    target_id: body.target_id,
    reporter_id: body.reporter_id,
    reason: body.reason,
    evidence_text: body.evidence_text || null,
    status: 'pending',
  })

  return c.json({ success: true })
})

app.get('/v1/stats', async (c) => {
  const db = new Database(c.env.DB)
  const stats = await db.getStats()
  return c.json(stats)
})

// Admin API (requires ADMIN_TOKEN)
const adminAuth = async (c: any, next: any) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (token !== c.env.ADMIN_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}

app.get('/admin/reports', adminAuth, async (c) => {
  const db = new Database(c.env.DB)
  const reports = await db.getPendingReports()
  return c.json({ reports })
})

app.post('/admin/approve', adminAuth, async (c) => {
  const db = new Database(c.env.DB)
  const { report_id, type, target_id, reasons, evidence_text } = await c.req.json()
  
  // Add to blacklist
  await db.addToBlacklist({
    type,
    target_id,
    reasons: JSON.stringify(reasons),
    evidence_text,
    reporters: '[]',
    status: 'confirmed',
    ai_confidence: 1.0,
  })
  
  // Update report status
  await db.updateReportStatus(report_id, 'approved')
  
  // Log action
  await db.addReviewLog('approve_report', type, target_id, 'admin')
  
  return c.json({ success: true })
})

app.post('/admin/reject', adminAuth, async (c) => {
  const db = new Database(c.env.DB)
  const { report_id, reason } = await c.req.json()
  
  await db.updateReportStatus(report_id, 'rejected')
  await db.addReviewLog('reject_report', '', report_id, 'admin', reason)
  
  return c.json({ success: true })
})

app.get('/admin/audit-log', adminAuth, async (c) => {
  const db = new Database(c.env.DB)
  const log = await db.getAuditLog()
  return c.json({ log })
})

// Cron handler for syncing data snapshots
export default {
  fetch: app.fetch,
  async scheduled(event: any, env: Bindings) {
    const db = new Database(env.DB)
    
    // Export blacklist to JSON
    const blacklist = await db.getBlacklist(10000)
    const whitelist = await db.getWhitelist(10000)
    
    // In production, these would be written to R2 or a public URL
    console.log(`Synced ${blacklist.length} blacklist entries, ${whitelist.length} whitelist entries`)
  },
}
