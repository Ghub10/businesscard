# Design system (minimal, accessible)

## Principles

- **Mobile-first:** one-column layouts, comfortable reading size, **44×44px** minimum tappable targets where feasible.
- **Speed perceived:** short copy blocks; avoid heavy imagery on first paint.
- **Accessibility:** real labels, logical headings, focus visibility, sensible contrast.

## Color palette (starter)

| Token | Role | Example |
|-------|------|--------|
| `bg` | Page background | `#FAFAFA` |
| `surface` | Panels | `#FFFFFF` |
| `ink` | Primary text | `#111111` |
| `muted` | Secondary text | `#52525B` |
| `line` | Borders | `#E4E4E7` |
| `primary` | Primary button | `#2563EB` (customizable later) |
| `primary-ink` | Text on primary | `#FFFFFF` |
| `danger` | Errors | `#DC2626` |

## Typography

- **Stack:** `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
- **Headline:** 24–28px semibold
- **Body:** 16px minimum on mobile
- **Small:** 13–14px sparingly

## Spacing (4px base)

Use 8, 12, 16, 24, 32. Screen padding **16px**.

## Buttons

- Primary: filled, **48px** min height, radius **12px**.
- Secondary: outline/ghost.
- **Focus:** visible focus ring; clear disabled state.

## Inputs

- Min height **48px**, radius **12px**, label above field; errors below in `danger`.

## Public page pattern

- One **dominant** primary button; secondary actions de-emphasized.

## Motion

- Subtle; respect `prefers-reduced-motion`.
