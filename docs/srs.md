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
  A Hono-based application deployed on both Vercel and Cloudflare Workers runtime environments.

- **User groups:**  
  No administrative users; the portal serves only end users as a public entry point.

- **Supported platforms:**  
  Modern browsers (Chrome, Firefox, Safari, Edge).

- **Primary goals:**  
  - Provide a unified multilingual regional portal  
  - Ensure high availability and global scalability  
  - Integrate seamlessly with Vercel and Cloudflare Workers  
  - Utilize **Bun** as the primary runtime and build tool

---

## 4. Functional Requirements
### 4.1 Core Features
- Support for user registration and authentication (Passkey / JWT-based)  
- Redirect users to localized URLs handled by **React Router** running on Cloudflare Workers  
- Serve lightweight static pages such as `robots.txt`, `sitemap.xml`, and `about.html`

### 4.2 Administrative Functions
- No administrative interface is required for this project.

### 4.3 Integrations
- **GitHub:** Use GitHub Actions for Continuous Integration (CI)  
- **Vercel:** Deploy via Vercel’s native Continuous Deployment (CD) pipelines  
- **Cloudflare:** Deploy as Cloudflare Workers using automated CD processes  

---

## 5. Non-Functional Requirements
| Category | Requirement |
|-----------|-------------|
| **Performance** | Page load time under 1 second (LCP < 1.0 s) |
| **Reliability** | System uptime ≥ 98 % |
| **Scalability** | Multi-region deployment capability |
| **Security** | Enforce strict CSP headers and HTTPS-only traffic |
| **Maintainability** | Modular architecture with well-defined service boundaries |
| **Observability** | Implement OpenTelemetry for tracing and performance metrics |
| **Localization** | Support query parameters `lx` (language) and `ri` (region) |

---

## 6. Constraints and Dependencies
- **Technology stack:** Bun 1.3.1  
- **Infrastructure:** Vercel and Cloudflare Workers  
- **Configuration:** Environment variables follow the naming scheme:  
  `BRAND_NAME`, `EDGE_CORPORATE_URL`, `EDGE_SERVICE_URL`, `EDGE_ORGANIZATION_URL`  
- **External dependencies:**  
  - Cloudflare API v4  
  - Vercel Deploy Hooks  
  - GitHub Actions  
- **Operational constraints:**  
  - Edge-runtime memory and execution-time limits imposed by Cloudflare Workers and Vercel  
  - Static-file size limits per deployment target  

---

## 7. Acceptance Criteria
| Item | Condition |
|------|------------|
| **Core navigation** | All registered apex and `www` URLs respond successfully |
| **Localization** | Query parameters `?lx=ja&ri=jp` render correctly localized content |
| **Authentication** | Authentication is currently not required |
| **Performance** | Lighthouse performance score ≥ 90 |
| **Deployment** | GitHub Actions (CI) and Vercel / Cloudflare Workers (CD) pipelines execute automatically and complete successfully |

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

