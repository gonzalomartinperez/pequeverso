# 07 - CRO, trust, discoverability, analytics and legal for digital-product landing pages (2026)

Date: 2026-11-09. Scope: pequeverso.com (LATAM-Spanish printable phonics/grafismo kit, Hotmart checkout, affiliate baby-food guide, consent-gated Meta Pixel + CAPI, dormant RAG shopping assistant, organic social via Metricool) and the AI-engineer portfolio.

Method and honesty note. Web search was cut off by the session budget partway through, so some topics (Meta consent/LDU, GA4 server-side, NN/g and CXL primaries, Hotmart per-country payment tables, Chile digital-content exclusions) rest on a single secondary source or on none and are flagged. Primary sources I actually opened are marked **[P]**; search-snippet-only sources are **[S]**; **[$]** = commercial interest in the claim. Legal items are research notes, not legal advice.

---

## 1. Bottom line (read this first)

1. For a single-price infoproduct at low traffic, the biggest levers are (a) a fast, accessible, honest page, (b) a frictionless handoff to the Hotmart checkout with price, currency and guarantee stated before the click, and (c) correct measurement. Most "CRO tricks" will not reach statistical significance at your volume; qualitative review plus large, bold changes beat micro-tests (sec. 8).
2. Do not fabricate testimonials, counts or urgency. Beyond ethics, the FTC's 2024 rule (US) now makes fake and AI-generated reviews civilly penalizable [P: ftc.gov], Argentina/Chile/Mexico consumer law treats misleading advertising as a violation (sec. 10), and Meta can restrict ad accounts. Honest substitutes exist (sec. 4).
3. Keep the shopping assistant disabled until it has an eval set, a "not a human" disclosure, a human/WhatsApp-or-email handoff, and no ability to quote prices/refund terms that are not read from the same source as the page. The best randomized evidence (Management Science field experiments) shows gains mainly for pre-sale questions; Amazon's headline numbers are unverified and selection-biased (sec. 6).
4. llms.txt and "AI schema" are not worth engineering time for Google (Google says neither helps nor harms). Normal SEO, indexable crawlable HTML, Product/Offer JSON-LD, and genuinely original content are what feed AI Overviews/AI Mode (sec. 7).
5. Analytics: run a cookieless counter (Plausible or self-hosted Umami) for truth about traffic, and keep Meta Pixel/CAPI consent-gated only for ads. Fix the biggest measurement hole: Hotmart is a different origin, so purchase attribution needs deliberate plumbing (sec. 9).

---

## 2. LATAM infoproduct CRO and Hotmart specifics

**What Hotmart actually gives you (facts)**

- Guarantee window is chosen per product: 7, 15, 21 or 30 days; in Europe the legal minimum is 15 days. Inside the guarantee the producer cannot block the refund, and there is a hold (typically ~5 days) where you can try to retain the buyer. [S: Hotmart help, refund/guarantee articles]
- Order bump: configured in the Checkout Builder; accepted payment methods for bump purchases are card, Hotmart balance, boleto, PIX, PayPal, two cards (not Colombia); "Online Services" products cannot be bumps; bump transactions are processed separately from the main offer. [P: Hotmart order-bump help]
- Payment-method restrictions found in search (verify in your own Hotmart panel, because help pages differ by language): Mercado Pago, OXXO hybrid (card + OXXO) and SPEI are reported as not available on order-bump/bundle/funnel offers. Implication: if your buyers lean on OXXO or SPEI, a bump may silently hide those methods or be unavailable to them. Test the exact checkout in MX. [S: Hotmart help via search summary]
- Argentina: Hotmart stated it stopped processing payments with local partners in Argentina from 28 April 2023 (Mercado Pago, Pago Facil, etc. removed). Argentine buyers therefore likely pay via international card flows; re-check the current state before promising Argentine payment methods. [S: Hotmart support notice]
- Currency: Hotmart advertises 22 local currencies, 44+ payment methods (OXXO for Mexico is named), 9 checkout languages, automatic conversion with payout in the producer's currency; it claims buyers seeing local price/language/method are "up to 70% more likely to buy". The 70% has no method or source. [P: Hotmart internationalization page; $]
- Pixel/CAPI: Hotmart has its own pixel integration and a CAPI section for Hotmart Pages; I found no official doc on sending purchase events for an external site. A community approach is the Hotmart webhook (approved sale) -> server -> Meta CAPI with a transaction ID for dedupe. [S: Hotmart help; $ viniensina blog]

**General evidence for checkout friction (not Hotmart-specific)**

