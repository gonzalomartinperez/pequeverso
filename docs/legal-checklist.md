# Legal and support checklist

## Summary

The legal pages (`/aviso-legal/`, `/privacidad/`, `/cookies/`, `/terminos/`,
`/compras-y-reembolsos/`, `/arrepentimiento/`) and `/soporte/` are written for an **Argentine
seller** (persona humana) selling downloadable PDFs through Hotmart to consumers anywhere, mostly in
Latin America. Seller-side law is Argentine: identity, Ley 25.326 for our processing, and the courts
of Bahía Blanca. The consumer terms keep every buyer's mandatory local rights (CCyC art. 2655). They
point everyone to one simple path: the Hotmart guarantee at refund.hotmart.com, or an email with the
HP code.

Open items for the owner are listed under [Owner actions](#owner-actions). The most important:
- the Botón de arrepentimiento must also appear on the **first screen** (not only in the footer);
- the 7-day guarantee is shorter than the 10-day Argentine revocation;
- Data Fiscal and ARS prices need an accountant's or lawyer's answer;
- the database must be registered with the AAIP.

Facts come from data files, never from page literals:

| File | Holds |
|---|---|
| `content/es/legal/seller.ts` | Titular, CUIL, domicile, country, courts, primary mailbox, `legalEmail` (legal pages only), response time, `updatedAt`, `legalRoutes` |
| `content/es/legal/argentina.ts` | 10-day revocation, 24 h request code, national and Buenos Aires consumer authorities, AAIP notice (verbatim) and complaint URL, jurisdiction clause |
| `content/es/legal/consumer-rights.ts` | "Si compras desde…" table: authority, link, verified period or `null`, note, source (unit-tested) |
| `content/es/legal/hotmart.ts` | Hotmart facts: contracting entity, producer response (5 días naturales), approval (7 days), refund timing, HP code path, buyer help URLs |
| `config/commerce.ts` | `guaranteeDays` (7), consumer area and refund URLs, local-currency note |

`npm run check:placeholders:strict` passes: no `[[PLACEHOLDER]]` remains. The Deploy workflow runs
this check.

## Compliance matrix

Status: ✅ done · ⚠️ done with a caveat · ❌ gap (owner action) · — not applicable.

### Argentine online seller

| Requirement | Source | Where on the site | Status |
|---|---|---|---|
| Seller name, tax id (CUIL), physical and electronic address, "en ubicación de fácil visualización y previo a la formalización del contrato" | Res. SCI 270/2020 (GMC 37/19) art. 2; Ley 24.240 art. 4; CCyC art. 1100 | Footer (every page), `/aviso-legal/` §1, `/terminos/` §1, `/privacidad/` §1 | ✅ |
| Essential characteristics, total price with taxes, terms, guarantee conditions | Res. SCI 270/2020 art. 2 VII–XI | Product pages (registry), `/terminos/` §3–§8, Hotmart checkout (final total) | ✅ |
| Terms easy to access, readable and storable | Res. SCI 270/2020 art. 3 | `/terminos/` linked from the footer; §2 says they can be saved or printed | ✅ |
| Error correction and express confirmation before paying | Res. SCI 270/2020 art. 5 | Hotmart checkout | ✅ (Hotmart) |
| Right of revocation stated clearly: 10 días corridos, free of charge | Ley 24.240 art. 34; CCyC arts. 1110–1115 | `/arrepentimiento/` §1, `/terminos/` §9, `/compras-y-reembolsos/` §7 | ⚠️ (CCyC 1116 b: see owner action 2) |
| Link labelled "BOTÓN DE ARREPENTIMIENTO", with no registration | Disp. SSDCyLC 954/2025 art. 1 | Footer "Botón de arrepentimiento" → `/arrepentimiento/` on every page | ⚠️ |
| The same link "a simple vista, en lugar destacado y en el primer acceso" | Disp. 954/2025 art. 1 | — | ❌ owner action 1 |
| Request code within 24 h by the same channel | Disp. 954/2025 art. 5 | `/arrepentimiento/` §3 promises it | ⚠️ the owner must operate it (action 4) |
| Contact channel for consultations and complaints | Disp. 954/2025 art. 6 | `/soporte/`, `/compras-y-reembolsos/` §9, footer | ✅ (the 8-hour weekday rule for purely electronic channels is aimed at "empresas proveedoras"; unclear for an individual) |
| Interpretation most favourable to the consumer; no abusive clauses | Ley 24.240 arts. 3, 37; CCyC arts. 1094–1095 | `/terminos/` §2 | ✅ |
| No forum clause against consumers; consumer may choose the forum; law of the consumer's domicile | CCyC arts. 1109, 2654, 2655 | `jurisdictionClause()` on `/aviso-legal/` §11 and `/terminos/` §12 | ✅ |
| Link to consumer authority (voluntary since Disp. 890/2025) | Disp. 890/2025 repealed Res. SCI 274/2021 | `/aviso-legal/` §9, `/arrepentimiento/` §6 (Ventanilla Federal + Buenos Aires province), per-country table | ✅ |
| Prices in pesos (USD may be shown in addition) | Res. SIyC 4/2025 art. 2 a) | Site shows USD reference and the local-currency note; Hotmart shows the ARS total | ❌ owner action 6 |
| "PRECIO SIN IMPUESTOS NACIONALES" | Res. SIyC 4/2025 art. 2 c) | — | ❌ owner action 6 (application to a monotributista unclear) |
| Data Fiscal (F. 960/D) on the home page | RG AFIP 4042/2017 | — | ❌ owner action 5 (depends on invoicing) |
| Personal-data information before collection (purpose, recipients, controller, voluntary/mandatory, rights) | Ley 25.326 art. 6; Res. AAIP 14/2018 arts. 2–3 | `/privacidad/` §1–§8 | ✅ |
| Mandatory AAIP text, verbatim | Res. AAIP 14/2018 art. 3 | `/privacidad/` §8 (notice block) | ✅ |
| Access (10 días corridos, free every 6 months), rectification/suppression (5 días hábiles) | Ley 25.326 arts. 14, 16, 19 | `/privacidad/` §8 | ✅ |
| International transfers | Ley 25.326 art. 12; Disp. 60-E/2016 + Res. AAIP 34/2019 | `/privacidad/` §6 | ✅ |
| Database registration | Ley 25.326 art. 21 | — | ❌ owner action 3 |
| Consent for marketing measurement | Ley 25.326 art. 5 | Opt-out banner (owner decision) | ⚠️ owner action 7 |
| Cookies policy | Ley 25.326 (IP/identifiers); RGPD/ePrivacy for EU visitors | `/cookies/` | ✅ |

