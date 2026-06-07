# MBGA Public Data

This directory contains public data snapshots from the MBGA community database.

## Files

- `blacklist/v1.json` - Confirmed blacklist entries
- `whitelist/v1.json` - Confirmed whitelist entries

## Schema

### Blacklist Entry
```json
{
  "id": "uuid",
  "type": "creator" | "video",
  "target_id": "UP主ID or BV号",
  "reasons": ["spam", "ad", "clickbait"],
  "evidence_text": "Trigger content",
  "reporters": 3,
  "confirmed_at": "2026-06-07T00:00:00Z"
}
```

### Whitelist Entry
```json
{
  "id": "uuid",
  "type": "creator" | "video",
  "target_id": "UP主ID or BV号",
  "reason": "Verified creator",
  "added_by": "maintainer",
  "created_at": "2026-06-07T00:00:00Z"
}
```

## Update Frequency

Snapshots are automatically synced from D1 every 6 hours via Cloudflare Worker cron.

## Audit Trail

The git history of this directory serves as a complete audit trail. Anyone can clone the repository and verify:
- When entries were added/removed
- Who added them (via commit messages)
- What evidence was provided

## Usage

These files can be consumed by:
- MBGA extension (syncs every 6 hours)
- Third-party tools
- Research purposes
