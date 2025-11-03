# Software Requirements Specification (SRS)
## Project: Umaxica Apex Portal Site
---

## 1. Purpose and Scope
- **Purpose:**  
  Previous attempts to implement both apex-domain and `www`-prefixed portal pages under the Umaxica brand within a single Ruby on Rails environment proved complex.  
  Therefore, this project aims to **migrate the public-facing portal pages into a Hono-based environment** deployed on **Vercel** and **Cloudflare Workers**.

- **Scope:**  
  Design, develop, and operate apex and `www` portal sites for the following domains:  
  `umaxica.com`, `umaxica.org`, `umaxica.net`, `umaxica.dev`, and `umaxica.app`.  
  The system will serve as a unified entry point, **redirecting users to localized service pages implemented in Ruby on Rails**.

- **Intended audience:**  
  General end users accessing the above Umaxica domains.

- **Intended use:**  
  The primary function of the portal is to redirect visitors to localized sub-applications built on the Rails platform (e.g., app, org, and staff portals).

---

## 2. Stakeholders and Roles
| Role | Name / Department | Responsibilities |
|------|--------------------|------------------|
| Product Owner | Internal (Umaxica) | Defines goals, priorities, and approval criteria |
| Tech Lead | Internal | Oversees technical architecture and integration strategy |
| Front-End Developer | Internal | Implements UI, routing, and edge rendering via Hono |
| Back-End Developer | Internal | Handles redirect logic and integration with localized applications |
| DevOps Engineer | Internal | Manages deployment (Vercel / Cloudflare / GCP) and observability |
| QA Engineer | Internal | Conducts functional, performance, and regression testing |

---

## 3. System Overview
- **Architecture:**
  A **monorepo** containing five independent Hono-based applications (one per domain), deployed to Cloudflare Workers and Vercel runtime environments. Managed using **Bun workspaces** for unified dependency management while maintaining per-domain autonomy.

- **User groups:**
  No administrative users; the portal serves only end users as a public entry point.

- **Supported platforms:**
  Modern browsers (Chrome, Firefox, Safari, Edge).

- **Primary goals:**
  - Provide a unified multilingual regional portal across five domains
  - Ensure high availability and global scalability
  - Integrate seamlessly with Vercel and Cloudflare Workers
  - Utilize **Bun** for package management while relying solely on **Hono** runtime tooling for development and edge execution (no additional bundler)
  - Enable independent deployment and customization per domain

---

## 4. Functional Requirements
### 4.1 Core Features
- Canonicalize inbound apex traffic by stripping any leading `www.` and redirecting back to the naked domain (301/302).  
- When the query contains a trusted `ri` region code (for example `ri=jp`), redirect to the corresponding regional apex subdomain (`jp.umaxica.[com|org|app|dev]`) while preserving approved parameters; remove unsupported parameters and fall back to the canonical URL when none remain.  
- Serve dedicated diagnostic responses for `/health`, `/v1/health`, and error pages (400/500) while other routes continue to redirect.
- Provide required static assets, including `favicon.ico`, `robots.txt`, `sitemap.xml`, and additional brand collateral.
- Redirect users to localized URLs handled by **Hono** framework running on Cloudflare Workers.

### 4.2 Administrative Functions
- No administrative interface is required for this project.

### 4.3 Integrations
- **GitHub:** Use GitHub Actions for Continuous Integration (CI)
- **Vercel:** Deploy via Vercel's native Continuous Deployment (CD) pipelines
- **Cloudflare:** Deploy as Cloudflare Workers using automated CD processes

### 4.4 Future Phase: Authentication & Routing Enrichment
- **JWT validation:** Signed JWT cookies will be validated (but not issued) to enable personalized routing in a future phase
- **Geolocation & User-Agent:** Heuristic-based routing using geolocation and user-agent analysis will be introduced in a subsequent phase
- **Current phase:** No authentication or user registration is implemented; all routing is based on explicit query parameters only

---

## 5. Non-Functional Requirements
| Category | Requirement |
|-----------|-------------|
| **Performance** | Hono edge response time under 1 second (LCP < 1.0 s); does not include downstream Rails application performance |
| **Reliability** | System uptime ≥ 98 % |
| **Scalability** | Multi-region deployment capability |
| **Security** | Enforce strict CSP headers and HTTPS-only traffic |
| **Maintainability** | Modular architecture with well-defined service boundaries |
| **Observability** | Implement OpenTelemetry for tracing and performance metrics |
| **Localization** | Support query parameters `lx` (language) and `ri` (region) |

---

## 6. Constraints and Dependencies
- **Technology stack:** Bun 1.3+ (package manager/runtime), Hono 4+ (framework and tooling)
- **Infrastructure:** Vercel and Cloudflare Workers
- **Provisioning:** Environment configuration and infrastructure resources are defined and managed via Terraform
- **Configuration:** Environment variables (per workspace via Wrangler or Vercel):
  - `BRAND_NAME`: Brand display name (e.g., `"Umaxica"`)
  - `EDGE_CORPORATE_URL`: Rails backend for corporate domain with regional subdomain (e.g., `"https://jp.umaxica.com"` or `"https://us.umaxica.com"`)
  - `EDGE_SERVICE_URL`: Rails backend for service portal with regional subdomain (e.g., `"https://jp.umaxica.app"` or `"https://us.umaxica.app"`)
  - `EDGE_ORGANIZATION_URL`: Rails backend for organization portal with regional subdomain (e.g., `"https://jp.umaxica.org"` or `"https://us.umaxica.org"`)
  - `EDGE_STATUS_URL`: Rails backend for status/development with regional subdomain (e.g., `"https://us.umaxica.dev"` or `"https://jp.umaxica.dev"`)
  - `DEFAULT_LOCALE`: Default locale code (e.g., `"ja"`)
  - `DEFAULT_REGION`: Default region code (e.g., `"jp"`)
- **External dependencies:**
  - Cloudflare API v4
  - Vercel Deploy Hooks
  - GitHub Actions
  - Rails backend APIs (for redirect targets)
- **Operational constraints:**
  - Edge-runtime memory and execution-time limits imposed by Cloudflare Workers and Vercel
  - Static-file size limits per deployment target
  - Monorepo workspace isolation (no cross-workspace imports)  

---

## 7. Acceptance Criteria
| Item | Condition |
|------|------------|
| **Core navigation** | All registered apex and `www` URLs respond successfully |
| **Canonical routing** | `www.` URLs redirect to the apex domain, unsupported params removed |
| **Localization** | Query parameters `?lx=ja&ri=jp` emit the correct regional subdomain |
| **Authentication** | Not implemented in current phase; JWT validation deferred to future phase |
| **Performance** | Lighthouse performance score ≥ 90 (Hono edge responses only) |
| **Deployment** | GitHub Actions (CI) and Vercel / Cloudflare Workers (CD) pipelines execute automatically and complete successfully |
| **Static assets** | `favicon.ico`, `robots.txt`, and `sitemap.xml` serve branded content per domain |
| **Health endpoints** | `/health` and `/v1/health` respond with diagnostic payloads (200) |

---

## 8. Appendices
- **System diagrams:** Architecture, sequence, and data-flow diagrams  
- **API specifications:** Endpoint list and request/response schema  
- **Test coverage summary:** Static tests (Biome), unit tests (Bun Test), and integration tests (Playwright)  
- **Change log:** Version history and approval notes  

---

> **Note:**  
> This document serves as an internal Software Requirements Specification (SRS) for the Umaxica in-house development team.  
> It is **not** intended for vendor solicitation or external distribution.  
> All requirements must be reviewed and approved within the internal development workflow.
