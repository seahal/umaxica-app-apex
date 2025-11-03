# High-Level Design Document (HLD)
## Project: Umaxica Apex Portal Site  
### Conforming to ISO/IEC/IEEE 42010:2011 and IEEE 1016:2009

---

## 1. Introduction

### 1.1 Purpose  
This document provides the high-level design for the Umaxica Apex Portal Site, based on the requirements defined in the Software Requirements Specification (SRS).  
It describes the system architecture, major components, their responsibilities, interfaces, and data flow at an abstract level.  
The document ensures a shared understanding among developers, architects, and stakeholders before the detailed design and implementation phases begin.

### 1.2 Scope
The Apex Portal is a **monorepo** containing five independent **Hono-based** applications deployed on **Vercel** and **Cloudflare Workers**.
Each domain (`umaxica.com`, `umaxica.org`, `umaxica.app`, `umaxica.dev`, `umaxica.net`) operates as an autonomous workspace within the repository, sharing common tooling while maintaining domain-specific behavior.
The system serves as the unified entry point, redirecting users to localized Rails-powered service sites.

### 1.3 References  
- ISO/IEC/IEEE 42010:2011 — *Systems and Software Architecture Description*  
- IEEE 1016:2009 — *Software Design Description*  
- Umaxica Apex Portal — Software Requirements Specification (SRS), Version 1.0  
- Umaxica Engineering Standards — CI/CD and Naming Conventions  

---

## 2. Design Overview

### 2.1 Design Objectives
- Canonicalize all inbound traffic so `www.` hosts redirect to their apex equivalents while regional subdomains (`ri=jp` → `jp.umaxica.*`) receive trusted traffic.  
- Achieve global scalability and low-latency edge rendering on edge runtimes (Vercel Edge Functions and Cloudflare Workers) while using Hono on Bun for development and verification.  
- Maintain a clear separation between the presentation layer (Hono) and the edge delivery platforms (Vercel and Cloudflare Workers).  
- Enable straightforward CI/CD integration that relies on GitHub Actions for CI and automated deployments via Vercel and Cloudflare delivery pipelines.  

### 2.2 Design Principles
- **Statelessness:** All requests are handled independently; no session persistence at the edge. Future phases may add signed JWT cookies strictly for personalized routing without breaking stateless guarantees.  
- **Decoupling:** Presentation and service logic are isolated to simplify maintenance.  
- **Security by design:** HTTPS-only endpoints and strict Content Security Policy (CSP) headers.  
- **Observability:** OpenTelemetry instrumentation for performance tracing and distributed metrics.  
- **Extensibility:** Domain and localization configuration managed through environment variables; geolocation and user-agent enrichment is deferred to a follow-on release.
- **Infrastructure as code:** Terraform defines and provisions Cloudflare, Vercel, and supporting environment resources to keep deployments reproducible.

---

## 3. System Architecture

### 3.1 Architectural Overview
The system follows a **monorepo architecture** where five independent Hono applications are organized as Bun workspaces.
Each workspace corresponds to a domain (`app`, `com`, `org`, `dev`, `net`) and deploys independently to edge runtimes.

**Monorepo Structure:**
```
umaxica-app-apex/
├── app/          (umaxica.app - Cloudflare Workers)
├── com/          (umaxica.com - Cloudflare Workers)
├── org/          (umaxica.org - Cloudflare Workers)
├── dev/          (umaxica.dev - Vercel/Local)
├── net/          (umaxica.net - Cloudflare Workers)
├── package.json  (Workspace configuration)
└── tsconfig.json (Shared TypeScript config)
```

The system follows a distributed, edge-oriented architecture composed of three primary layers:

| Layer | Technology / Service | Responsibility |
|-------|-----------------------|----------------|
| **Edge Layer** | Cloudflare Workers / Vercel | Handles routing, static assets, and redirections |
| **Application Layer** | Hono (per workspace) | Manages request processing, locale logic, and content routing |
| **Delivery Layer** | Vercel / Cloudflare Workers | Provides caching, performance optimization, and TLS termination |

