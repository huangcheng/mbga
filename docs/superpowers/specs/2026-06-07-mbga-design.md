# Make Bilibili Great Again (MBGA) - Design Specification

## Overview

A cross-browser extension that filters and customizes the Bilibili experience, blocking unwanted content types, keywords, creators, and ads.

## Architecture

### Technology Stack
- **Framework:** Plasmo (cross-browser extension framework)
- **UI:** React + Tailwind CSS
- **Storage:** `@plasmohq/storage` (wraps chrome.storage)
- **State Management:** Zustand with persist middleware
- **Testing:** Vitest + Playwright (TDD approach)
- **Build:** Plasmo built-in bundler

### Manifest V3 Constraints

| Constraint | Impact | Solution |
|------------|--------|----------|
| Background service worker | Killed after 30s idle | Use `chrome.alarms` for periodic tasks (community list updates) |
| Content script messaging | No long-lived connections | Use one-shot `chrome.runtime.sendMessage` |
| Remote code execution | Cannot `eval()` or load remote JS | Filter list format must be parsed, not executed |
| Storage quotas | 10MB default limit | Request `unlimitedStorage` permission |

### Extension Structure
```
mbga/
├── src/
│   ├── background/          # Service worker
│   │   ├── index.ts         # Main background entry
│   │   └── filter-lists.ts  # Community filter list sync (Phase 3)
│   ├── contents/            # Content scripts
│   │   ├── bilibili.ts      # Main content script (document_start)
│   │   ├── filters/         # Filter implementations
│   │   │   ├── type-filter.ts
│   │   │   ├── keyword-filter.ts
│   │   │   ├── id-filter.ts
│   │   │   └── ad-filter.ts
│   │   └── ui/              # UI overlays
│   │       ├── blur-overlay.ts
│   │       └── quick-block.ts
│   ├── popup/               # Extension popup
│   │   ├── index.tsx
│   │   └── components/
│   ├── options/             # Full options page
│   │   ├── index.tsx
│   │   └── components/
│   ├── lib/                 # Shared libraries
│   │   ├── storage.ts       # Storage abstraction
│   │   ├── rules.ts         # Rule engine
│   │   └── types.ts         # TypeScript types
│   └── assets/              # Icons, images
├── tests/                   # Test files
│   ├── unit/
│   └── e2e/
└── docs/
    └── superpowers/
        └── specs/
```

### State Management Pattern

- **Storage → source of truth** (persists across extension restarts)
- **Zustand → cache layer** (hydrates from storage on init, writes through on mutation)
- Use Zustand's `persist` middleware with `@plasmohq/storage` as the storage engine

## Content Types & Detection

### Supported Content Types

| Type | URL Pattern | DOM Detection | Feed Location |
|------|-------------|---------------|---------------|
| **Video** | `bilibili.com/video/BV*` | `.bili-video-card.is-rcmd` | Main feed |
| **Live Stream** | `live.bilibili.com/*` | Link + "直播中" indicator | Mixed in feed |
| **Course/Lesson** | `bilibili.com/cheese/play/*` | Course card elements | Separate section |
| **Bangumi/Anime** | `bilibili.com/bangumi/play/*` | Bangumi card | Mixed in feed |
| **Article** | `bilibili.com/read/*` | Article card | Separate section |
| **Dynamic** | `t.bilibili.com/*` | Dynamic card | Separate feed |
| **Ad/Promotion** | `cm.bilibili.com/*` | `.bili-video-card__wrap` with ad markers | Mixed in feed |

### Detection Strategy

1. **URL-based** — Intercept links to identify content type before render
2. **DOM-based** — Scan for specific CSS classes and data attributes
3. **Hybrid** — Combine both for robust detection

### Video Card DOM Structure
```
.bili-video-card.is-rcmd
├── .bili-video-card__cover (thumbnail)
│   └── img[src] (cover image URL)
├── .bili-video-card__info
│   ├── .bili-video-card__info--title (video title)
│   ├── .bili-video-card__info--author (uploader name)
│   └── .bili-video-card__info--date (upload time)
└── .bili-video-card__stats
    ├── view count
    ├── danmaku count
    └── duration
```

### Content Flash Mitigation

Bilibili's feed loads cards via lazy XHR fetches. Cards may appear for 100-500ms before filters run. To prevent content flash:

1. **`document_start` injection** — Plasmo content script runs before DOM is ready
2. **Initial hide** — Hide feed container (`display: none`) on load
3. **Filter pass** — Run type/ID filters synchronously first
4. **Progressive reveal** — Unhide container after first filter pass completes
5. **Lazy filters** — Run keyword filters via `requestIdleCallback` for non-critical cards

## Filtering System

### Filter Types

#### 1. Type Filter
Block entire content types (lessons, live streams, etc.)

```typescript
interface TypeFilter {
  id: string;  // crypto.randomUUID()
  type: 'video' | 'live' | 'course' | 'bangumi' | 'article' | 'dynamic' | 'ad';
  enabled: boolean;
}
```

#### 2. Keyword Filter
Block content matching specific keywords in title, description, or tags.

```typescript
interface KeywordFilter {
  id: string;  // crypto.randomUUID()
  keyword: string;
  matchIn: ('title' | 'description' | 'tags' | 'author')[];
  caseSensitive: boolean;
  enabled: boolean;
}
```

#### 3. ID Filter
Block specific creators or content by ID.

```typescript
interface IDFilter {
  id: string;  // crypto.randomUUID()
  targetId: string;  // BV号, UP主ID, etc.
  type: 'video' | 'creator';
  enabled: boolean;
}
```

