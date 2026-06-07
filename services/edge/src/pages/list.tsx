import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/list', async (c) => {
  const db = c.env.DB
  
  // Get confirmed blacklist entries
  const entries = await db.prepare(
    'SELECT * FROM blacklist WHERE status = ? ORDER BY created_at DESC LIMIT 100'
  ).bind('confirmed').all()

  // Get stats
  const stats = await db.prepare(
    'SELECT COUNT(*) as total FROM blacklist WHERE status = ?'
  ).bind('confirmed').first()

  return c.html(html`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MBGA 公榜 - Make Bilibili Great Again</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, "PingFang SC", sans-serif; background: #f5f5f5; color: #333; }
        .container { max-width: 960px; margin: 0 auto; padding: 20px; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        .subtitle { color: #666; margin-bottom: 24px; }
        .stats { display: flex; gap: 20px; margin-bottom: 24px; }
        .stat { background: #fff; padding: 16px; border-radius: 8px; flex: 1; }
        .stat-value { font-size: 32px; font-weight: 700; color: #00a1d6; }
        .stat-label { font-size: 14px; color: #666; }
        .list { background: #fff; border-radius: 8px; overflow: hidden; }
        .item { padding: 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
        .item:last-child { border-bottom: none; }
        .item-info { flex: 1; }
        .item-id { font-family: monospace; font-size: 14px; color: #00a1d6; }
        .item-type { font-size: 12px; color: #999; margin-left: 8px; }
        .item-reasons { font-size: 13px; color: #666; margin-top: 4px; }
        .item-evidence { font-size: 12px; color: #999; margin-top: 4px; font-style: italic; }
        .item-date { font-size: 12px; color: #999; }
        .empty { padding: 40px; text-align: center; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>MBGA 公榜</h1>
        <p class="subtitle">Make Bilibili Great Again - 公开黑名单</p>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${stats?.total || 0}</div>
            <div class="stat-label">已确认条目</div>
          </div>
        </div>

        <div class="list">
          ${entries.results.length === 0 
            ? html`<div class="empty">暂无数据</div>`
            : entries.results.map((entry: any) => html`
              <div class="item">
                <div class="item-info">
                  <span class="item-id">${entry.target_id}</span>
                  <span class="item-type">${entry.type === 'creator' ? 'UP主' : '视频'}</span>
                  <div class="item-reasons">${JSON.parse(entry.reasons).join(', ')}</div>
                  ${entry.evidence_text ? html`<div class="item-evidence">"${entry.evidence_text.substring(0, 100)}..."</div>` : ''}
                </div>
                <div class="item-date">${new Date(entry.created_at).toLocaleDateString('zh-CN')}</div>
              </div>
            `)
          }
        </div>
      </div>
    </body>
    </html>
  `)
})

export default app