- Baymard's meta-analysis: average abandonment 70.22% over 50 studies (2006-2025). Reasons among non-browsers: extra costs 40%, slow delivery 20%, distrust of card handling 19%, forced account 18%, long/complicated checkout 17%, site errors 17%, unsatisfactory returns policy 13%, total cost not visible 12%, card declined 10%, too few payment methods 9%. [P: baymard.com/lists/cart-abandonment-rate]
- For a digital kit there is no shipping, so the "extra cost" risk maps to currency conversion/foreign-card fees/taxes shown late on the checkout. State the price in the buyer's currency on the landing page when possible (use Hotmart's displayed local price; do not hardcode FX that drifts).
- Local-currency presentment: Stripe reports a ~4.7% conversion lift in a 1.5M-session subscription test and "76% choose local currency when offered"; figures were garbled across pages and come from the vendor. Direction is plausible, magnitude is not transferable. [S; $ Stripe]
- Vendor advice to show 3-5 methods ordered by local friction (Mercado Pago/Pix high, cash vouchers lower) is reasonable but vendor-sourced. [S; $ Antom, PayRetailers]

**Playbook consequences:** one primary CTA that names the price and the Hotmart handoff ("Pagarás en Hotmart, seguro y con garantía de X días"), no account creation, mobile-first, the guarantee in the CTA zone, minimal links leaving the page, order bump only if it is a true complement (one bump; clutter causes decision fatigue per vendor guides) and only after confirming it does not remove OXXO/SPEI for MX buyers.

---

## 3. Landing page structure and value proposition

What converts for a parent buying a printable kit (synthesis of Baymard/CXL-style practice, with judgment; I could not retrieve NN/g or CXL primaries):

1. Above the fold: who/what/age in one sentence ("Kit imprimible de fonética y grafismo para niños de 3 a 7 años"), real photo or screenshot of the actual sheets, price, CTA, guarantee line.
2. "What is inside", concretely: number of pages, letters/sounds covered, sample pages (download a free sample sheet: lowest-risk trust device and an email capture).
3. How it works in 3 steps (buy, download PDF instantly, print and use) with file format and printing notes (A4/Carta, B&W-friendly) to remove digital-product uncertainty.
4. Age/level fit and pedagogy: what method, who made it, what a typical week looks like. Avoid unverifiable outcome claims ("tu hijo leerá en 30 días").
5. Objection handling: printing cost, screen-free, does it fit the child's level, refund. A short FAQ is good UX even though Google no longer shows FAQ rich results.
6. Proof (see sec. 4), then a repeated CTA, then legal footer (terms, privacy, contact, withdrawal info).

Mobile: most LATAM traffic from Instagram/TikTok/Facebook is in-app browser traffic; test on a mid-range Android, over throttled 4G, inside the Instagram in-app browser.

---

## 4. Trust signals without fabricated testimonials

- Honest substitutes: free sample pages; real photos of printed sheets in use by identified-by-first-name consenting parents (with written permission); named author and method; transparent contact (email/WhatsApp), legal entity data, refund terms in plain language; secure-checkout statement naming Hotmart; "last updated" date; response-time promise.
- Early stage with no buyers: say so ("lanzamiento: sé de las primeras familias"), offer the guarantee, show process content. A small amount of real proof beats a large amount of generic proof. Baymard's data shows distrust with card handling is a top-5 abandonment reason (19%), so surface the Hotmart payment security and guarantee near the CTA. [P]
- Do not use stock "parents" with fake names, invented review counts, fake countdowns or "quedan 3". The FTC rule bans fake/AI-generated reviews, undisclosed insider reviews, review suppression and fake social indicators; it is US law but it is the clearest benchmark and Meta/Google policies point the same way. [P: FTC]
- Stat claims to treat skeptically: "testimonials lift conversion 34%" (VWO/WikiJobs, original not found), "90% assume testimonials are fake" (untraceable), NN/g "faces 3x gaze" (unverified). [S; $ blogs]

---

## 5. Performance, CWV and INP as conversion factors

- Thresholds (75th percentile, per device): LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1. [P: web.dev/articles/vitals]
- Evidence quality is mixed. Vodafone's controlled A/B (identical pages): 31% better LCP -> +8% sales, +15% lead-to-visit. [P: web.dev] Fotocasa: INP work plus other initiatives coincided with +27% in contact leads; INP is not isolated and the 27% is not a conversion rate. [P: web.dev, 2025-10-14] I found no rigorous study isolating INP's causal effect on conversion; ignore "INP over 200 ms cuts conversion 23%" style claims. [S; $]
- Practical: static Next.js on Hostinger is a good base. Risks are third-party weight (Pixel, widgets, the assistant), unoptimized hero images, web fonts causing CLS, and hydration jank on low-end Android. Lazy-load the assistant on interaction, not on page load; ship it only to routes that need it; gate the Pixel on consent and load it after interaction/idle.
- Measure with CrUX/PageSpeed field data once traffic allows and with lab runs on throttled mobile otherwise (low traffic means CrUX may be empty).

---

## 6. Conversational shopping assistants

**Evidence**

