# Test Specification (TS)
## Project: Umaxica Apex Portal Site
### Aligns with IEEE 829 and ISO/IEC/IEEE 29119 (Test Documentation)

---

## 1. Introduction

### 1.1 Purpose
This document defines the test strategy, scope, environments, cases, and acceptance criteria for the Umaxica Apex Portal Site, based on the SRS, HLD, and DDS. It verifies correct behavior across apex and `www` domains for `.com`, `.org`, `.app`, `.dev`, and `.net`.

### 1.2 References
- Software Requirements Specification (SRS), v1.0  
- High-Level Design (HLD), v1.0  
- Detailed Design Specification (DDS), v1.0  
- Umaxica Engineering Standards (CI/CD, naming, security)  
- Tools: Playwright, Bun Test, Biome, Lighthouse CI, k6, OpenTelemetry

---

## 2. Test Scope

### 2.1 In Scope
- Edge routing/redirect logic (Hono on Vercel/Cloudflare Workers)
- Static asset delivery (`robots.txt`, `sitemap.xml`, `about.html`, etc.)
- Localization parameters (`lx`, `ri`, optional `tz`)
- Domain-specific behaviors and feature flags per TLD
- Security headers (HTTPS, CSP) at the edge
- Observability events (OpenTelemetry)
- CI/CD smoke checks after deployment

### 2.2 Out of Scope
- Rails backend content correctness (covered by service teams)
- Deep CDN vendor internals (Fastly/Vercel/Cloudflare SLA validation)
- Long-term reliability (monitored post-release)

---

## 3. Test Items (Traceability)

| SRS / DDS Topic | TS Coverage |
|---|---|
| SRS §4 Functional (redirect, static pages) | §§7.1–7.3 |
| SRS §5 NFR (perf, security, localization) | §§7.4–7.6 |
| DDS §3 Components (Router/Renderer/Redirect Controller) | §§7.1–7.3 |
| DDS §3.2 Domain matrix | §6 and all domain-tagged cases |
| DDS §8 Security (HTTPS, CSP, HSTS) | §7.5 |
| DDS §9 Testing design | Whole doc (tools/methods reflected) |
| Acceptance Criteria (Perf ≥ 90 Lighthouse) | §8.2 |

---

## 4. Test Approach

- **Automation-first**: Playwright (integration/e2e), Bun Test (unit), Biome (static), Lighthouse CI (web perf), k6 (redirect throughput), curl (smoke).
- **Domain-parameterized**: Single codebase of tests runs with domain matrix (.com/.org/.app/.dev/.net) and locale sets.
- **Shift-left security**: Header assertions in all smoke tests.
- **Observability-led**: Validate OpenTelemetry events emission for key flows.

---

## 5. Test Environment

| Env | Purpose | Base URLs |
|---|---|---|
| Staging | QA/integration | `https://staging.umaxica.dev`, `https://www.staging.umaxica.dev` |
| Production | Live verification | `https://umaxica.[com|org|app|dev|net]`, `https://www.umaxica.[com|org|app|dev|net]` |

**Tools/Versions**: Bun ≥ 1.3, Node 22 (if needed), Playwright latest, Biome latest, Lighthouse CI, k6.  
**Data/Config**: Use env-driven domain list; KV seeded with redirect rules from DDS.

---

## 6. Domain Behavior Matrix (from DDS §3.2)

| Aspect | .com | .org | .app | .dev | .net |
|---|---|---|---|---|---|
| Redirect base | `app.umaxica.com` | `org.umaxica.org` | Self-hosted SPA | staging app | Fastly/API passthrough |
| Static assets | robots/sitemap/about | policy/contact | manifest | staging-status | cache-info |
| Cache TTL | 1d | 6h | 2h | 5m | 1h |
| Telemetry tag | corp | org | app | dev | net |
| Flags | CSP_STRICT | HTTPS_ONLY | EDGE_REACT_ROUTER | DEBUG_MODE | FASTLY_RELAY |

All test cases include **domain tags** so they can be filtered per TLD.

---

## 7. Test Cases

> Notation:  
> **Pre** = Preconditions, **Steps** = Step list, **Exp** = Expected result, **Tags** include `domain:com|org|app|dev|net`, `type:functional|security|perf|l10n|obs`.

### 7.1 Routing & Redirects

**TC-RD-001 Apex root redirects (.com)**  
- **Pre**: KV contains default rule for `.com` → `https://app.umaxica.com/`  
- **Steps**: GET `https://umaxica.com`  
- **Exp**: 301/302 to `https://app.umaxica.com/` (no locale), Cache-Control present per TTL  
- **Tags**: domain:com, functional

**TC-RD-002 Locale redirect (.com)**  
- **Steps**: GET `https://umaxica.com/?lx=ja&ri=jp`  
- **Exp**: 302 to `https://app.umaxica.com/?lx=ja&ri=jp`  
- **Tags**: domain:com, l10n, functional

**TC-RD-003 Invalid locale fallback (all)**  
- **Steps**: GET `/?lx=zz&ri=zz` on each domain  
- **Exp**: 400 or fallback to default (`ja/jp`) per DDS policy; event logged  
- **Tags**: domain:all, l10n, error

**TC-RD-004 Staging mapping (.dev)**  
- **Steps**: GET `https://umaxica.dev/?lx=en&ri=us`  
- **Exp**: Redirect to **staging app** endpoint; `X-Debug-Locale: en-us` header present  
- **Tags**: domain:dev, functional, debug