### 3.2 Architecture Diagram
*(Insert diagram illustrating: Browser → Cloudflare Worker / Vercel (Hono runtime) → Rails backend)*

### 3.3 Deployment View
- **Primary Deployment:** Vercel / Cloudflare Workers — builds and serves static assets
- **Edge Execution:** Vercel / Cloudflare Workers — handles redirects, edge logic, and Hono request processing
- **Service Backend:** Rails-based localized sites hosted separately
- **Supporting Services:** GitHub Actions, Secret Manager  

---

## 4. System Components

### 4.1 Component Overview (Per-Workspace)
Each workspace is an independent Hono application with the following components:

| Component | Location | Technology | Description |
|------------|----------|-------------|-------------|
| **Application Entry Point** | `{workspace}/src/index.tsx` or `.ts` | Hono | Main application logic, route definitions |
| **JSX Renderer** (app, com, org, net only) | `{workspace}/src/renderer.tsx` | Hono JSX Renderer | Server-side rendering of JSX components |
| **Runtime Scripts** | `{workspace}/package.json` | Bun scripts + Wrangler CLI | Defines dev, build, and deploy commands without Vite |
| **Deployment Configuration** | `{workspace}/wrangler.jsonc` | Wrangler CLI | Cloudflare Workers deployment settings |
| **Tests** | `{workspace}/test/` | Bun Test | Unit and integration tests |

**Shared Infrastructure:**
| Component | Location | Technology | Description |
|------------|----------|-------------|-------------|
| **Workspace Manager** | Root `package.json` | Bun workspaces | Manages dependencies across all domains |
| **TypeScript Config** | Root `tsconfig.json` | TypeScript | Shared compiler options |
| **Linter/Formatter** | Root `biome.json` | Biome | Shared code quality rules |
| **CI/CD Pipeline** | `.github/workflows/` (planned) | GitHub Actions | Builds, tests, and deploys affected workspaces |
| **Monitoring & Logging** | (planned) | OpenTelemetry | Collects metrics, traces, and logs for performance visibility |

---

## 5. Interface Design

### 5.1 External Interfaces
| Interface | Direction | Protocol | Description |
|------------|------------|-----------|-------------|
| Cloudflare ↔ Vercel | Outbound | HTTPS | Builds and deploys edge bundles |
| GitHub ↔ Vercel / Cloudflare Workers | Outbound | HTTPS / Webhook | Triggers continuous deployment |
| User Browser ↔ Cloudflare Worker | Inbound | HTTPS | Handles initial HTTP requests to apex or `www` domains |

### 5.2 Environment Interfaces
- **Environment Variables** (configured per workspace):
  - `BRAND_NAME`: Brand display name (e.g., `"Umaxica"`)
  - `EDGE_CORPORATE_URL`: Rails backend for corporate domain with regional subdomain (e.g., `"https://jp.umaxica.com"` or `"https://us.umaxica.com"`)
  - `EDGE_SERVICE_URL`: Rails backend for service portal with regional subdomain (e.g., `"https://jp.umaxica.app"` or `"https://us.umaxica.app"`)
  - `EDGE_ORGANIZATION_URL`: Rails backend for organization portal with regional subdomain (e.g., `"https://jp.umaxica.org"` or `"https://us.umaxica.org"`)
  - `EDGE_STATUS_URL`: Rails backend for status/development with regional subdomain (e.g., `"https://us.umaxica.dev"` or `"https://jp.umaxica.dev"`)
  - `DEFAULT_LOCALE`: Default locale code (e.g., `"ja"`)
  - `DEFAULT_REGION`: Default region code (e.g., `"jp"`)
- **Secret Management:**
  Secrets are securely retrieved through Vercel environment variables and Cloudflare Workers environment variables (configured via Wrangler or dashboard).

---

## 6. Data Design