- Randomized field experiments in online retail (Fang, Yuan, Zhang, Donati, Sarvary; Management Science) found a GenAI pre-sale chatbot raised sales ~16.3% and conversion ~21.7% per a Columbia Business School summary, with larger gains for less experienced shoppers; the appendix says GenAI chatbot service matched human quality but did not beat it. I could not verify the numbers against the paper. [S: business.columbia.edu; INFORMS supplement]
- Amazon Rufus: Amazon claims ~$12B incremental annualized sales for 2025 and 60% higher purchase likelihood for engagers, using a seven-day downstream attribution window; independent commentary flags selection bias (heavy shoppers use it more) and no outside measurement is possible. Treat as marketing, not as an effect size you will get. The "20-35% lift from Rufus optimization" has no primary source. [S: ppc.land, myamazonguy]
- Baymard (n=2,273 US shoppers, 2026): people prefer AI for feature comparison (63%), stock check (59%), recommendations (56%), but ~2/3 prefer a human for damaged/late/billing problems (66-69%). Recommendation: put the bot in pre-sale discovery and keep humans reachable; avoid forced bot loops. [P: baymard.com]
- Vendor surveys (Clutch: 80% frustrated by at least one website AI tool) and vendor studies (Alby: standard chatbots rarely drive sales) are directional only. [S; $]

**Risks and guardrails for the RAG assistant**

- Liability: in Moffatt v. Air Canada (BC CRT, Feb 2024) the company was held liable for the chatbot's wrong policy statement and the "separate legal entity" defense was rejected. Your bot must not state refund/guarantee/price terms from model memory. [S: ABA Business Law Today, McCarthy]
- Disclosure: label it as an AI assistant at first message. The EU AI Act Art. 50(1) chatbot disclosure reportedly applies from 2 Aug 2026 and was not delayed by the Digital Omnibus (only Art. 50(2) marking moved to 2 Dec 2026) per law-firm commentary; the omnibus citation (Reg. 2026/1744) came from one secondary source, verify before citing. It matters only if you serve EU users; as a design norm it is cheap. [S: Goodwin, Ropes & Gray, Jones Walker]
- Child-directed context: the product is for children but the buyer is the adult. Do not let the assistant talk to children, collect child data, or give developmental/medical advice (the affiliate baby-food guide is higher risk: no nutrition/allergy advice, link to professional guidance).
- Read-only is correct. Add: retrieval-only answers with citations to your own pages, refusal when retrieval confidence is low, rate limiting, prompt-injection filtering of retrieved text, no PII storage, conversation logging only with consent, and a fixed canned answer for guarantee/payment questions.
- Measurement before activation: define success as assisted-session conversion vs. non-assisted, but assume selection bias (the Rufus problem). Only a holdout (assistant shown to a random 50%) gives causal evidence; at your traffic it will take long, so also track resolution rate, handoff rate and wrong-answer rate from a labeled sample.

---

## 7. SEO for a static Next.js site in 2026

- AI features: Google's official AI-optimization guide (May 2026) says AI Overviews/AI Mode build on core ranking; no special files or markup needed; "structured data isn't required for generative AI search" but still helps eligibility for rich results; llms.txt "will neither harm nor help" Search visibility; no need to chunk content; unique, first-hand content is the lever. [P: developers.google.com/search/docs/fundamentals/ai-optimization-guide]
- llms.txt: no W3C/IETF standard; adoption is small and AI crawlers rarely request it (one log study: 84 of 62,100 AI-bot requests; another: 97% of files get zero AI requests); Chrome Lighthouse added an experimental agentic-browsing audit that checks for it. Cost is low (one static file) but expect no ranking effect. Next.js's own docs publish /docs/llms.txt, which shows it is cheap, not that it is proven. [S: SEO vendor blogs, ppc.land; $ some]
- Zero-click reality: Pew (900 US adults, 68,879 searches, March 2025) found users clicked a result in 8% of visits with an AI summary vs 15% without; links inside the summary 1%; sessions ended 26% vs 16%. Google disputes it; Ahrefs reports ~34.5% CTR reductions for top pages, via secondary reporting. Implication: informational queries yield fewer clicks, so own the brand/commercial queries, video and social discovery. [P: Pew; S: Ahrefs via ppc.land]
- Structured data worth adding: `Product` + `Offer` (price, priceCurrency, availability, url; for a digital good set no shipping), `Organization`, `WebSite`, `BreadcrumbList`. Use `AggregateRating`/`Review` only for genuine, visible, first-party reviews (Google spam/FTC risk otherwise). Merchant-listing rules: name, image, offers with price+currency are the minimum; July 2026 coverage adds sale-price date ranges and `Product.category`. [S: techwyse, seroundtable; verify in Google docs]
- FAQ: Google limited FAQ rich results to government/health in Aug 2023 [P: Google blog] and reportedly removed them entirely in May 2026 [S: SEJ and others, unverified]. Keep an on-page FAQ for users; skip FAQPage markup as an SEO tactic (harmless, no visible effect per Google).
- Next.js mechanics: static `metadata` export / `generateMetadata`; `app/sitemap.ts` or a static sitemap; JSON-LD as a plain `<script type="application/ld+json">`, with `<` escaped to `<` (Next docs warn JSON.stringify is not XSS-safe); `schema-dts` for types. [P: nextjs.org/docs/app/guides/json-ld]
- Language targeting: `<html lang="es">` plus `es-419`/country hreflang only if you ship multiple country variants; for one neutral-LATAM page a single `lang="es"` canonical is simpler. I found no authoritative source on es-419 handling; use Google's international docs. [uncertain]
- Also: Search Console + Bing Webmaster Tools, self-canonical URLs, fast TTFB, descriptive alt text on sample images, original content per query cluster (e.g., "fichas de grafismo para 4 años", "método fonético imprimible"), and video/short embeds as secondary discovery.
- Hostinger static deploy: keep `build-info.json` check; ensure trailing-slash and redirect behavior is consistent to avoid duplicate URLs.

