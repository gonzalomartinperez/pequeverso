# shadcn/ui components — provenance

Generated with `npx shadcn@latest` (CLI 4.21.0) on 2026-09-20, `base` library, style
`base-vega` (`components.json`), then restyled with the project tokens and roles. Upstream:
https://github.com/shadcn-ui/ui (MIT License, © shadcn). Primitives: Base UI
(`@base-ui/react`, MIT, © MUI). Icons: lucide-react (ISC).

| File | Upstream item | Local changes |
|---|---|---|
| `button.tsx` + `button-variants.ts` | `button` | variants split into a server-safe module; `primary` coral pill, `secondary` navy, `outline`, `inverse`, `ghost`, `link`; sizes 56/44 px, `block` |
| `badge.tsx` + `badge-variants.ts` | `badge` | server-safe variants; `chip`, `gold`, `navy`, `outline`, `soft`; wraps (no `nowrap`) |
| `card.tsx` | `card` | `variant` (default/emphasis/soft/navy), `pad`, `as`, `reveal`, `stagger`; `on-light`/`on-navy` scoping |
| `dialog.tsx`, `sheet.tsx` | `dialog`, `sheet` | navy scrim, token transitions, Spanish `closeLabel`, 44 px close |
| `accordion.tsx` | `accordion` | FAQ card look, height transition on `--accordion-panel-height` |
| `tabs.tsx`, `radio-group.tsx` | `tabs`, `radio-group` | chip look; `RadioGroupItem variant: dot \| chip` |
| `tooltip.tsx`, `separator.tsx`, `skeleton.tsx`, `table.tsx` | same names | navy tooltip; reduced-motion-safe skeleton; legal table styling |

`scroll-area` was generated and removed (not needed). `tw-animate-css` was installed by the CLI
and removed: Base UI transitions and `motion.css` cover every animation.
