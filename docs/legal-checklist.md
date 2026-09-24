# Legal and support checklist

The legal pages (`/aviso-legal/`, `/privacidad/`, `/cookies/`, `/terminos/`,
`/compras-y-reembolsos/`, `/arrepentimiento/`, `/soporte/`) are written for an **Argentine seller**
selling digital products to consumers anywhere, mostly in Latin America, through Hotmart. Seller-side
law is Argentine (identity, Ley 25.326 for our processing, courts of Bahía Blanca); the consumer terms
keep every buyer's mandatory local rights and point to the simple path that works everywhere (the
Hotmart guarantee or an email with the transaction code).

All facts come from configuration, never from page literals:

| File | Holds |
|---|---|
| `content/es/legal/seller.ts` | Titular, CUIL, domicile, country, courts, mailbox, response time, `updatedAt` |
| `content/es/legal/argentina.ts` | revocation period (10 días corridos), 24 h request code, consumer and data authorities, AAIP notice (verbatim), jurisdiction clause |
| `content/es/legal/consumer-rights.ts` | "Si compras desde…" table: authority, link, verified period or `null`, note, source |
| `config/commerce.ts` | `guaranteeDays` (7), Hotmart URLs, local-currency note |

`npm run check:placeholders:strict` (run by the Deploy workflow) passes: no `[[PLACEHOLDER]]` remains.

## What changed on 2026-09-24

- **Seller data published** (owner consent, 2026-09-24): Gonzalo Martín Pérez, persona humana,
  CUIL 23-43891426-9, Humberto Primo 445, departamento 5, B8000 Bahía Blanca, provincia de Buenos
  Aires, República Argentina. Shown on `/aviso-legal/`, `/privacidad/`, `/terminos/` and in the
  footer (Res. SCI 270/2020, GMC 37/19: name, address, e-mail and tax id "en ubicación de fácil
  visualización y previo a la formalización del contrato").
- **Spanish anchoring removed**: no LSSI, no AEPD as authority, no RDL 1/2007 as the governing
  law. The EU appears only as "si compras o navegas desde la UE" (RGPD rights, 14-day withdrawal with
  the digital-content exception).
- **Privacy** re-anchored to Ley 25.326 + Decreto 1558/2001, AAIP as control authority, the Res.
  AAIP 14/2018 notice verbatim, access/rectification/suppression periods, art. 12 transfers against
  the AAIP adequacy list, and a section for residents of countries with their own data law.
- **Consumer terms** re-anchored to Ley 24.240 and the CCyC (arts. 1095, 1109–1116, 2654, 2655),
  numbered sections, defined terms (Titular, Sitio, Usuario/Comprador, Hotmart).
- **Botón de arrepentimiento**: footer link with that exact label on every page → `/arrepentimiento/`
  (noindex): no registration, email with the HP code or refund.hotmart.com, request code within 24 h,
  10-day revocation where applicable, the Hotmart guarantee in every case, the per-country table.
- **Jurisdiction**: Argentine law, without prejudice to the consumer's mandatory local law; the
  consumer chooses the forum (Bahía Blanca is one option, as the seller's domicile); Bahía Blanca is
  the agreed forum only for buyers who do not act as consumers.
- **Demo videos**: labelled "Video ilustrativo." and described as illustrative, sometimes
  AI-generated, on `/aviso-legal/` and `/terminos/` (docs/media.md).

## Sources (read 2026-09-24)

Argentina — personal data
- Ley 25.326, arts. 5, 6, 12, 14 (access in 10 días corridos, free every six months), 16
  (rectification/suppression in 5 días hábiles), 21:
  https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm
- Decreto 1558/2001: https://servicios.infoleg.gob.ar/infolegInternet/anexos/70000-74999/70368/norma.htm
- Res. AAIP 14/2018 (repealed Disp. DNPDP 10/2008; mandatory AAIP text):
  https://www.boletinoficial.gob.ar/detalleAviso/primera/179914/20180309
- Adequate countries, Disp. DNPDP 60-E/2016 as amended by Res. AAIP 34/2019 (EU/EEA, UK,
  Switzerland, Uruguay, New Zealand, Israel…; **not** the US):
  https://www.boletinoficial.gob.ar/detalleAviso/primera/202373/20190226 ·
  https://www.argentina.gob.ar/transferencias-internacionales
- Database registration: https://www.argentina.gob.ar/registrar-bases-privadas
- AAIP complaints: https://www.argentina.gob.ar/servicio/denunciar-incumplimientos-de-la-ley-de-proteccion-de-datos-personales

Argentina — consumer
- Ley 24.240 (arts. 3, 4, 10 bis, 34, 37; no change by DNU 70/2023):
  https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/638/texact.htm
- Código Civil y Comercial, arts. 1095, 1109–1116, 2654, 2655:
  https://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/235975/texact.htm
  - Art. 1116 b): "Excepto pacto en contrario, el derecho de revocar no es aplicable a … ficheros
    informáticos, suministrados por vía electrónica, susceptibles de ser descargados o reproducidos
    con carácter inmediato para su uso permanente". The pages state the exception neutrally and never
    rely on it against the Hotmart guarantee.
- Disposición SSDCyLC 954/2025 (Botón de arrepentimiento; repealed Res. SCI 424/2020): art. 1 link
  named "BOTÓN DE ARREPENTIMIENTO", "a simple vista, en lugar destacado y en el primer acceso", no
  registration; art. 5 request code within 24 h by the same channel; art. 6 contact channel:
  https://www.boletinoficial.gob.ar/detalleAviso/primera/330827/20250904
- Res. SCI 270/2020 (GMC 37/19, e-commerce information):
  https://servicios.infoleg.gob.ar/infolegInternet/anexos/340000-344999/341933/norma.htm
- Disp. 890/2025 repealed Res. SCI 274/2021 (the mandatory "Defensa de las y los Consumidores"
  footer legend); the consumer-authority link is now voluntary and lives on the legal pages:
  https://www.boletinoficial.gob.ar/detalleAviso/primera/330022/20250819
- Res. SIyC 4/2025 (prices; repealed Res. SCI 7/2002):
  https://www.boletinoficial.gob.ar/detalleAviso/primera/319787/20250117
- ARCA Data Fiscal (F. 960/D): https://www.afip.gob.ar/960/formulario-960/obligados.asp ·
  https://www.argentina.gob.ar/servicio/obtener-el-formulario-de-data-fiscal

Hotmart
- Purchase terms (Hotmart B.V. contracts outside Brazil/US; the producer is the seller):
  https://hotmart.com/en/legal/purchase-terms
- Guarantee options 7/15/21/30 days: https://help.hotmart.com/es/article/360034552751/

## Owner actions (not site copy)

1. **Botón de arrepentimiento on the first screen.** Disp. 954/2025 art. 1 requires the link "a
   simple vista, en lugar destacado y en el primer acceso". The footer link exists on every page, but
   the footer is below the fold; a link in the header or top bar of the home/landing pages is owned by
   the landing redesign and still needs to be added there.
2. **Guarantee period.** With 7 days, the Hotmart guarantee is shorter than the 10-day revocation;
   the pages rely on the CCyC 1116 b) exception for immediately downloadable files, which applies
   "excepto pacto en contrario". Setting the Hotmart guarantee to 15 days (a Hotmart option) would
   cover the 10 días corridos, the EU minimum and remove the ambiguity; then change `guaranteeDays`.