---

## 8. A/B testing for low-traffic sites

- Fixed-horizon null-hypothesis tests are a poor fit for a few hundred visitors/month; sources converge on: test big, bold changes; fewer variants; use micro-conversions (CTA click, scroll to pricing, sample download, checkout-open) as proxies; count sessions carefully; accept lower confidence thresholds only for reversible decisions; use sequential/Bayesian reads or bandits for allocation; complement with qualitative research (5-8 moderated or unmoderated sessions, session recordings, user interviews). [S: CXL, Portent, Convert, Optimizely, EZBot; $ vendors]
- Contested: some practitioners say A/B testing under ~1-2k conversions/month is not worth it; others (Optimizely, Convert, CRE) say choose tests strategically. Both agree that heuristic review plus usability tests come first.
- Practical regime for pequeverso: (1) ship evidence-based best practices without testing (guarantee next to CTA, sample download, price visible); (2) sequential before/after with annotations, controlling for traffic-source mix (social campaigns distort); (3) one major split at a time through UTM-tagged separate URLs or server-side bucketing, measuring checkout-open rate per variant rather than sales.
- Traffic quality dominates: a Meta ad vs organic IG bio link vs YouTube traffic have wildly different intent; segment by source before comparing.

---

## 9. Analytics, privacy and Meta CAPI

**Choosing a stack**

- Plausible: no cookies, no persistent identifiers, daily-salted hash of site+IP+UA, no cookie-banner claim; self-host or ~USD 9/mo cloud. [P: plausible.io/data-policy; $ vendor claim "no banner needed"]. Umami: cookieless and self-hostable, free OSS. Both lack funnel depth, session replay and BigQuery export compared with GA4. [S; $ comparison blogs]
- GA4 + Consent Mode v2 is needed only if you run Google Ads conversion modeling; consent-gated GA4 undercounts (vendor claims of 30-60% more traffic seen by cookieless tools are non-independent). Legal status of GA4 in the EU remains contested (single unverified Dutch fine anecdote). [S; $]
- Whether a "no banner" analytics tool is legal depends on the jurisdiction and configuration (e.g., IP handling and event properties). LATAM regimes do not copy the EU ePrivacy cookie rule, but notice and purpose limitation under local data laws still apply (sec. 10). Get local advice.

**Meta Pixel + CAPI best practices (primary)** [P: developers.facebook.com best practices]

