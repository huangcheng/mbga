# MBGA Community Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement community-driven filtering with public blacklists, evidence-based blocking, admin review queue, and GitHub OAuth for contributions.

**Architecture:** Cloudflare Worker (Hono) + D1 database for backend, Chrome extension for frontend, GitHub Device Flow for auth.

**Tech Stack:** Hono, Cloudflare D1, Cloudflare Workers, GitHub OAuth, TypeScript

---

## File Structure

```
mbga/
├── services/
│   └── edge/
│       ├── src/
│       │   ├── index.ts              # Hono API server
│       │   ├── db.ts                 # D1 database operations
│       │   ├── auth.ts               # GitHub Device Flow OAuth
│       │   ├── routes/
│       │   │   ├── blacklist.ts      # /v1/blacklist endpoints
│       │   │   ├── whitelist.ts      # /v1/whitelist endpoints
│       │   │   ├── check.ts          # /v1/check batch query
│       │   │   ├── report.ts         # /v1/report community reports
│       │   │   └── admin.ts          # /admin review queue
│       │   └── pages/
│       │       ├── list.tsx          # Public list page
│       │       └── admin.tsx         # Admin review page
│       ├── schema.sql                # D1 database schema
│       ├── wrangler.toml             # Cloudflare config
│       └── package.json
├── data/
│   ├── blacklist/
│   │   └── v1.json                   # Public blacklist snapshot
│   ├── whitelist/
│   │   └── v1.json                   # Public whitelist snapshot
│   └── README.md                     # Schema documentation
├── src/
│   └── lib/
│       ├── community.ts              # Community list client
│       ├── evidence.ts               # Evidence collection
│       └── github-auth.ts            # GitHub OAuth client
└── extension/
    └── src/
        └── contents/
            └── ui/
                └── report-button.tsx  # Report spam button
```

---

## Task 1: Database Schema

**Files:**
- Create: `services/edge/schema.sql`

**Schema:**

```sql
-- Blacklist entries
CREATE TABLE IF NOT EXISTS blacklist (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'creator' or 'video'
  target_id TEXT NOT NULL, -- UP主 ID or BV号
  reasons TEXT NOT NULL, -- JSON array of reasons
  evidence_text TEXT, -- Trigger content
  reporters TEXT NOT NULL DEFAULT '[]', -- JSON array of reporter IDs
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  ai_confidence REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(type, target_id)
);

-- Whitelist entries
CREATE TABLE IF NOT EXISTS whitelist (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  added_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(type, target_id)
);

-- Review log (audit trail)
CREATE TABLE IF NOT EXISTS review_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL, -- 'add_blacklist', 'remove_blacklist', 'add_whitelist', etc.
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Community reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL, -- GitHub user ID
  reason TEXT NOT NULL,
  evidence_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- GitHub users
CREATE TABLE IF NOT EXISTS users (
  github_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login TEXT
);

-- Indexes
CREATE INDEX idx_blacklist_status ON blacklist(status);
CREATE INDEX idx_blacklist_type ON blacklist(type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_review_log_target ON review_log(target_type, target_id);
```

**Commit:** `feat(db): add D1 database schema for community features`

---

## Task 2: Cloudflare Worker API

**Files:**
- Create: `services/edge/src/index.ts`
- Create: `services/edge/src/db.ts`
- Create: `services/edge/wrangler.toml`
- Create: `services/edge/package.json`

**API Endpoints:**

```
GET  /v1/blacklist           - Get public blacklist
GET  /v1/whitelist           - Get public whitelist
GET  /v1/check?ids=...       - Batch check IDs
POST /v1/report              - Submit community report
GET  /v1/stats               - Public statistics

# Admin (requires ADMIN_TOKEN)
GET  /admin/reports          - Pending reports
POST /admin/approve          - Approve report
POST /admin/reject           - Reject report
GET  /admin/audit-log        - Review history
```

**Commit:** `feat(api): add Cloudflare Worker API for community features`

---

## Task 3: Community List Client

**Files:**
- Create: `src/lib/community.ts`

**Features:**
- Fetch blacklist/whitelist from API
- Local cache with 6-hour sync
- Incremental updates (only fetch changes since last sync)
- Offline fallback

**Commit:** `feat(lib): add community list client with local cache`

---

## Task 4: Evidence Collection

**Files:**
- Create: `src/lib/evidence.ts`

**Features:**
- Collect evidence when blocking content
- Store: video title, author, URL, timestamp, screenshot (optional)
- Format for API submission

**Commit:** `feat(lib): add evidence collection for community reports`

---

## Task 5: Report Button UI

**Files:**
- Create: `src/contents/ui/report-button.tsx`

**Features:**
- Add "举报垃圾内容" to quick block menu
- Collect evidence automatically
- Submit to API with GitHub auth token
- Show success/error feedback

**Commit:** `feat(ui): add community report button to quick block menu`

---

## Task 6: GitHub Device Flow OAuth

**Files:**
- Create: `src/lib/github-auth.ts`
- Create: `services/edge/src/auth.ts`

**Flow:**
1. User clicks "登录 GitHub" in extension
2. Extension requests device code from GitHub
3. User authorizes on github.com
4. Extension polls for access token
5. Store token securely

**Commit:** `feat(auth): add GitHub Device Flow OAuth for community contributions`

---

## Task 7: Admin Review Queue

**Files:**
- Create: `services/edge/src/routes/admin.ts`
- Create: `services/edge/src/pages/admin.tsx`

**Features:**
- Protected by ADMIN_TOKEN
- Pending reports queue
- Approve/reject with reason
- Audit log viewer
- Blacklist/whitelist management

**Commit:** `feat(admin): add review queue and audit log`

---

## Task 8: Public List Page

**Files:**
- Create: `services/edge/src/pages/list.tsx`

**Features:**
- Browse confirmed blacklist entries
- Search by ID or reason
- Show evidence and reporter count
- Real-time updates

**Commit:** `feat(web): add public blacklist list page`

---

## Task 9: Extension Integration

**Files:**
- Modify: `src/contents/bilibili.ts`
- Modify: `src/contents/ui/quick-block.ts`
- Modify: `src/options/index.tsx`

**Features:**
- Check community lists before blocking
- Show community-sourced badge on blocked items
- Sync community lists every 6 hours
- Report button in quick block menu

**Commit:** `feat(extension): integrate community lists and reporting`

---

## Task 10: Data Snapshots

**Files:**
- Create: `data/blacklist/v1.json`
- Create: `data/whitelist/v1.json`
- Create: `data/README.md`

**Features:**
- Auto-sync from D1 every 6 hours
- Git history = audit trail
- Public API for direct access

**Commit:** `feat(data): add public data snapshots with auto-sync`

---

## Implementation Order

1. **Task 1: Database Schema** - Foundation
2. **Task 2: Cloudflare Worker API** - Backend
3. **Task 3: Community List Client** - Extension integration
4. **Task 4: Evidence Collection** - Data collection
5. **Task 5: Report Button UI** - User interface
6. **Task 6: GitHub OAuth** - Authentication
7. **Task 7: Admin Review Queue** - Moderation
8. **Task 8: Public List Page** - Transparency
9. **Task 9: Extension Integration** - Connect everything
10. **Task 10: Data Snapshots** - Public data

---

*Plan created: 2026-06-07*
*Based on: foru17/make-x-great-again architecture*
