# Zubia brand assets

## Files

| File | Use |
|---|---|
| `zubia-logo.png` | Original full lockup (mark + wordmark + tagline), 1254×1254 on white |
| `zubia-logo-trimmed.png` | Same lockup, cropped to the artwork |
| `zubia-mark.svg` | House mark only, vector — the source for every generated icon |
| `zubia-mark-512.png`, `zubia-mark-192.png` | Raster mark on white, for anything that can't take SVG |

Generated from `zubia-mark.svg` and wired up automatically by Next.js:

- `web/app/icon.svg` — browser tab
- `web/app/apple-icon.png` — iOS home screen (180×180)
- `web/app/opengraph-image.png` — link previews (1200×630)

In the app itself, don't use these images for the header or footer — use the
`ZubiaLogo` / `ZubiaMark` components in `web/components/brand/ZubiaLogo.tsx`.
They draw the mark as inline SVG (crisp at any size, recolourable for dark
backgrounds) and set the wordmark as live text.

## Colours

Zubia was blue until it wasn't. Every property portal in the region is blue,
and green is the colour of land and of holding title to it, which is the
whole proposition. The brand is now one green at three depths, so a button,
its hover and a heading are obviously the same colour rather than three
separate decisions.

| Name | Hex | Token | Use |
|---|---|---|---|
| Primary Green | `#1A6B4A` | `primary` | House icon, buttons, links, trust marks |
| Deep Green | `#11513A` | `primary-dark` | Hovers, nav accents, secondary house details |
| Ink | `#10291F` | `ink` | Wordmark, headlines, key text, admin sidebar |
| Warm Gray | `#6B6560` | `subtle` | Taglines, secondary text |
| White | `#FFFFFF` | `background` | Backgrounds and whitespace |

One supporting hue sits beside the greens, so the page is not green on
green. Green is the action and trust colour; clay carries emphasis:

| Name | Hex | Token | Use |
|---|---|---|---|
| Clay | `#A8441F` | `clay`, `clay-tint` | Section eyebrows, tags, "featured", move-in cost, map pin for featured |
| Sand | `#F2ECE1` | `sand` | A band that separates from white without using ink |

The greys are warm (`subtle` `#6B6560`, `surface` `#FAF8F5`, `line` `#E8E3DB`).
They used to be blue-tinted, which is why every "neutral" area still read as
blue.

Two supporting tokens are derived from the above, not part of the core palette:

- `mint` (`#74CCA4`) — a lighter green for accents on `primary-dark` or `ink`
  backgrounds, where the primary doesn't have enough contrast (4.83:1 on
  `primary-dark`, 8.03:1 on `ink`).
- `warning` (`#B45309`) — semantic only, for the "pending" listing status and
  caution notes. Statuses need to stay distinguishable from the brand green.

### Retired tokens

`royal`, `navy`, `sky`, `blue-tint`, `green` and `green-tint` no longer exist.
`royal` and `navy` were second names for `primary-dark` and `ink`, and two
names for one colour is how a palette drifts apart. The old `green`
(`#2F6B4F`) sat a shade off the new primary, close enough that the two read as
one colour applied inconsistently, so trust marks use `primary` itself.

### Contrast

Every pair was measured, not judged by eye:

| Pair | Ratio |
|---|---|
| white on `primary` | 6.47:1 |
| white on `primary-dark` | 9.28:1 |
| white on `ink` | 15.45:1 |
| white on `clay` | 5.98:1 |
| `primary` on white | 6.47:1 |
| `primary` on `surface` | 6.10:1 |
| `primary` on `primary-tint` | 5.87:1 |
| `ink` on white | 15.45:1 |
| `mint` on `primary-dark` | 4.83:1 |

All clear WCAG AA (4.5:1) for small text.

All of these are defined in `web/app/globals.css`; the mobile app mirrors them
in `mobile/src/constants/theme.ts` (`Brand`).

## Type

| Element | Font |
|---|---|
| Logo wordmark | Poppins Bold (700) |
| Headings | Poppins SemiBold (600) / Bold |
| Body | Inter Regular (400) |
| Buttons | Inter SemiBold (600) |

Both are loaded through `next/font/google` in `web/app/layout.tsx` and exposed
as the `font-display` / `font-heading` (Poppins) and `font-sans` (Inter)
Tailwind utilities.
