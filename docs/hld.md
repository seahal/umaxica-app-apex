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
The Apex Portal is a **Hono-based** application deployed on **Vercel** and **Cloudflare Workers**.  
It serves as the unified entry point for multiple Umaxica subdomains (`app`, `org`, `staff`, etc.), redirecting users to localized Rails-powered service sites.

### 1.3 References  
- ISO/IEC/IEEE 42010:2011 — *Systems and Software Architecture Description*  
- IEEE 1016:2009 — *Software Design Description*  
- Umaxica Apex Portal — Software Requirements Specification (SRS), Version 1.0  
- Umaxica Engineering Standards — CI/CD and Naming Conventions  

---

## 2. Design Overview

### 2.1 Design Objectives
- Simplify the handling of apex (`umaxica.com`, `umaxica.app`, `umaxica.net`, `umaxica.org`, `umaxica.dev`) and `www`-prefixed domains  
- Achieve global scalability and low-latency edge rendering  
- Maintain a clear separation between the presentation layer (Hono) and the edge delivery platforms (Vercel and Cloudflare Workers)  
- Enable straightforward CI/CD integration through GitHub Actions and Vercel/Cloudflare CD pipelines  

### 2.2 Design Principles
- **Statelessness:** All requests are handled independently; no session persistence at the edge.  
- **Decoupling:** Presentation and service logic are isolated to simplify maintenance.  
- **Security by design:** HTTPS-only endpoints and strict Content Security Policy (CSP) headers.  
- **Observability:** OpenTelemetry instrumentation for performance tracing and distributed metrics.  
- **Extensibility:** Domain and localization configuration managed through environment variables.

---

## 3. System Architecture

### 3.1 Architectural Overview
The system follows a distributed, edge-oriented architecture composed of three primary layers:

| Layer | Technology / Service | Responsibility |
|-------|-----------------------|----------------|
| **Edge Layer** | Cloudflare Workers / Vercel | Handles routing, static assets, and redirections |
| **Application Layer** | Hono | Manages request processing, locale logic, and content routing |
| **Delivery Layer** | Vercel / Cloudflare Workers | Provides caching, performance optimization, and TLS termination |

### 3.2 Architecture Diagram
*(Insert diagram illustrating: Browser → Cloudflare Worker / Vercel (Hono runtime) → Rails backend)*  

### 3.3 Deployment View
- **Primary Deployment:** Vercel / Cloudflare Workers — builds and serves static assets  
- **Edge Execution:** Vercel / Cloudflare Workers — handles redirects, edge logic, and React Router rendering  
- **Service Backend:** Rails-based localized sites hosted separately  
- **Supporting Services:** GitHub Actions, Secret Manager  

---

## 4. System Components

### 4.1 Component Overview
| Component | Technology | Description |
|------------|-------------|-------------|
| **Portal Router** | Hono on Vercel / Cloudflare Workers | Resolves apex and `www` routes; forwards requests to the appropriate locale and region subdomain |
| **Static Page Renderer** | Hono Static Middleware | Serves `robots.txt`, `sitemap.xml`, and other static resources |
| **Redirect Controller** | Hono | Performs HTTP 301/302 redirects based on locale parameters |
| **CI/CD Pipeline** | GitHub Actions, Vercel, Cloudflare Workers | Builds, tests, and deploys edge assets automatically |
| **Monitoring & Logging** | OpenTelemetry | Collects metrics, traces, and logs for performance visibility |

---

## 5. Interface Design

### 5.1 External Interfaces
| Interface | Direction | Protocol | Description |
|------------|------------|-----------|-------------|
| Cloudflare ↔ Vercel | Outbound | HTTPS | Builds and deploys edge bundles |
| GitHub ↔ Vercel / Cloudflare Workers | Outbound | HTTPS / Webhook | Triggers continuous deployment |
| User Browser ↔ Cloudflare Worker | Inbound | HTTPS | Handles initial HTTP requests to apex or `www` domains |

### 5.2 Environment Interfaces
- **Environment Variables:**  
  `BRAND_NAME`, `EDGE_CORPORATE_URL`, `EDGE_SERVICE_URL`, `EDGE_ORGANIZATION_URL`  
- **Secret Management:**  
  Secrets are securely retrieved through Vercel environment variables and Cloudflare KV storage.

---

## 6. Data Design

### 6.1 Logical Data Flow
1. A user accesses `https://[www.]umaxica.com`.  
2. The Cloudflare Worker inspects query parameters (`lx`, `ri`).  
3. The Hono router determines the redirect target based on the locale.  
4. The response is cached at the edge for subsequent requests.

### 6.2 Data Objects
| Data Object | Description | Source |
|--------------|-------------|--------|
| `LocaleParam` | Language-region pair (`lx`, `ri`) | URL query |
| `RedirectRule` | Mapping of locale → target subdomain | Environment configuration |
| `StaticAsset` | Edge-served content (e.g., `/robots.txt`) | Build artifact |

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
2. GitHub Actions executes build and test workflows.  
3. A successful build triggers Vercel and Cloudflare deploy hooks.  
4. Deployment is automatically verified via health checks.  

### 9.2 Environments
| Environment | Purpose | URL |
|--------------|----------|----|
| **Staging** | QA and integration testing | *Under configuration* |
| **Production** | Live portal deployment | `umaxica.[com|org|app|dev|net]`, `www.umaxica.[com|org|app|dev|net]` |

---

## 10. Design Rationale
- **Why Hono:** Lightweight, edge-optimized framework suitable for stateless redirects and dynamic rendering.  
- **Why Vercel + Cloudflare Workers:** Combines global caching, CDN scalability, and programmable edge behavior.  
- **Why Bun:** Unified JavaScript/TypeScript runtime offering faster build times and native testing support.  

---

## 11. Future Enhancements
- Expand OpenTelemetry tracing to include Rails backend latency metrics.  

---

## 12. Appendices
- **A. System Diagrams** — Logical, deployment, and data-flow diagrams  
- **B. Configuration Schema** — Environment variables and default values  
- **C. References** — Linked SRS, API specifications, and test plan  

---

> **Note:**  
> This High-Level Design Document (HLD) conforms to IEEE 1016 and ISO/IEC/IEEE 42010 standards for architectural documentation.  
> It serves as a bridge between the Software Requirements Specification (SRS) and the forthcoming Low-Level Design (LLD) phase.q