**TC-RD-005 SPA handling (.app)**  
- **Steps**: GET `https://umaxica.app/routes/settings`  
- **Exp**: Served by edge (React Router); status 200; no extra redirect  
- **Tags**: domain:app, functional

**TC-RD-006 CDN relay (.net)**  
- **Pre**: `FASTLY_BACKEND` configured  
- **Steps**: GET `https://umaxica.net/api/ping`  
- **Exp**: Passthrough 200; `X-Relay: fastly` header  
- **Tags**: domain:net, functional

### 7.2 Static Assets

**TC-ST-101 robots (.com)**  
- GET `/robots.txt` → 200, content matches corporate rules, cache TTL = 1d, `content-type: text/plain`  
- Tags: domain:com, static

**TC-ST-102 policy (.org)**  
- GET `/policy.html` → 200, HTML title includes “Policy”, HTTP caching 6h  
- Tags: domain:org, static

**TC-ST-103 manifest (.app)**  
- GET `/manifest.json` → 200, valid JSON schema, cache TTL 2h  
- Tags: domain:app, static

**TC-ST-104 staging-status (.dev)**  
- GET `/staging-status.html` → 200, contains build SHA, cache TTL 5m  
- Tags: domain:dev, static

**TC-ST-105 cache-info (.net)**  
- GET `/cache-info.json` → 200, includes TTL field, cache TTL 1h  
- Tags: domain:net, static

### 7.3 Error Paths / Robustness

**TC-ER-201 Missing KV config (any)**  
- Remove redirect rule; GET `/`  
- Exp: 500 + JSON error body; telemetry event emitted  
- Tags: domain:any, error, obs

**TC-ER-202 Backend unreachable (.net)**  
- Simulate 5xx from backend; GET `/api/ping`  
- Exp: 503 with Retry-After; telemetry error recorded  
- Tags: domain:net, error

### 7.4 Performance (NFR)

**TC-PF-301 Lighthouse score (key pages)**  
- Run Lighthouse CI on:  
  - `.com` root, `.app` SPA route  
- Exp: Performance score ≥ 90; LCP < 1.0s  
- Tags: perf, domain:com/app

**TC-PF-302 Redirect latency**  
- k6 test 1k requests/min on `/` (.com)  
- Exp: p95 < 150ms at edge, error rate < 0.1%  
- Tags: perf, domain:com

### 7.5 Security

**TC-SC-401 HTTPS-only (all)**  
- Attempt HTTP; Exp: 301 → HTTPS  
- Tags: security, domain:all

**TC-SC-402 CSP headers (.com strict)**  
- GET `/`  
- Exp: `Content-Security-Policy` matches strict policy; no inline scripts allowed  
- Tags: security, domain:com

**TC-SC-403 HSTS present (all)**  
- Exp: `Strict-Transport-Security: max-age=31536000`  
- Tags: security, domain:all

**TC-SC-404 Frame-ancestors none (.app)**  
- Exp: `frame-ancestors 'none'` present  
- Tags: security, domain:app

**TC-SC-405 Referrer policy (.org)**  
- Exp: `Referrer-Policy: strict-origin-when-cross-origin` (per DDS)  
- Tags: security, domain:org

### 7.6 Localization

**TC-LZ-501 Param normalization**  
- `/?ri=JP&lx=JA` → normalized to `ri=jp&lx=ja` in redirect target  
- Tags: l10n, domain:all

**TC-LZ-502 Default locale**  
- No params → default `ja/jp` redirect on `.com`  
- Tags: l10n, domain:com

**TC-LZ-503 Unsupported tz ignored**  
- `?tz=zzz` → continues; tz omitted in target; 200/302 as applicable  
- Tags: l10n, domain:all

### 7.7 Observability

**TC-OB-601 Event emission**  
- Any successful redirect → `event=redirect_issued` with domain tag  
- Tags: obs, domain:all

**TC-OB-602 Error event**  
- Trigger 500 → `event=error` with `code=500`  
- Tags: obs, domain:any

---

## 8. Acceptance Criteria & Exit

### 8.1 Entry Criteria
- HLD/DDS approved; CI green (Biome, unit tests)  
- Staging deployed; KV seeded; secrets set

### 8.2 Exit Criteria (must all pass)
- Functional: All **P0/P1** test cases pass on staging (and spot-check on prod after release)  
- Localization: All LZ cases pass on `.com` and `.app`, at least one per other TLD  
- Security: SC-401/402/403/404/405 pass per-domain policy  
- Performance: Lighthouse score ≥ 90 on `.com` root and `.app` SPA; p95 redirect latency < 150ms  
- Observability: OB-601/602 validated; traces visible in telemetry backend  
- No **Severity-1** defects open; ≤ 3 **Severity-2** known issues with clear mitigation

**Severity Definition**  
- **S1**: Outage/major security failure; no workaround  
- **S2**: Core feature broken or wrong redirect; workaround exists  
- **S3**: Minor defect/typo/metrics gap

---

## 9. Test Data

- Locales: `ja/jp`, `en/us`, `ko/kr` (+ invalid `zz/zz`)  
- Timezone (optional): `jst`, `utc`, invalid `zzz`  
- Headers for negative tests: missing/invalid `Accept-Language`, forced `X-Forwarded-Proto: http`

---

## 10. Automation & Commands

### 10.1 Playwright (integration)
```bash
bunx playwright test --grep "@domain=com"
bunx playwright test --project=webkit  # Safari-like