### International buyers

| Requirement | Where | Status |
|---|---|---|
| Who sells (Titular) and who charges (Hotmart B.V.) | `/terminos/` §1, `/aviso-legal/` §5 | ✅ |
| What is sold (composition, format, age) | `/terminos/` §3, product pages | ✅ |
| Total price in local currency with taxes, shown by Hotmart before payment | `localCurrencyNote` next to every price; `/terminos/` §4; `/compras-y-reembolsos/` §3 | ✅ |
| Payment methods and the charge descriptor | `/terminos/` §4, `/compras-y-reembolsos/` §3 | ✅ |
| Delivery and access (email, consumer.hotmart.com) | `/terminos/` §5, `/compras-y-reembolsos/` §4 | ✅ |
| Guarantee: period, how to request it, what data to have, timings | `/terminos/` §8, `/compras-y-reembolsos/` §6–§8, `/arrepentimiento/` | ✅ |
| Statutory rights kept; the most favourable rule applies; digital exceptions stated neutrally | `/compras-y-reembolsos/` §7, `/terminos/` §9, `/arrepentimiento/` §1 | ✅ |
| Per-country authorities and verified periods | `/arrepentimiento/#paises` | ✅ (see "Country table" below for unverified rows) |
| Complaints channels (ours, Hotmart, authorities) | `/compras-y-reembolsos/` §9, `/soporte/` | ✅ |
| Data rights under the buyer's own law (LGPD, Ley 1581, LFPDPPP, Ley 19.628, Ley 29733, RGPD, CCPA/CPRA) | `/privacidad/` §9 | ✅ |
| EU: 14-day withdrawal and the art. 16 m) digital-content conditions | per-country table; `/compras-y-reembolsos/` §7 | ⚠️ the three conditions depend on the Hotmart checkout; the Hotmart guarantee applies regardless |

## What changed on 2026-09-24

- **Seller data published** with the owner's consent: Gonzalo Martín Pérez, persona humana, CUIL
  23-43891426-9, Humberto Primo 445, departamento 5, B8000 Bahía Blanca, provincia de Buenos Aires,
  República Argentina.
  - The owner's Hotmart-account mailbox `seller.legalEmail` is a secondary contact on the six legal
    routes only.
  - Enforcement: `tests/unit/legal-email.test.ts` and `scripts/check-rendered.ts`.
