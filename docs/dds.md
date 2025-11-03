# Detailed Design Specification (DDS)
## Project: Umaxica Apex Portal Site  
### Conforming to IEEE 1016:2009 and ISO/IEC/IEEE 42010:2011

---

## 1. Introduction

### 1.1 Purpose
This document defines the detailed software design of the **Umaxica Apex Portal Site**, expanding upon the High-Level Design (HLD).  
It specifies the logic, data structures, interfaces, and configuration details for all Apex domains —  
`umaxica.com`, `umaxica.org`, `umaxica.app`, `umaxica.dev`, and `umaxica.net`.

### 1.2 Scope
While the overall portal system shares a unified architecture (Hono on Vercel / Cloudflare Workers),  
each top-level domain (TLD) is customized to serve distinct audiences and behaviors.  
This DDS captures both **common logic** and **domain-specific deviations**.

### 1.3 References
- Umaxica Apex Portal — High-Level Design (HLD) v1.0  
- Umaxica Apex Portal — Software Requirements Specification (SRS) v1.0  
- ISO/IEC/IEEE 1016:2009 — *Software Design Description*  
- ISO/IEC/IEEE 42010:2011 — *Architecture Description*  
- Umaxica Engineering Standards — Edge CI/CD and Environment Configuration

---

## 2. Architectural Context

### 2.1 Common Platform
- **Framework:** Hono (TypeScript)
- **Runtime:** Vercel Edge Functions + Cloudflare Workers
- **Build Tool:** Bun (v1.3+)
- **Deployment Pipeline:** GitHub Actions → Vercel Deploy Hook and Cloudflare Publish
- **Monitoring:** OpenTelemetry → ?

### 2.2 Domain-Specific Roles

| Domain | Primary Role | Behavior Notes |
|---------|---------------|----------------|
| **umaxica.com** | Corporate portal | Public-facing, brand introduction, links to sub-services |
| **umaxica.org** | Organizational portal | For staff initiatives |
| **umaxica.app** | Application entry | service site |
| **umaxica.dev** | Development / staging | Mirrors `.app` behavior |
| **umaxica.net** | Service network edge | Acts as CDN redirector or API passthrough for special cases |
---

## 3. Component Design

### 3.1 Portal Router (Shared Core)
- **Location:** `src/router/portal.ts`
- **Language:** TypeScript
- **Responsibilities:**  
  - Detect apex domain and TLD  
  - Normalize query parameters (`lx`, `ri`, `tz`)  
  - Apply redirect or serve a static resource