### 6.1 Logical Data Flow
1. A user accesses `https://[www.]umaxica.com`.  
2. The edge runtime (Cloudflare Worker or Vercel Edge Function) strips any leading `www.` and normalizes the hostname.  
3. The Hono router inspects query parameters (`lx`, `ri`), removes unsupported keys, and promotes trusted region codes to regional apex subdomains (for example `ri=jp` → `jp.umaxica.com`).  
4. When no explicit signals exist, the system currently responds with the canonical apex route; cookie- and geolocation-based enrichment will be introduced in a later phase.  
5. Diagnostic routes (`/health`, `/v1/health`, 400, 500) render JSON or branded HTML responses without redirecting.  
6. The response is cached at the edge for subsequent requests.

### 6.2 Data Objects
| Data Object | Description | Source |
|--------------|-------------|--------|
| `LocaleParam` | Language-region pair (`lx`, `ri`) | URL query |
| `RegionalHost` | Resolved apex host derived from `ri` (e.g., `jp.umaxica.com`) | Router logic |
| `RedirectRule` | Mapping of locale → target subdomain | Environment configuration |
| `StaticAsset` | Edge-served content (e.g., `/robots.txt`, `favicon.ico`) | Build artifact |
| `DiagnosticPayload` | JSON or HTML returned by health/error endpoints | Runtime handler |

---

## 7. Security and Compliance

### 7.1 Security Mechanisms
- HTTPS enforced on all endpoints  
- CSP headers configured for script and style isolation  
- No persistent cookies or session data stored at the edge  

### 7.2 Compliance
- Follows ISO/IEC 27001 principles for configuration and secret management  
- Secrets managed through Cloudflare Secret Manager or Vercel Secrets API  

---

## 8. Error Handling and Logging
- Unified error structure using standardized JSON response fields (`code`, `message`, `timestamp`)  
- Real-time metrics and distributed tracing implemented via OpenTelemetry  

---

## 9. Deployment Architecture

### 9.1 Build and Deployment Flow
1. Code is pushed to the GitHub main branch.
2. GitHub Actions (CI) executes Bun-based tests, Biome checks, and uses Wrangler's native bundler to produce deployable Hono workers (no Vite step).
3. A successful build triggers both Vercel and Cloudflare deployment hooks, publishing artifacts to their respective edge runtimes.
4. Deployment is automatically verified via `/health` and `/v1/health` checks and monitored with OpenTelemetry events.  

### 9.2 Environments
| Environment | Purpose | URL |
|--------------|----------|----|
| **Staging** | QA and integration testing | *Under configuration* |
| **Production** | Live portal deployment | `umaxica.[com|org|app|dev|net]`, `www.umaxica.[com|org|app|dev|net]` |

---

## 10. Design Rationale
- **Why Hono:** Lightweight, edge-optimized framework suitable for stateless redirects and dynamic rendering.
- **Why Vercel + Cloudflare Workers:** Combines global caching, CDN scalability, and programmable edge behavior.
- **Why Bun:** Fast JavaScript/TypeScript package manager with native testing support.
- **Why Hono-only tooling:** Keeps edge handlers lean by relying on Wrangler's default bundler and Bun-managed scripts, reducing surface area and operational overhead.  

---

## 11. Future Enhancements
- Introduce signed JWT cookies for personalized redirect hints while preserving stateless edge scaling characteristics.  
- Add geolocation and user-agent heuristics for redirects when queries and cookies are absent.  
- Expand OpenTelemetry tracing to include Rails backend latency metrics.  

---

## 12. Appendices
- **A. System Diagrams** — Logical, deployment, and data-flow diagrams  
- **B. Configuration Schema** — Environment variables and default values  
- **C. References** — Linked SRS, API specifications, and test plan  

---

> **Note:**
> This High-Level Design Document (HLD) conforms to IEEE 1016 and ISO/IEC/IEEE 42010 standards for architectural documentation.
> It serves as a bridge between the Software Requirements Specification (SRS) and the Detailed Design Specification (DDS).