- **Spanish anchoring removed.** No LSSI, no AEPD as authority, no RDL 1/2007 as governing law. The
  EU and Spain appear only as buyer markets.
- **Privacy** is re-anchored to Ley 25.326, Decreto 1558/2001 and the AAIP.
  - The Res. AAIP 14/2018 notice appears verbatim.
  - Transfers are checked against the AAIP adequacy list.
  - A new section covers residents of countries with their own data law.
- **Consumer terms** are re-anchored to Ley 24.240 and the CCyC.
  - Sections are numbered, and the terms are defined: Titular, Sitio, Usuario/Comprador, Hotmart.
  - The guarantee vs. statutory-rights explanation is given in plain language.
- **`/arrepentimiento/`** (noindex) is new, reached from the footer link "Botón de arrepentimiento".
  It offers:
  - two routes: email or refund.hotmart.com;
  - no registration;
  - a code within 24 h;
  - the 10-day revocation where applicable;
  - the Hotmart guarantee;
  - the per-country table.
- **Jurisdiction clause.** Argentine law applies, without prejudice to the consumer's mandatory local
  law. The consumer chooses the forum; Bahía Blanca is one option, as the seller's domicile. Bahía
  Blanca is the agreed forum only for buyers who do not act as consumers.
- **Demo videos** are labelled "Video ilustrativo.", and `/aviso-legal/` and `/terminos/` describe them
  as illustrative and sometimes AI-generated (docs/media.md).

## Sources (read 2026-09-24)

### Argentina: personal data
- **Ley 25.326**: arts. 5, 6, 12, 14 (access in 10 días corridos, free every six months), 16
  (rectification and suppression in 5 días hábiles), 19, 21.
  https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm
- **Decreto 1558/2001**: https://servicios.infoleg.gob.ar/infolegInternet/anexos/70000-74999/70368/norma.htm
- **Res. AAIP 14/2018** repealed Disp. DNPDP 10/2008 and sets the mandatory AAIP text:
  https://www.boletinoficial.gob.ar/detalleAviso/primera/179914/20180309
- **Adequate countries**, per Disp. 60-E/2016 as amended by Res. AAIP 34/2019: EU/EEA, UK,
  Switzerland, Uruguay, New Zealand, Israel and others, but **not** the US.
  - https://www.boletinoficial.gob.ar/detalleAviso/primera/202373/20190226
  - https://www.argentina.gob.ar/transferencias-internacionales
- **Database registration**: https://www.argentina.gob.ar/registrar-bases-privadas
- **AAIP complaints**: https://www.argentina.gob.ar/servicio/denunciar-incumplimientos-de-la-ley-de-proteccion-de-datos-personales

### Argentina: consumer
- **Ley 24.240**: arts. 3, 4, 10 bis, 33, 34, 37. DNU 70/2023 made no change.
  https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/638/texact.htm
- **Código Civil y Comercial**: arts. 1094–1095, 1100, 1109–1116, 2654, 2655.
  https://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/235975/texact.htm
  - Art. 1116 b): "Excepto pacto en contrario, el derecho de revocar no es aplicable a … ficheros
    informáticos, suministrados por vía electrónica, susceptibles de ser descargados o reproducidos
    con carácter inmediato para su uso permanente".
  - Art. 34 of Ley 24.240 says the right "no puede ser dispensada ni renunciada". How these two
    interact is not settled.
- **Disp. SSDCyLC 954/2025** (Botón de arrepentimiento; repealed Res. SCI 424/2020):
  https://www.boletinoficial.gob.ar/detalleAviso/primera/330827/20250904
  - Art. 1: "a simple vista, en lugar destacado y en el primer acceso", with no registration.
  - Art. 3 a): exemption for the CCyC 1116 cases, "excepto pacto en contrario".
  - Art. 5: code within 24 h.
  - Art. 6: contact channel.
- **Res. SCI 270/2020** (GMC 37/19):
  https://servicios.infoleg.gob.ar/infolegInternet/anexos/340000-344999/341933/norma.htm
- **Disp. 890/2025** repealed Res. SCI 274/2021, the mandatory footer legend:
  https://www.boletinoficial.gob.ar/detalleAviso/primera/330022/20250819
- **Res. SIyC 4/2025** (prices; repealed Res. SCI 7/2002):
  https://www.boletinoficial.gob.ar/detalleAviso/primera/319787/20250117
