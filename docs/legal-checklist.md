# Legal and support checklist

The legal pages are written and wired (`/aviso-legal/`, `/privacidad/`, `/cookies/`, `/terminos/`,
`/compras-y-reembolsos/`, `/soporte/`), but several facts about the seller are not documented
anywhere and must be supplied by the owner. They are marked as `[[PLACEHOLDER]]` in
`content/es/legal/seller.ts`; `npm run check:placeholders:strict` (run by the Deploy workflow)
refuses to ship while any remain.

## Required from the owner

| Placeholder | What to provide | Why |
|---|---|---|
| `[[RAZON_SOCIAL]]` | Legal name (person or company) that sells through Hotmart | Identification of the seller (LSSI art. 10 if Spain; consumer law elsewhere) |
| `[[NIF_CUIT]]` | Tax identification number | Same |
| `[[DOMICILIO]]` | Postal address for legal notices | Same |
| `[[PAIS]]` | Country of establishment | Governing law statement |
| `[[JURISDICCION]]` | Competent courts (city/country) | Governing law statement |

Also decide and confirm (no placeholder, but must be verified):

- **Guarantee period.** The site states 7 days (`config/commerce.ts`). Hotmart's help center
  (read 2026-09) says sales to buyers in Europe require a minimum 15-day guarantee; confirm the
  value configured in the Hotmart product and align (either 15 globally — one honest number — or
  keep 7 with the EU exception wording already present on `/terminos/` and
  `/compras-y-reembolsos/`). Owner decision pending.
- **Brand and mailbox.** The site is branded Pequeverso only; the former operator name is
  retired from every customer-facing surface (unit invariant in `tests/unit/content-invariants.test.ts`
  and `scripts/check-rendered.ts`). A single mailbox, `somospequeverso@gmail.com`, handles support
  and privacy requests (`config/site.ts`, `content/es/legal/seller.ts`). If it ever changes, update
  both files; nothing else retypes it.
- **Response time.** Currently "48 horas hábiles" — keep only if you can honour it.
- **Withdrawal right.** `/terminos/` states neutrally that, for digital content delivered at once,
  the cooling-off right may lapse where the law allows it and that the Hotmart guarantee applies
  regardless. Confirm with the Hotmart checkout configuration for EU buyers (express consent to
  immediate delivery) before relying on that wording.
- **Argentina, if the seller is established there:** Ley 24.240 art. 34 and Res. 424/2020
  ("Botón de arrepentimiento") may require a visible withdrawal button on the home page. The
  footer help column now links "Reembolsos" → `/compras-y-reembolsos/` on every page, and
  `/terminos/` and `/compras-y-reembolsos/` state the Argentine (10 días corridos), Colombian
  (5 días hábiles) and Mexican (LFPC) rules; whether a literal "Botón de arrepentimiento" label
  is required still needs a legal opinion.
- **Hotmart contracting entity** shown on buyer invoices (Hotmart B.V. / Launch Pad) — mention it
  in `/privacidad/` if different from the current wording.
- **Analytics.** If a second measurement tool is ever added, list it in `/cookies/` and `/privacidad/`.
- **Consent policy.** The pixel runs by default with an opt-out banner (owner decision, 2026-09-14); for EU/Spain traffic a legal review may require prior consent (`DEFAULT_CHOICE` in `src/features/tracking/consent.ts`).

## What the pages already state

- Hotmart is the intermediary: processes payment, currency conversion, taxes, delivery and
  refunds; the site never sees card data.
- Prices are USD reference prices; Hotmart charges in the buyer's local currency and shows the
  final total with taxes before payment (`localCurrencyNote` in `config/commerce.ts`, rendered
  next to every price and explained in `/terminos/` and `/compras-y-reembolsos/`; the rendered
  check fails if a page shows `US$` without the "moneda local" wording).
- Products are 100% digital; composition and prices come from the product registry.
- Personal, family and classroom-complement licence ("Puedes / No puedes" lists); institutional
  use needs a written licence; no redistribution.
- Guarantee (`guaranteeDays`) plus a neutral withdrawal-right paragraph; post-purchase offers are
  optional, separate purchases with the same guarantee.
- Privacy: controller (single mailbox), Hotmart as independent controller, data categories,
  purposes and legal bases table, recipients (Hotmart, Meta, Hostinger, email provider), transfers,
  retention table, rights list with how to exercise them, adults-only audience, changes.
- Cookies: table with `pv_consent`, `_fbp`, `_fbc`; how the opt-out banner works (Aceptar /
  Rechazar / Configurar, mirrors `src/features/tracking`); Hotmart cookies under Hotmart's policy.
- Aviso legal: identification list (placeholders render as "pendiente de publicación" with a note
  until supplied), single contact, IP and licence summary, third-party links, a short voluntary
  accessibility statement (WCAG 2.2 AA as the reference, not a conformance claim), governing law.
- Support routes: access problems, refunds (refund.hotmart.com + transaction id), other questions,
  what to include in a message (purchase email, HP transaction code).

## Accessibility statement

The EU Accessibility Act applies to e-commerce services from 2025-06-28; micro-enterprises are
exempt for services. `/aviso-legal/` carries a short voluntary statement (WCAG 2.2 AA as the
reference plus the contact mailbox). Turn it into a formal conformance statement only once the
owner confirms the company size and an audit backs the claim.
