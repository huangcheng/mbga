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
  action TEXT NOT NULL,
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
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
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
CREATE INDEX IF NOT EXISTS idx_blacklist_status ON blacklist(status);
CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_review_log_target ON review_log(target_type, target_id);
