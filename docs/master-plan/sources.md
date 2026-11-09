# Sources

Every external source used by this plan, dated 2026-11-09 (the day the research notes and this plan were written). Commercial-interest flag: `$` means the source sells a related product or service; `P` primary (opened), `S` secondary (snippet or summary). The research notes in `research/` hold the full lists and the honesty notes; this file points to them and records the ones this plan leans on. No source was newly fetched for this plan; the audit numbers are the measured files under `audit/`.

## Research notes (copied under `research/`)

| Note | Used for |
|---|---|
| `research/07-cro-seo-analytics.md` | CRO playbook, trust without proof, SEO, analytics and consent, legal AR/MX/CL, assistant guidance (all of `cro.md`) |
| `research/13-sites-master-uiux.md` section 4 and sections 2, 5, 6 | Pequeverso design, motion system, budgets, acceptance (`design-playbook.md`) |
| `research/06-ui-ux-design.md` | tokens, accessibility, dark-mode evidence |
| `research/01-nextjs-architecture.md` | Next.js architecture, deploy mode, security releases |
| `research/04-testing.md` | test layers, mutation, Playwright |
| `research/05-cicd-supply-chain.md` | CI, Dependabot, SHA pinning, attestations, Hostinger compensating controls |
| `research/08-docs-readme-skills.md` | README, Diátaxis, skills |
| `research/10-standards-dependencies.md` | style, dependency policy |
| `research/11-containers-dynamic-ci.md` | dynamic CI, profiles (no image here) |

## Primary sources behind the numbers used

| Claim | Source | Flag |
|---|---|---|
| Core Web Vitals thresholds LCP 2.5 s, INP 200 ms, CLS 0.1 (p75) | https://web.dev/articles/vitals | P |
| Vodafone A/B: 31% better LCP gave +8% sales | https://web.dev/case-studies/vodafone | P |
| Cart abandonment 70.22%, reasons (card distrust 19%) | https://baymard.com/lists/cart-abandonment-rate | P |
| People prefer AI for comparison and stock questions, humans for billing | https://baymard.com/research-articles/ai-engagement-quantitative-ux-insights-2026 | P |
| Google: AI features build on core ranking; llms.txt no effect; structured data not required | https://developers.google.com/search/docs/fundamentals/ai-optimization-guide | P |
| FAQ rich results limited in 2023 (removal in 2026 unverified) | https://developers.google.com/search/blog/2023/08/howto-faq-changes ; https://www.searchenginejournal.com/google-drops-faq-rich-results/574429/ | P / S |
| JSON-LD in Next.js: escape `<` | https://nextjs.org/docs/app/guides/json-ld | P |
| Meta Conversions API best practices (event_id, dedup) | https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices | P ($ platform) |
| FTC rule on fake reviews (benchmark) | https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials | P |
| Argentina Disposición 954/2025 (Botón de arrepentimiento) | https://www.boletinoficial.gob.ar/detalleAviso/primera/330827/20250904 ; https://allende.com/administrativo/el-gobierno-refuerza-la-proteccion-al-consumidor-en-el-comercio-electronico-09-05-2025/ | P (law firm) |
| Chile Ley 19.496 art. 3 bis b and exclusions | https://www.bcn.cl/leychile/navegar?idNorma=1160403 ; https://www.carey.cl/api/archivo/publican-reglamento-que-establece-exclusiones-al-derecho-de-retracto?lang=es | P / S |
| Chile Ley 21.719 from 2026-12-01 and the postponement bill | https://www.diarioconstitucional.cl/2026/06/12/la-ley-21-719-entra-en-vigor-el-1-de-diciembre-y-expone-vacios-en-regulacion-de-pequenas-empresas/ ; https://www.garrigues.com/es_ES/noticia/chile-ejecutivo-presenta-proyecto-postergar-entrada-vigor-nueva-ley-proteccion-datos.md | S |
| Mexico new LFPDPPP (21 March 2025) | https://www.ey.com/es_mx/technical/tax/boletines-fiscales/nueva-ley-federal-proteccion-datos-personal-posesion-particulares ; https://iapp.org/news/a/entendiendo-la-ley-federal-de-protecci-n-de-datos-personales-en-posesi-n-de-los-particulares-en-mexico | S |
| Hotmart: guarantee periods, order bump, internationalization, Argentina notice | https://help.hotmart.com/es/article/360034552751/ ; https://suportehotmart.zendesk.com/hc/en-us/articles/360019967392 ; https://hotmart.com/mx/herramientas/internacionalizacion ; https://suportehotmart.zendesk.com/hc/en-us/articles/15325356406925 | S ($ platform) |
| Moffatt v. Air Canada (company liable for chatbot statement) | https://www.americanbar.org/groups/business_law/resources/business-law-today/2024-february/bc-tribunal-confirms-companies-remain-liable-information-provided-ai-chatbot/ | S |
| Plausible data policy (cookieless claims) | https://plausible.io/data-policy | P ($ vendor) |
| Dark mode evidence (NN/g and 2025 review), design tokens, WCAG 2.2 | see `research/06-ui-ux-design.md` sources | see note |
| Dependabot multi-ecosystem groups and cooldown | https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference | P |
| Next.js `output` modes | https://nextjs.org/docs/app/api-reference/config/next-config-js/output | P |

## Repo evidence (not external)

`docs/deployment.md`, `docs/architecture.md`, `docs/tracking.md`, `docs/legal-checklist.md`, `docs/performance.md`, `docs/design-system.md`, `ADR-0001..0009`, `config/*`, `.github/workflows/*` at `origin/develop` `cbf519c`; measured files under `audit/`.

## Unverified items carried forward

Hotmart per-country payment methods and bump behaviour; Chile digital-content retracto exclusion; Mexico withdrawal rights for downloads; exact new date of Ley 21.719; FAQ rich-result removal date; GSAP licence text; Stryker with TypeScript 7; per-route CSP hashes with Next static output; cause of the live 4-hour `/_next/static` cache; dependency health and licence cells marked "M1 script" in `dependencies.md`.

## Added 2026-11-09 (owner fact: Spain and the EU are possible markets)

| Claim | Source | Flag |
|---|---|---|
| GDPR and ePrivacy prior consent; AEPD cookie criteria; LSSI art. 22.2 | cited in the repo's `docs/tracking.md` and `docs/legal-checklist.md`; not re-fetched | S |
| Directive 2011/83/EU art. 9 and 16 m; RDL 1/2007 arts. 102-104 | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:02011L0083-20220528 ; https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555 (listed in the repo checklist) | P (not re-read here) |
| European Accessibility Act, Directive (EU) 2019/882, microenterprise exemption, application from 2025-06-28 | https://eur-lex.europa.eu/eli/dir/2019/882/oj | from knowledge, not opened this session: verify |
| GDPR art. 27 representative for controllers outside the EU | https://eur-lex.europa.eu/eli/reg/2016/679/oj | from knowledge, not opened this session: verify |
