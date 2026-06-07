# MBGA Community Features - Simplified Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Community-driven filtering with a single public blacklist, evidence-based blocking, and admin review.

**Architecture:** Single Cloudflare Worker + D1 for backend. Extension syncs from one public API endpoint.

**Key Simplification:** No subscription lists. One public blacklist, one sync endpoint.

---

## What Changed (Audit)

### Dropped
- ❌ URL-based subscription lists (like AdGuard/Adblock)
- ❌ Multiple community list sources
- ❌ Subscription management UI
- ❌ List format parsing (no custom filter list format)

### Kept
- ✅ Public blacklist API (`/v1/blacklist`)
- ✅ Public whitelist API (`/v1/whitelist`)
- ✅ Batch check API (`/v1/check?ids=...`)
- ✅ Community reports (`/v1/report`)
- ✅ Admin review queue (`/admin/reports`)
- ✅ Public list page (`/list`)
- ✅ Evidence-based blocking
- ✅ GitHub OAuth for reporting
- ✅ 6-hour sync from single source

---

## Simplified Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   MBGA Extension │────▶│  Cloudflare API  │────▶│    D1 Database  │
│   (6h sync)      │     │  (single source) │     │   (blacklist)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │  /list page  │
                        │  (public)    │
                        └──────────────┘
```

**Extension syncs from ONE endpoint:**
```
GET https://mbga-edge.workers.dev/v1/blacklist?limit=10000
```

No subscription URLs, no list format parsing, no multiple sources.

---

## File Structure (Simplified)

```
mbga/
├── services/
│   └── edge/
│       ├── src/
│       │   ├── index.ts          # Hono API
│       │   ├── db.ts             # D1 operations
│       │   └── pages/
│       │       └── list.tsx      # Public list page
│       ├── schema.sql
│       ├── wrangler.toml
│       └── package.json
├── src/
│   └── lib/
│       ├── community.ts          # Single-source sync client
│       ├── evidence.ts           # Evidence collection
│       └── github-auth.ts        # GitHub OAuth
└── extension/
    └── src/
        └── contents/
            └── ui/
                └── report-button.tsx
```

---

## Implementation Tasks

### Task 1: Database Schema
Create `services/edge/schema.sql` with:
- `blacklist` table (id, type, target_id, reasons, evidence_text, reporters, status)
- `whitelist` table (id, type, target_id, reason, added_by)
- `reports` table (community reports)
- `review_log` table (audit trail)

### Task 2: Cloudflare Worker API
Create `services/edge/src/index.ts` with:
- `GET /v1/blacklist` - Public blacklist (paginated)
- `GET /v1/whitelist` - Public whitelist
- `GET /v1/check?ids=...` - Batch check 100 IDs
- `POST /v1/report` - Submit report
- `GET /v1/stats` - Statistics
- `GET /list` - Public list page (SSR)
- Admin endpoints (protected)

### Task 3: Community Client (Simplified)
Create `src/lib/community.ts`:
- Sync from single endpoint: `/v1/blacklist`
- Local cache in `chrome.storage.local`
- 6-hour sync via `chrome.alarms`
- No subscription management

### Task 4: Evidence Collection
Create `src/lib/evidence.ts`:
- Collect title, author, URL, thumbnail from card
- Format for API submission

### Task 5: Report Button
Create `src/contents/ui/report-button.tsx`:
- Add "举报垃圾内容" to quick block menu
- Submit to `/v1/report` with evidence

### Task 6: GitHub OAuth
Create `src/lib/github-auth.ts`:
- Device Flow for community contributions
- Store token in `chrome.storage.local`

### Task 7: Admin Review
Create admin endpoints and page:
- `/admin/reports` - Pending reports
- `/admin/approve` - Add to blacklist
- `/admin/reject` - Reject report
- `/admin/audit-log` - Review history

### Task 8: Public List Page
Create `services/edge/src/pages/list.tsx`:
- Browse confirmed blacklist entries
- Show evidence and reporter count
- Search by ID or reason

### Task 9: Extension Integration
Update extension to:
- Sync from single public API
- Check blacklist before blocking
- Show community-sourced badge
- Report button in quick block menu

### Task 10: Data Snapshots
Create `data/blacklist/v1.json`:
- Auto-sync from D1 every 6 hours
- Git history = audit trail

---

## Key Simplifications

1. **Single sync endpoint** - No list format parsing
2. **No subscription UI** - One public source
3. **No list management** - Just sync and use
4. **Simpler cache** - One cache, one source

---

*Plan simplified: 2026-06-07*
*Dropped: Subscription lists, URL parsing, multiple sources*
*Kept: Public API, public list page, community reports*