- **ARCA Data Fiscal (F. 960/D)**:
  - https://www.afip.gob.ar/960/formulario-960/obligados.asp
  - https://www.argentina.gob.ar/servicio/obtener-el-formulario-de-data-fiscal
- **Consumer complaints**:
  - national: https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor
  - Buenos Aires province: https://www.gba.gob.ar/defensaconsumidores (the old `/consumidores`
    path returns 404)

### Hotmart
- **Términos Generales de Compra** (23-10-2024), https://hotmart.com/es/legal/plazo-de-compra:
  - §1.2: Hotmart B.V., Frederiksplein 1, Ámsterdam.
  - §3.1: the period starts at "efectivización de la compra", "siempre que se respete el plazo mínimo
    establecido por la ley o por el Creador, en caso superior".
  - §3.4: up to 30 days by bank transfer, up to 90 days by credit card, by the same payment method.
- **Política General de Pago** (21-09-2026), https://hotmart.com/es/legal/politica-de-pago:
  - §3.6: the producer has "05 días naturales" to answer.
  - The auto-approval after 5 days appears only in Hotmart's 2024 blog post, so the pages no longer
    claim it.
- **Guarantee options 7/15/21/30**; "si vendes tu producto en algún país de Europa … mínimo de 15 días":
  https://help.hotmart.com/es/article/360034552751/
- **Refund steps and approval "hasta 7 días"**: https://help.hotmart.com/es/article/360061973392/
- **HP code in Mis compras → Mostrar detalles → Historial de transacciones**:
  https://help.hotmart.com/es/article/21859923338637
- **Refund timing per method**: https://help.hotmart.com/es/article/4429522581901/
- **Argentina: taxes are withheld and only the product value is refunded; international invoice at
  purchase.hotmart.com/invoice**:
  - https://help.hotmart.com/es/article/15038303747981
  - https://help.hotmart.com/es/article/360051146712
- **Buyer help**: https://help.hotmart.com/es/categories/25851725931533/compre-o-quiero-comprar-y-necesito-ayuda?profile=BUYER

### Country table (`content/es/legal/consumer-rights.ts`)

A period is published only where the statute text was read on an official source:

| Country | Period | Source |
|---|---|---|
| Argentina | 10 días corridos | infoleg (above) |
| Brasil | 7 días (CDC art. 49) | https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm |
| Chile | 10 días (Ley 19.496 art. 3 bis b, as amended by Ley 21.398; only services may be excluded; digital content not mentioned) | https://www.bcn.cl/leychile/navegar?idNorma=1160403 |
| Colombia | 5 días hábiles (Ley 1480 art. 47) | https://www.secretariasenado.gov.co/senado/basedoc/ley_1480_2011.html |
| España | 14 días naturales (RDL 1/2007 arts. 102, 104; exception art. 103 m) | https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555 |
| Unión Europea | 14 días (Directive 2011/83/EU art. 9; exception art. 16 m) | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:02011L0083-20220528 |
| Uruguay | 5 días hábiles (Ley 17.250 art. 16) | https://www.impo.com.uy/bases/leyes/17250-2000 |

Authority link only, with a period of `null`:

| Country | Why |
|---|---|
| Bolivia (Ley 453), Panamá, Venezuela | No distance-sale right found. |
| Perú | Ley 29571 art. 59 applies only to aggressive or deceptive practices: https://cdn.www.gob.pe/uploads/document/file/1351847/1244218-ley-29571_spij.pdf |
| México | LFPC art. 56 covers sales "fuera del establecimiento"; whether it reaches online sales is PROFECO practice, not statute text, and later reforms were not checked. |
| Ecuador | The 2022 text (15 days, art. 45) was read on a non-official copy. |
| Costa Rica, El Salvador, Honduras, Paraguay | Periods found but not on an official source. |
| Guatemala | The quote came from a non-official copy. |
| Nicaragua | The reglamento limits the right to defective goods; Hotmart may block the country. |
| República Dominicana | Application to instant downloads is unclear. |
| Estados Unidos | No federal right: the FTC Cooling-Off Rule (16 CFR 429) covers door-to-door and temporary-location sales only. |
| Puerto Rico | Withdrawal rule not verified; reclamos ante DACO. |

Cuba and Guinea Ecuatorial are omitted: Hotmart excludes OFAC-sanctioned countries, and Guinea
Ecuatorial is not a market.

