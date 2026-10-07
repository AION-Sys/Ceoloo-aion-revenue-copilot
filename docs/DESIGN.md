# Design system — Revenue Copilot Command Center

## Intent
A **rigid sales command cockpit**, not a soft marketing page and not a light CRM. Visual language borrows discipline from Linear/admin dashboards (shadcn density) with anti-slop rules from Taste / Impeccable / UI UX Pro Max.

## Direction: Steel Command
| Token | Choice |
|-------|--------|
| Mood | Cool graphite, operational, precise |
| Accent | Single teal signal (`--ai`) for Copilot guidance |
| Density | High — dashboard information density |
| Motion | Purposeful: enter stagger, hover press, active nav |
| Cards | Prefer borders + spacing over nested card stacks |

## Typography
- **UI:** Outfit (expressive geometric sans — not Inter/Geist default)
- **Data:** JetBrains Mono with `tabular-nums` for KPIs and timers

## Surfaces
- Cool-tinted neutrals (no warm cream, no purple gradients)
- Subtle grid/grain atmosphere on the shell background
- Tinted shadows matching slate hue

## Interaction
- `cursor-pointer` on clickable rows/controls
- Hover: background shift + 1px translate
- Active: `scale(0.98)` press feedback
- Focus: visible ring using `--ring`
- Never claim live/synced states without evidence badges

## Screen gravity
Today owns the first viewport as one composition: greeting, KPI strip, priority queue, Copilot rail. Secondary chrome stays quiet.