### Filter Execution Order
1. Type filter (fastest, URL-based) — early exit on match
2. ID filter (fast, lookup-based) — early exit on match
3. Keyword filter (medium, text matching) — early exit on match

**Why this order:** Each filter can short-circuit. If a type filter blocks it, don't check keywords.

### Blocked Content Display
- **Blur effect:** Apply CSS `filter: brightness(0) saturate(0)` (GPU-cheaper than blur)
- **Indicator:** Show "Blocked by MBGA" badge
- **Reveal:** Click to temporarily show content
- **Reason:** Display why content was blocked (e.g., "Keyword: 影视飓风")

## Profile System (v1: Single Profile)

### Profile Structure
```typescript
interface Profile {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  filters: {
    types: TypeFilter[];
    keywords: KeywordFilter[];
    ids: IDFilter[];
  };
  createdAt: number;
  updatedAt: number;
}
```

### v1 Scope
- Single profile ("My Filters")
- No multi-profile switching
- Import/export the single profile

### Future (Phase 3)
- Multiple profiles
- Profile switching via popup + keyboard shortcut
- Community list subscriptions per profile

## User Interface

### Popup (Quick Actions)
- Enable/disable extension
- Pause filtering (30min, 1hr, 2hr)
- Quick stats (items blocked today)
- Link to full options

### Options Page (Full Configuration)
- **Dashboard:** Overview of filtering activity
- **Filters:** Configure each filter type (types, keywords, IDs)
- **Import/Export:** Backup and restore data
- **About:** Version, links, support

### Visual Design
- Modern, clean UI inspired by Bilibili's design language
- Dark/light mode support
- Responsive layout
- Smooth animations

### Quick Block
- Right-click context menu on any video
- "Block this creator" option
- "Block this keyword" option
- Requires `contextMenus` permission

## Data Persistence

### Storage Schema
```typescript
interface StorageSchema {
  profile: Profile;  // Single profile for v1
  settings: {
    pauseUntil: number | null;
    showBlockedIndicator: boolean;
    enableQuickBlock: boolean;
    enabled: boolean;
  };
  stats: {
    totalBlocked: number;
    blockedToday: number;
    blockedByType: Record<string, number>;
  };
}
```

### Import/Export Format
```json
{
  "version": "1.0.0",
  "exportedAt": 1717728000000,
  "profile": {...},
  "settings": {...}
}
```

## Additional Features (v1)

### Ad/Promotion Blocking
- Hide sponsored banners
- Hide promoted videos (标记为"广告")
- Hide "活动" section if desired

### Focus Mode
- Temporarily pause all filters
- Configurable duration (30min, 1hr, 2hr, custom)
- Auto-resume after duration

### Statistics
- Track blocked items per day
- Top blocked keywords/creators
- Visual charts in options page
- **Privacy:** Stats are opt-in, rolled up daily, cleared on profile reset

## Failure Modes

| Failure | Behavior |
|---------|----------|
| Storage quota exceeded | Warn user, disable stats tracking |
| Community list unreachable | Use cached version, show warning |
| Content script loads before DOM | Wait for DOM ready via MutationObserver |
| Bilibili DOM structure changes | Log warning, disable affected filters |
| Filter execution error | **Fail open** — show content, don't block |

**Key principle:** Always fail open (show content) rather than fail closed (block everything).

## Testing Strategy (TDD)

### Unit Tests
- Filter logic (type, keyword, ID)
- Storage operations
- Profile management
- Rule engine

### Integration Tests
- Content script + filter pipeline
- Storage sync across contexts

### E2E Tests
- Full extension lifecycle
- Filter application on live Bilibili pages
- Import/export

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Plasmo project setup
- [ ] Storage layer with Zustand persist
- [ ] Basic content script (document_start)
- [ ] Type filter
- [ ] Content flash mitigation

### Phase 2: Basic Filters
- [ ] Keyword filter
- [ ] ID filter
- [ ] Blur overlay UI
- [ ] Popup UI
- [ ] Ad blocking

### Phase 3: Polish
- [ ] Quick block context menu
- [ ] Statistics
- [ ] Import/export
- [ ] Focus mode
- [ ] Options page

### Phase 4: Community Features
- [ ] Community filter lists
- [ ] Filter list format parsing
- [ ] Auto-update via chrome.alarms

### Phase 5: Advanced (Post-v1)
- [ ] AI cover analysis (with proper security)
- [ ] Danmaku filtering (WebSocket interception)
- [ ] Multi-profile system
- [ ] Mobile Bilibili support

## Success Metrics

- **Filter accuracy:** >95% of blocked content matches user intent
- **Performance:** <100ms filter execution per page load
- **Storage:** <10MB total storage usage
- **Battery:** Minimal impact on device battery

## Design Decisions

1. **Mobile support:** Phase 5 (post-v1). Mobile Bilibili (m.bilibili.com) has different DOM structure.
2. **SPA navigation:** Use MutationObserver to detect DOM changes. Bilibili uses pushState for navigation.
3. **AI analysis:** Deferred to Phase 5. Requires proper security (API key encryption), thumbnail proxying, and cost controls.
4. **Danmaku filtering:** Deferred to Phase 5. Requires WebSocket interception — fundamentally different tech.
5. **Filter list conflicts:** Block-dominant merge. If ANY source says "block", content is blocked. User filters always take priority.
6. **Profile system:** Single profile for v1. Multi-profile deferred to Phase 3.

---

*Design document generated: 2026-06-07*
*Status: Revised after oracle review*