On 2026-09-24 these authority URLs did not answer automated requests from the build machine. Check
them in a browser:
- https://consumidor.justicia.gob.bo/
- https://www.consumo.go.cr/
- https://www.dpe.gob.ec/
- https://sedeco.gov.py/
- https://www.consumidor.gov.br/

Data-protection law names:
- LGPD (Lei 13.709/2018)
- Ley Estatutaria 1581 de 2012
- Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México, DOF
  20-03-2025)
- Ley 19.628 (Chile; Ley 21.719 in force from 1 Dec 2026)
- Ley 29733 (Perú)

## Owner actions

1. **Put the Botón de arrepentimiento on the first screen.** Disp. 954/2025 art. 1 requires the
   link "a simple vista, en lugar destacado y en el primer acceso". The footer link is on every
   page, but it is below the fold.
   - Add a link labelled "Botón de arrepentimiento" to `/arrepentimiento/` in the header or top bar.
   - This belongs to the landing/header work: `src/components/layout/header.tsx` or the landing
     `Topbar`.
2. **Set the guarantee to at least 15 days.**
   - Today the Hotmart guarantee (7 days) is shorter than the Argentine revocation (10 días corridos).
   - The pages rely on CCyC 1116 b), with the guarantee as the "pacto en contrario", but art. 34 of
     Ley 24.240 says the right cannot be waived.
   - A 15-day guarantee is a standard Hotmart option. It covers Argentina and Chile, meets Hotmart's
     EU minimum, and removes the ambiguity.
   - After changing it in Hotmart, change `guaranteeDays`.
3. **Register the database with the AAIP** (Ley 25.326 art. 21). Customer and support emails are a
   database beyond personal use.
   - Where: TAD, with Clave Fiscal level 2 or higher.
   - Steps: first register as the responsible party, then "Inscripción de bases de datos privadas".
   - Free; update the registration whenever something changes.
4. **Operate the 24 h code.** Answer every arrepentimiento email within 24 h with a request code, for
   example `ARR-AAAAMMDD-NN`, then process the refund in Hotmart.
   - Hotmart gives the producer 5 días naturales to answer refund requests.
5. **Data Fiscal (ARCA F. 960/D).** It is required on the home page of websites that sell to final
   consumers.
   - Whether it applies depends on how the owner invoices: to Hotmart B.V. as an export, or to
     consumers. Ask the accountant.
   - If it is required, get the code with Clave Fiscal → "Formulario 960 D" → site URL, and add it
     to the footer.
   - No placeholder was added, because the obligation is not clear.
6. **Prices in pesos.** Res. SIyC 4/2025 requires prices offered to final consumers to be shown in
   pesos; USD may be shown in addition. It also requires "precio sin impuestos nacionales".
   - The site shows USD reference prices plus the local-currency note. Hotmart shows the ARS total
     (via EBANX) before payment.
   - Whether that is enough for Argentine buyers is untested.
   - Options: show an ARS reference price to Argentine visitors, or get a lawyer's opinion that the
     checkout suffices.
7. **Consent model.** The pixel runs by default with an opt-out banner (owner decision,
   2026-09-14).
   - Ley 25.326 art. 5 asks for free, express and informed consent. The EU requires prior consent.
   - Switching `DEFAULT_CHOICE` in `src/features/tracking/consent.ts` to opt-in removes this risk.
8. **Legal review.** This is research, not legal advice. Before launch, a lawyer in the provincia de
   Buenos Aires should review:
   - the jurisdiction clause;
   - the use of CCyC 1116;
   - Chile (whether a PDF counts as a good or a service);
   - the per-country table.

## Still true from earlier checks

- **Hotmart's role.** Hotmart is the intermediary for payment, currency conversion, taxes, delivery
  and refunds, and the site never sees card data.
  - The site never emits `InitiateCheckout` or `Purchase`.
- **Cookies.** The cookies table (`pv_consent`, `_fbp`, `_fbc`) and the opt-out banner (Aceptar /
  Rechazar / Configurar) mirror `src/features/tracking`.
- **Mailboxes.** The primary mailbox is `somospequeverso@gmail.com` (`config/site.ts`,
  `content/es/legal/seller.ts`).
  - Response time: "48 horas hábiles" for support, 24 h for the arrepentimiento code.
  - `seller.legalEmail` is the Titular's own mailbox, registered in the Hotmart account, where Hotmart
    forwards buyer contacts. It appears only on the six legal routes.
- **Accessibility statement.** `/aviso-legal/` has a voluntary statement that uses WCAG 2.2 AA as the
  reference; it is not a conformance claim.
