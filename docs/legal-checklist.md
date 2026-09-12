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

- **Guarantee period.** The site states 7 days (`config/commerce.ts`). Hotmart requires a
  15-day minimum for sales to EU residents; confirm the value configured in the Hotmart product
  and align (either 15 globally — one honest number — or keep 7 with the EU exception wording
  already present on `/terminos/` and `/compras-y-reembolsos/`).
- **Support mailbox.** `support@digitalproductsteam.com` is used everywhere. If the old domain
  is not renewed, create `support@pequeverso.com` and update `config/site.ts` and
  `content/es/legal/seller.ts` (`supportEmail`, `privacyEmail`) before launch.
- **Response time.** Currently "48 horas hábiles" — keep only if you can honour it.
- **Argentina, if the seller is established there:** Ley 24.240 art. 34 and Res. 424/2020
  ("Botón de arrepentimiento") may require a visible withdrawal button on the home page. This
  needs a legal opinion; the page structure can host it in the footer.
- **Hotmart contracting entity** shown on buyer invoices (Hotmart B.V. / Launch Pad) — mention it
  in `/privacidad/` if different from the current wording.
- **Analytics.** If Umami (or any analytics) is enabled, list it in `/cookies/` and `/privacidad/`.

## What the pages already state

- Hotmart is the intermediary: processes payment, taxes, delivery and refunds; the site never
  sees card data.
- Products are 100% digital; composition and prices match `config/commerce.ts`.
- Personal, family and classroom-complement licence; no redistribution.
- Privacy: controller, purposes and legal bases, recipients (Hotmart, Meta, Hostinger, email
  provider), transfers, retention, rights, adults-only audience.
- Cookies: table with `pv_consent`, `_fbp`, `_fbc`; equal accept/reject; Hotmart cookies under
  Hotmart's policy.
- Support routes: access problems, refunds (refund.hotmart.com + transaction id), other questions.

## Accessibility statement

The EU Accessibility Act applies to e-commerce services from 2025-06-28; micro-enterprises are
exempt for services, but a short voluntary statement is recommended. Add it to `/aviso-legal/`
once the owner confirms the company size.