3. **Register the database** with the AAIP (Ley 25.326 art. 21; Decreto 1558/2001 art. 1 covers any
   database beyond purely personal use, which includes customer/support e-mails): TAD, Clave Fiscal
   level 2+, "Inscripción de bases de datos privadas", free, update on changes.
4. **Answer arrepentimiento e-mails within 24 h with a request code** (the page promises it; a simple
   format such as `ARR-AAAAMMDD-NN` is enough) and process the refund in Hotmart.
5. **Data Fiscal (ARCA F. 960/D).** Required on the home page of websites of taxpayers who sell to
   final consumers and must invoice them. Whether it applies depends on how the owner invoices (to
   Hotmart B.V. as an export, or to consumers). Ask the accountant; if required, obtain the code with
   Clave Fiscal → "Formulario 960 D" → site URL, and add it to the footer. No placeholder was added
   because the obligation is not clear.
6. **Prices in pesos.** Res. SIyC 4/2025 requires prices offered to final consumers to be shown in
   pesos (USD may be shown in addition). The site shows USD reference prices and says Hotmart shows
   the total in the buyer's currency before paying; whether that satisfies the rule for buyers in
   Argentina is untested. Options: an ARS reference price for Argentine visitors, or confirm with a
   lawyer that the Hotmart checkout (which shows the ARS total) suffices.
7. **Consent model.** The Meta Pixel runs by default with an opt-out banner (owner decision,
   2026-09-14). Ley 25.326 art. 5 asks for free, express and informed consent; the RGPD/ePrivacy
   rules require prior consent in the EU. Switching `DEFAULT_CHOICE` in
   `src/features/tracking/consent.ts` to opt-in removes that risk.
8. **Legal review.** This is research, not legal advice: a lawyer in the provincia de Buenos Aires
   should review the jurisdiction clause, the use of CCyC 1116 and the per-country table before launch.

## Still true from earlier checks

- Hotmart is the intermediary: payment, currency conversion, taxes, delivery and refunds; the site
  never sees card data. The site never emits `InitiateCheckout`/`Purchase`.
- Cookies table (`pv_consent`, `_fbp`, `_fbc`) and the opt-out banner (Aceptar / Rechazar /
  Configurar) mirror `src/features/tracking`.
- Single mailbox `somospequeverso@gmail.com` (`config/site.ts`, `content/es/legal/seller.ts`);
  response time "48 horas hábiles" (support) and 24 h (arrepentimiento code).
- Voluntary accessibility statement on `/aviso-legal/` (WCAG 2.2 AA as the reference, not a
  conformance claim).