- Send server events in real time or near real time; include `event_id` and `external_id` on every event; pixel `eventID` must equal CAPI `event_id` and event names must match for deduplication; `action_source` required on all events; `event_source_url` and `client_user_agent` required for website events; refresh `fbp`/`fbc`; hash user data yourself if not using the SDK; only matched events count for attribution/optimization; more customer parameters (email, phone, IP, UA) raise Event Match Quality (EMQ scored /10, so target the Events Manager "good" range rather than a vendor's arbitrary 8).
- Consent: the best-practices page does not cover consent. Keep your current rule: no Pixel and no CAPI user-data events until consent; if you send CAPI without user data, treat it as still processing and gate it too. I could not retrieve Meta's Limited Data Use guidance for LATAM (budget cut); verify. [uncertain]
- The Hotmart gap: the Purchase happens on Hotmart's domain. Options ranked by feasibility: (a) use Hotmart's native pixel integration for InitiateCheckout/Purchase (limited controls; consent handling is Hotmart's); (b) webhook on approved purchase -> your small server -> CAPI Purchase with `event_id` = Hotmart transaction id and hashed email, only for buyers who consented at purchase time (a consent record at checkout is hard to prove; this is the main compliance risk); (c) track upstream proxies (ViewContent, outbound click to checkout) with the Pixel and optimize ad campaigns on those if purchase volume is too low for learning (Meta needs volume; at tiny sales counts optimize for Landing page view/Initiate Checkout). Pass UTMs via Hotmart's `src`/`sck` parameters (verify names in Hotmart docs) to attribute organic platform source.

---

## 10. Legal: consumer protection for digital goods, minors, privacy (AR/MX/CL)

All items are research notes; verify with counsel before launch.

**Argentina**

- "Botón de arrepentimiento": Res. 424/2020 required a prominent, registration-free link on the homepage, with a revocation code within 24h; the text I opened appeared in force, but Allende reports Disposicion 954/2025 (Boletin Oficial 4 Sept 2025) replaced Res. 316/2018 and 424/2020: visible link on the first page, exemptions (perishables, resale/production use, product already used), a service cancellation button, minimum support hours, and visible contact channel. Action: implement the revocation link and visible contact on the site regardless, and confirm how digital-content "already used/downloaded" is treated. [P: argentina.gob.ar; P: Allende; the 10-day period itself was not verified in these results]
- Minors/ads: current protection rests on Law 25.326, Law 26.061 and the Civil and Commercial Code (minors under 18, adolescents from 13). Bills (2025-26) would ban personalized ads based on data of under-14s / targeted ads to under-16s; status unverified. Your audience for ads is parents, not kids. [S: HCDN bills, microjuris]
- Payments: see Hotmart Argentina note in sec. 2.

**Mexico**

- LFPC Art. 76 Bis reform on digital subscriptions in force 13 Dec 2025 (affects auto-renewal/cancellation, not one-time kits). Proposals for total-price-upfront and 60-day price history are pending, not law. [S: GTLaw, El Imparcial, Chamber of Deputies tables]
- New LFPDPPP published 20 Mar 2025, in force 21 Mar 2025; privacy notice (aviso de privacidad) content requirements changed (Art. 15), re-consent for new purposes (Art. 11); the authority moved from INAI to the anticorruption secretariat; IAPP reports the new law does not add special minors rules. Action: privacy notice in Spanish, separating purposes needing consent (marketing/ads) from necessary ones. [S: EY, Garrigues, IAPP]
- Mexican withdrawal rights for digital goods: not found; verify.

**Chile**

- Art. 3 bis of Law 19.496 (as amended by Law 21.398) gives a 10-day retracto for distance contracts; a 2024 regulation lists exclusions (goods that cannot be returned/lose functionality in under 10 days; services can be excluded if clearly and prominently stated). Whether downloadable digital content falls under an exclusion was not confirmed. Safest practice: state your policy clearly pre-purchase and keep the Hotmart guarantee at least 10 days (use 15) for Chilean buyers. [S: Carey, Cariola, T13]
- Law 21.719 (data protection) is scheduled for 1 Dec 2026; the executive's bill to postpone it to 2027 passed first reading in the Senate on 28 Oct 2026, per Garrigues; sources disagree on the new date; until enacted, 1 Dec 2026 stands. It treats minors' data as special; details not verified. [S: Garrigues, Diario Constitucional]

**Children-related marketing (cross-cutting)**

- CARU (US self-regulation, a useful norm): ads must be recognizable as ads, no manipulative or sales-pressure tactics ("buy it now" urgency), do not urge children to ask parents to buy. It applies to under-13 directed ads; keep creative parent-addressed, no kid-voice calls to action. [S: BBB National Programs]
- Meta limits teen targeting to age and location and restricts categories; keep the audience adult parents; never upload or target using children's data; avoid showing identifiable children in creative without documented parental consent. [S: Search Engine Land]
- Affiliate guide: disclose affiliate links clearly at the point of the link (consumer-law baseline across the three countries; also an FTC-style endorsement norm); no health claims about infant nutrition.

**Accessibility as conversion and risk**

- WebAIM Million: 94.8% of homepages had WCAG failures (2025); 95.9% in Feb 2026; low contrast is the most common (79.1% in 2025). [S: via testparty $]
- Business-case numbers (accessible sites "+15% sales", "144-289% ROI") are vendor claims without primary sources; treat as unproven. Litigation exposure is concentrated in US/EU; no LATAM-specific data found. Still, accessibility overlaps with mobile usability and SEO: contrast, text alternatives, focus states, 44px targets, readable Spanish, captions on video, `prefers-reduced-motion` respected. [S; $]

---

## CRO playbook for pequeverso (prioritized checklist)

**P0 - before spending on traffic**

1. Verify the real Hotmart checkout in MX, CL, CO, PE and AR on a phone: price/currency shown, payment methods present (OXXO/SPEI/Mercado Pago/card), any bump not hiding methods, language correct.
2. Put price, "pagas en Hotmart", format/instant delivery and guarantee length (>= 15 days if Chile is a market) in the CTA block; link terms and refund policy.
3. Add the legal minimum: contact info, privacy notice (Spanish, purposes separated), terms, withdrawal/guarantee statement, and an Argentina-style revocation link on the first page.
4. Remove or replace any unverifiable proof (invented testimonials, counters, urgency). Use samples, real photos, named author/method.
5. Hotmart-to-Meta measurement plan decided and documented (native pixel vs webhook CAPI; consent basis; UTMs via `src`/`sck`).
6. Core Web Vitals check on throttled mobile and inside the Instagram in-app browser; fix LCP image, CLS from fonts, third-party weight.

**P1 - first month**
7. Free sample sheet (PDF) with email opt-in (explicit consent, purpose stated) and a post-purchase follow-up.
8. Product + Offer + Organization + BreadcrumbList JSON-LD (escaped), sitemap, Search Console, Bing; page copy written for the real queries.
9. Cookieless analytics (Plausible/Umami) with custom events: cta_click, checkout_open (outbound to Hotmart), sample_download, faq_open, scroll_75.
10. Qualitative research: 5 parent sessions (Meta ad audience or your own network), watch recordings if available; fix the top 3 friction points.
11. Accessibility pass: contrast >= 4.5:1, keyboard focus, labels, alt text, captions, reduced-motion.
12. Single bump experiment only if it complements the kit; measure bump take rate and refund rate; verify it does not break local payment methods.

**P2 - after traction**
13. One bold A/B (headline + hero + CTA wording as a bundle) via separate UTM URLs; judge on checkout_open and purchases over >= 4 weeks.
14. Assistant activation gate: eval set (guarantee, price, contents, age fit, refusal), AI label, human handoff, no price/refund from model memory, lazy-loaded, holdout measurement plan.
15. Review mining: ask real buyers for permission-based testimonials after delivery; add `Review` markup only for visible first-party reviews.
16. Content for discovery: how-to-teach posts, printable guides, YouTube/short embeds; track brand-search growth.
17. llms.txt: optional, 30 minutes, expect nothing.

**Do not do:** fake scarcity, kid-voice CTAs, interest/behavioral targeting using minors' data, GA4 pre-consent, assistant answering medical/nutrition questions, hardcoded exchange rates, FAQPage markup as an SEO plan.

---

## Portfolio conversion notes (AI engineer; "conversion" = recruiter contact)

Evidence here is weak (no rigorous survey found); treat as practitioner consensus.

- Recruiters/hiring managers scan quickly; one source cites a ~30 s first look at pinned repos, unverified. Make the first screen state role, stack and what you built in one sentence, plus one live demo link and one contact action (email/LinkedIn), repeated at the end. [S: Artech, theaimarketpulse; $ staffing blogs]
- Live deployed work with reasoning, trade-offs and evals beats tutorial-style projects; "has an eval suite" is claimed as a top signal in 2026 (source not found). For the RAG assistant, show an eval table, failure analysis and cost/latency numbers rather than screenshots. [S: aitechconnect, myengineeringpath, Profy.dev via soychristian: 65% would definitely review a portfolio if the candidate lacks experience, 93% probably]
- GitHub is often opened to confirm the resume: pin 3-4 relevant repos with READMEs (problem, architecture, results, how to run).
- Measure with the same cookieless stack: events for contact click, resume download, demo open, GitHub click; segment by referrer (LinkedIn vs search). Low traffic means qualitative feedback from 3-5 recruiters beats tests.
- Same technical hygiene: CWV, accessibility, `prefers-reduced-motion` for any animation, Person/WebSite JSON-LD, clear title and meta descriptions in the language of the target market.

---

## Contested / uncertain

- Size of CRO effects from vendors (Hotmart "+70%", Stripe 4.7%, Rufus 60%/$12B, a11y "+15% sales", testimonials "+34%") are all vendor/marketing claims; only the Management Science experiments and the Vodafone A/B are controlled, and even those were read via summaries (Columbia) or one case page (web.dev).
- INP causality: no isolating study; Fotocasa's +27% bundles several initiatives.
- Whether structured data helps AI citations: Google says no special effect; SEO vendors say yes; no neutral measurement found. FAQ rich-result removal date (May 2026) and Search Console tool removals not verified in a primary source.
- llms.txt: Google says no effect for Search; some agent/browsers and Lighthouse audit it; evidence of any crawler benefit is thin.
- GA4 legality in the EU and whether cookieless tools are consent-free in each LATAM jurisdiction: contested; no regulator statement retrieved.
- Hotmart payment-method restrictions on bumps/bundles and Argentina processing status: from help pages that differ by language/date; verify live.
- Chile digital-content retracto exclusion, Mexico withdrawal rights for downloads, Argentina's exact revocation period under Disposicion 954/2025: not verified.
- Chile Law 21.719 effective date (1 Dec 2026 vs postponed to 2027) is moving.
- EU AI Act Art. 50 timing and Omnibus details: single-source law-firm commentary; relevance only for EU users.
- Pew vs Google on AI Overview click-through; magnitude varies by query type.
- Portfolio hiring stats: unsourced blogs.

---

## Sources

Primary or near-primary [P]:

1. Baymard, Cart abandonment rate statistics - https://baymard.com/lists/cart-abandonment-rate [P]
2. Baymard, AI engagement quantitative UX insights 2026 - https://baymard.com/research-articles/ai-engagement-quantitative-ux-insights-2026 [P]
3. web.dev, Core Web Vitals - https://web.dev/articles/vitals [P]
4. web.dev, Fotocasa INP case - https://web.dev/case-studies/fotocasa-cwv [P]
5. web.dev, Vodafone LCP A/B case - https://web.dev/case-studies/vodafone [P]
6. Google Search Central, AI optimization guide - https://developers.google.com/search/docs/fundamentals/ai-optimization-guide [P]
7. Google Search Central blog, HowTo/FAQ changes 2023 - https://developers.google.com/search/blog/2023/08/howto-faq-changes [P]
8. Next.js, JSON-LD guide - https://nextjs.org/docs/app/guides/json-ld [P]
9. Meta, Conversions API best practices - https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices [P]
10. Meta, Deduplicate pixel and server events - https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events [S]
11. Pew Research, AI summaries and clicks (22 Jul 2025) - https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/ [P]
12. FTC, Final rule banning fake reviews and testimonials - https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials [P]
13. Hotmart help, Order Bump - https://suportehotmart.zendesk.com/hc/en-us/articles/360019967392-What-is-Order-Bump-and-how-do-I-set-it-up [P; $ platform]
14. Hotmart, Internacionalizacion (MX) - https://hotmart.com/mx/herramientas/internacionalizacion [P; $]
15. Hotmart help, payment methods - https://help.hotmart.com/en/article/25588460435085/ [S; $]
16. Hotmart help, adjust guarantee period - https://help.hotmart.com/es/article/360034552751/-como-ajustar-el-plazo-de-garantia-del-producto-que-he-creado- [S; $]
17. Hotmart help, refund of a purchase - https://help.hotmart.com/es/article/-como-solicitar-el-reembolso-de-mi-compra-/360061973392 [S; $]
18. Hotmart help, Facebook pixel - https://suportehotmart.zendesk.com/hc/en-us/articles/115004826368-How-to-set-up-the-Facebook-pixel [P; $]
19. Hotmart help, Facebook features in Hotmart Pages (CAPI) - https://help.hotmart.com/en/article/43410346545165/how-to-integrate-facebook-features-into-my-hotmart-pages- [S; $]
20. Hotmart help, new rules for selling in Argentina - https://suportehotmart.zendesk.com/hc/en-us/articles/15325356406925-Learn-more-about-the-new-rules-for-selling-in-Argentina [S; $]
21. Plausible data policy - https://plausible.io/data-policy [P; $]
22. Argentina, Resolucion 424/2020 - https://www.argentina.gob.ar/normativa/nacional/norma-342869/texto [P]
23. Allende & Brea, Disposicion 954/2025 - https://allende.com/administrativo/el-gobierno-refuerza-la-proteccion-al-consumidor-en-el-comercio-electronico-09-05-2025/ [P; law firm]

Secondary [S]:
24. Columbia Business School, AI supercharging online retail - https://business.columbia.edu/insights/digital-future/ai-supercharging-online-retail
25. Fang et al., Management Science supplement - https://pubsonline.informs.org/doi/suppl/10.1287/mnsc.2026.00623/suppl_file/mnsc.2026.00623.sm1.pdf
26. ppc.land, Rufus $12B - https://ppc.land/amazons-ai-shopping-assistant-drove-12-billion-in-sales-for-2025/
27. MyAmazonGuy, Rufus - https://myamazonguy.com/news/amazon-rufus-ai-updates/
28. Alby, AI shopping experiences with 15M consumers - https://alby.com/?p=924 [$]
29. Clutch, AI tools for ecommerce - https://clutch.co/resources/ai-tools-for-ecommerce-reshaping-online-shopping [$]
30. MeasuringU, UX of AI chat 2025 - https://measuringu.com/ai-based-chat-software-ux-2025/
31. ABA Business Law Today, Moffatt v Air Canada - https://www.americanbar.org/groups/business_law/resources/business-law-today/2024-february/bc-tribunal-confirms-companies-remain-liable-information-provided-ai-chatbot/
32. McCarthy Tetrault, Moffatt - https://www.mccarthy.ca/en/insights/blogs/techlex/moffatt-v-air-canada-misrepresentation-ai-chatbot
33. Goodwin, EU AI Act transparency in force - https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force
34. Ropes & Gray, AI Act transparency - https://www.ropesgray.com/en/insights/viewpoints/2026/08/102nfqm/you-talkin-to-me-operationalising-the-eu-ai-acts-transparency-obligations
35. TechWyse, Google llms.txt June 2026 - https://www.techwyse.com/news/ai-search/google-llms-txt-no-ranking-benefit-june-2026 [$ SEO agency]
36. ppc.land, llms.txt adoption - https://ppc.land/llms-txt-adoption-rises-8-8x-but-97-of-files-get-zero-ai-requests/
37. Search Engine Journal, FAQ rich results dropped - https://www.searchenginejournal.com/google-drops-faq-rich-results/574429/
38. Search Engine Roundtable, merchant listings - https://www.seroundtable.com/google-products-34084.html
39. Frase, Google AI guide analysis - https://frase.io/blog/google-ai-optimization-guide [$]
40. Improvado, GDPR analytics tools - https://improvado.io/blog/gdpr-compliant-analytics-tools [$]
41. Databuddy, GA alternatives - https://www.databuddy.cc/blog/best-open-source-google-analytics-alternatives-2026 [$]
42. CXL, A/B testing alternatives for low traffic - https://cxl.com/blog/ab-testing-alternatives [$]
43. Portent, low-traffic A/B - https://portent.com/blog/cro/how-you-can-run-a-b-tests-on-low-traffic-sites.htm [$]
44. Convert, low-traffic testing - https://www.convert.com/low-traffic-testing-guide/ [$]
45. Optimizely, low-traffic tests - https://support.optimizely.com/hc/en-us/articles/4410283325325 [$]
46. viniensina, Hotmart + n8n + CAPI - https://viniensina.com.br/n8n-hotmart-ga4-capi/ [$]
47. Stripe, Adaptive Pricing - https://stripe.com/blog/new-ways-to-turn-global-demand-into-revenue [$]
48. PayRetailers, LATAM payment conversion - https://www.payretailers.com/en/blog/strategies-boost-latam-payment-conversion [$]
49. Antom, checkout optimization - https://www.antom.com/merchant-playbook/checkout-optimization [$]
50. Carey (Chile), reglamento exclusiones retracto - https://www.carey.cl/api/archivo/publican-reglamento-que-establece-exclusiones-al-derecho-de-retracto?lang=es
51. Garrigues, Chile postpones Ley 21.719 - https://www.garrigues.com/es_ES/noticia/chile-ejecutivo-presenta-proyecto-postergar-entrada-vigor-nueva-ley-proteccion-datos.md
52. Diario Constitucional, Ley 21.719 - https://www.diarioconstitucional.cl/2026/06/12/la-ley-21-719-entra-en-vigor-el-1-de-diciembre-y-expone-vacios-en-regulacion-de-pequenas-empresas/
53. GTLaw, reformas LFPC (Mexico) - https://www.gtlaw.com/ar/insights/2025/12/reformas-a-la-ley-federal-de-proteccion-al-consumidor
54. El Imparcial, LFPC reform in force - https://www.elimparcial.com/mexico/2025/12/13/ya-esta-en-vigor-nueva-reforma-a-la-ley-federal-del-consumidor-te-protege-de-cobros-fantasma-en-plataformas-de-servicios-digitales/
55. EY Mexico, nueva LFPDPPP - https://www.ey.com/es_mx/technical/tax/boletines-fiscales/nueva-ley-federal-proteccion-datos-personal-posesion-particulares
56. IAPP, LFPDPPP en Mexico - https://iapp.org/news/a/entendiendo-la-ley-federal-de-protecci-n-de-datos-personales-en-posesi-n-de-los-particulares-en-mexico
57. Microjuris, ninos en entornos digitales (AR) - https://aldiaargentina.microjuris.com/2026/03/09/doctrina-ninos-ninas-y-adolescentes-en-entornos-digitales/
58. BBB National Programs, CARU guidelines - https://bbbprograms.org/programs/all-programs/children's-advertising-review-unit/Ad-Guidelines
59. Search Engine Land, Meta teen ad targeting limits - https://searchengineland.com/meta-introduces-new-ad-targeting-limits-for-teens-391259
60. TestParty, ecommerce accessibility statistics - https://testparty.ai/blog/ecommerce-accessibility-statistics-2025 [$]
61. Unbounce, trust in testimonials - https://unbounce.com/landing-pages/why-people-dont-trust-your-landing-page-testimonials/ [$]
62. Artech, tech portfolio that gets interviews - https://www.artech.com/blog/tech-portfolio-standout-get-interviews/ [$ staffing]
63. Profy.dev survey via soychristian guide - https://soychristian.pages.dev/contents/developer-portfolio-guide
64. Tie Talent / aitechconnect AI portfolio guides - https://aitechconnect-976.pages.dev/tips/ai-engineer-proof-of-work-portfolio [$]
