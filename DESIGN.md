# Design System: Make Bilibili Great Again (MBGA)

## 1. Visual Theme & Atmosphere

**Vibe Archetype:** Soft Structuralism — Clean white backgrounds with warm undertones. Airy, floating components with incredibly soft ambient shadows. The feeling of a well-organized Japanese stationery shop.

**Density:** 4/10 — Breathing room is sacred. Every element has space to exist.
**Variance:** 3/10 — Predictable, symmetric. This is a tool that respects your focus.
**Motion:** 3/10 — Subtle, purposeful. Only what serves function.

The extension should feel like it belongs in Bilibili — not fighting it, not copying it, but complementing it. Warm, approachable, slightly playful through typography and spacing, never clinical.

## 2. Color Palette & Roles

### Light Mode
- **Warm Canvas** (#FBF9F6) — Primary background, slightly warm white
- **Pure Surface** (#FFFFFF) — Card fills, elevated surfaces
- **Soft Charcoal** (#2D2D2D) — Primary text, never pure black
- **Warm Gray** (#8B8680) — Secondary text, metadata, descriptions
- **Hairline** (#EBE8E4) — Borders, dividers, subtle structure
- **Bilibili Rose** (#F07A9B) — Accent, muted from brand pink. Used sparingly.
- **Rose Whisper** (#FDF2F5) — Hover states, selected backgrounds
- **Sage Success** (#7BAE7F) — Enabled states, confirmations
- **Amber Pause** (#D4A853) — Paused state, timers
- **Soft Red** (#D4645C) — Delete, errors. Never harsh.

### Dark Mode
- **Deep Canvas** (#1A1918) — Warm dark, not blue-gray
- **Surface Dark** (#242322) — Elevated surfaces
- **Warm White** (#F5F2EE) — Primary text
- **Muted Warm** (#9C9590) — Secondary text
- **Border Dark** (#333230) — Structure
- **Bilibili Rose** (#F07A9B) — Same accent, works on dark

**Palette Philosophy:**
Colors are warm, slightly desaturated. Nothing screams. The accent is used like a spice — noticeable when present, not overwhelming. Think of a well-designed book cover, not a dashboard.

## 3. Typography Rules

- **Display:** Plus Jakarta Sans — Bold, slightly rounded, friendly authority
- **Body:** Plus Jakarta Sans — Regular, comfortable reading
- **Mono:** JetBrains Mono — For BV IDs, technical values
- **Scale:** 11px / 13px / 15px / 18px / 22px — Refined, not aggressive
- **Line height:** 1.6 for body, 1.2 for headings
- **Letter spacing:** -0.01em for headings (subtle tightness), normal for body

**Why Plus Jakarta Sans:**
It has personality without being quirky. The slightly rounded terminals feel warm and approachable — perfect for a tool that's meant to improve your experience, not lecture you. It's distinctive without being distracting.

## 4. Component Stylings

### Cards — "The Soft Float"
```
Outer Shell:
  - Background: transparent or subtle (#FBF9F6)
  - Padding: 4px (the "tray")
  - Border radius: 20px

Inner Core:
  - Background: #FFFFFF
  - Border radius: 16px (calculated: 20px - 4px)
  - Shadow: 0 2px 8px rgba(45, 45, 45, 0.04), 0 0 0 1px rgba(235, 232, 228, 0.5)
  - Inner highlight: inset 0 1px 0 rgba(255, 255, 255, 0.8)
```

Cards feel like they're gently floating above the surface. The double-bezel creates depth without heaviness.

### Buttons

**Primary:**
```
- Background: #F07A9B (Bilibili Rose)
- Text: #FFFFFF
- Border radius: 12px
- Padding: 10px 20px
- Shadow: 0 1px 2px rgba(240, 122, 155, 0.2)
- Hover: darken by 5%, shadow expands slightly
- Active: scale(0.98), shadow compresses
```

**Secondary (Ghost):**
```
- Background: transparent
- Text: #2D2D2D
- Border: 1px solid #EBE8E4
- Hover: background #FBF9F6, border softens
- Active: scale(0.98)
```

**Danger:**
```
- Background: #D4645C
- Text: #FFFFFF
- Hover: darken slightly
- Requires confirmation (double-click or confirm dialog)
```

### Toggle Switch
```
Track:
  - Off: #EBE8E4 (hairline)
  - On: #F07A9B at 30% opacity with rose tint
  - Size: 44px × 24px
  - Border radius: 12px (pill)

Knob:
  - Background: #FFFFFF
  - Size: 18px
  - Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
  - Position: 3px from edge
  - Transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1)
```

### Input Fields
```
Container:
  - Label: 13px, #8B8680, above input
  - Gap: 6px between label and input

Input:
  - Background: #FFFFFF
  - Border: 1px solid #EBE8E4
  - Border radius: 10px
  - Padding: 10px 14px
  - Height: 40px
  - Focus: border-color #F07A9B, ring 3px rgba(240, 122, 155, 0.1)
  - Placeholder: #B5B0AA

Error state:
  - Border: #D4645C
  - Helper text: 12px, #D4645C, below input
```

### Filter Tags
```
- Background: #F07A9B at 8% opacity
- Text: #F07A9B
- Border radius: 8px
- Padding: 6px 12px
- Delete icon: 14px, #8B8680, hover #D4645C
- Transition: all 200ms cubic-bezier(0.32, 0.72, 0, 1)
```

### Blocked Content Overlay
```
Effect: filter: brightness(0.1) saturate(0) (not blur — cheaper)
Overlay: 
  - Background: rgba(45, 45, 45, 0.85)
  - Backdrop: blur(4px) only on the overlay, not the card
Badge:
  - Background: #F07A9B
  - Text: #FFFFFF, 13px
  - Border radius: 8px
  - Padding: 8px 16px
  - Shadow: 0 2px 8px rgba(240, 122, 155, 0.3)
```

## 5. Layout Principles

### Popup (340px width, natural height)
```
┌─────────────────────────────────┐
│                                 │
│   MBGA                 ○─────── │  ← Toggle
│                                 │
│   ───────────────────────────── │  ← Hairline divider
│                                 │
│   Pause filtering               │
│   ┌─────┐ ┌─────┐ ┌─────┐     │
│   │ 30m │ │  1h │ │  2h │     │  ← Pill buttons
│   └─────┘ └─────┘ └─────┘     │
│                                 │
│   ───────────────────────────── │
│                                 │
│   Blocked today        42      │
│   Total blocked     1,234      │
│                                 │
│   ───────────────────────────── │
│                                 │
│   Open Settings →               │  ← Subtle link
│                                 │
└─────────────────────────────────┘
```

Spacing: 20px padding, 16px between sections, 12px between related items.

### Options Page (max-width: 880px, centered)
```
┌────────────────────────────────────────────────────┐
│                                                    │
│   Make Bilibili Great Again                        │
│   Extension Settings                               │
│                                                    │
│   ┌──────────────────────────────────────────────┐ │
│   │  [Filters]    [Import/Export]                 │ │  ← Tab bar
│   └──────────────────────────────────────────────┘ │
│                                                    │
│   ┌──────────────────────────────────────────────┐ │
│   │                                              │ │
│   │   Content Types                              │ │
│   │   ┌────────┐ ┌──────────┐ ┌────────┐       │ │
│   │   │ Live ✓ │ │ Course ✓ │ │  Ad ✓  │       │ │  ← Toggle chips
│   │   └────────┘ └──────────┘ └────────┘       │ │
│   │                                              │ │
│   │   ─────────────────────────────────────────  │ │
│   │                                              │ │
│   │   Keywords                                   │ │
│   │   ┌────────────────────────────┐ ┌───────┐  │ │
│   │   │ Enter keyword...           │ │  Add  │  │ │
│   │   └────────────────────────────┘ └───────┘  │ │
│   │                                              │ │
│   │   ┌──────────────────────────────────────┐   │ │
│   │   │ 影视飓风                          ✕  │   │ │  ← Filter items
│   │   └──────────────────────────────────────┘   │ │
│   │   ┌──────────────────────────────────────┐   │ │
│   │   │ 某UP主                            ✕  │   │ │
│   │   └──────────────────────────────────────┘   │ │
│   │                                              │ │
│   │   ─────────────────────────────────────────  │ │
│   │                                              │ │
│   │   Creator IDs                                │ │
│   │   ┌────────┐ ┌────────────────────┐ ┌─────┐ │ │
│   │   │Creator ▼│ │ Enter ID...        │ │ Add │ │ │
│   │   └────────┘ └────────────────────┘ └─────┘ │ │
│   │                                              │ │
│   └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

Spacing: 40px top/bottom padding, 24px between sections, 16px between items.

### Grid & Responsiveness
- **Popup:** Fixed width, scrollable if needed
- **Options:** Single column, max-width 880px, centered with 24px side padding
- **Mobile:** Full width, 16px padding, larger touch targets (48px minimum)
- **No horizontal scroll anywhere**

## 6. Motion & Interaction Philosophy

### Transition Curves
All transitions use `cubic-bezier(0.32, 0.72, 0, 1)` — a custom ease-out that feels natural and responsive. No linear, no default ease-in-out.

### Micro-interactions

**Toggle:**
- Knob slides with spring physics (the cubic-bezier above)
- Track color transitions simultaneously
- Subtle scale bounce at end: 1.0 → 1.05 → 1.0 over 300ms

**Button Press:**
- Active state: `scale(0.98)` over 100ms
- Shadow compresses simultaneously
- Release: spring back over 200ms

**Filter Added:**
- Item fades in from `opacity: 0, translateY: 8px`
- Duration: 300ms with stagger if multiple
- Background flashes rose-whisper briefly

**Filter Removed:**
- Slides out to right: `translateX: 20px, opacity: 0`
- Duration: 200ms
- Height collapses after removal

**Card Hover:**
- Border color transitions to slightly warmer
- Shadow expands subtly
- Duration: 200ms

**Stats Update:**
- Numbers count up from previous value
- Duration: 400ms
- Easing: same cubic-bezier

### No Decorative Motion
- No bouncing
- No infinite animations
- No loading spinners (use skeleton if needed)
- No entrance animations on page load (respect user's time)

## 7. Iconography

**Style:** Phosphor Light or Remix Line — ultra-thin, precise strokes
**Size:** 16px inline, 18px buttons, 20px headers
**Color:** Inherits from parent text color
**Stroke width:** 1.5px

**Required icons:**
- Shield or ShieldCheck (protection)
- EyeSlash (blocked content)
- Pause (pause filtering)
- Gear or Sliders (settings)
- ArrowDown/ArrowUp (import/export)
- X (delete/close)
- Plus (add)
- ToggleLeft/ToggleRight (enable/disable)
- MagnifyingGlass (search)
- Funnel (filter)

## 8. Accessibility

**Focus States:**
- Visible ring: 3px, #F07A9B at 20% opacity, 2px offset
- Never remove focus outlines, only restyle them

**Contrast:**
- All text meets WCAG AA (4.5:1 minimum)
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 against background

**Touch Targets:**
- Minimum 44px for all interactive elements
- 48px on mobile viewports

**Screen Reader:**
- Proper ARIA labels on all controls
- Role attributes on custom components
- Live regions for dynamic content (stats updates)

**Keyboard:**
- Full Tab navigation
- Enter/Space to activate
- Escape to close modals
- Arrow keys for lists

**Reduced Motion:**
- Respect `prefers-reduced-motion: reduce`
- Disable all transitions, use instant state changes
- Keep functional animations (loading states) but simplify

## 9. The "Natural" Checklist

Before finalizing any design, verify:

- [ ] Colors are warm, not clinical gray-blue
- [ ] Typography has personality (Plus Jakarta Sans, not Inter)
- [ ] Shadows are soft and ambient, not harsh
- [ ] Spacing breathes — nothing feels cramped
- [ ] Interactions feel physical (press, spring, slide)
- [ ] No element screams for attention unnecessarily
- [ ] The accent color is used like a highlighter, not a paint bucket
- [ ] Dark mode feels warm, not cold
- [ ] The design could be a physical product (book, notebook, tool)
- [ ] It doesn't look like it was made by an AI

---

*Design system for MBGA browser extension*
*Warm, natural, functional — like a well-made tool*
