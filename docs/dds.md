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
The portal system uses a **monorepo architecture** with Bun workspaces, where each top-level domain (TLD) is implemented as an independent Hono application.
While sharing common tooling and deployment pipelines, each workspace is customized to serve distinct audiences and behaviors.
This DDS captures both **common infrastructure** and **domain-specific implementations**.

### 1.3 References
- Umaxica Apex Portal — High-Level Design (HLD) v1.0
- Umaxica Apex Portal — Software Requirements Specification (SRS) v1.0
- ISO/IEC/IEEE 1016:2009 — *Software Design Description*
- ISO/IEC/IEEE 42010:2011 — *Architecture Description*
- Umaxica Engineering Standards — Edge CI/CD and Environment Configuration

---

## 2. Architectural Context

### 2.1 Monorepo Structure
The project uses **Bun workspaces** to manage five independent domain applications:

```
umaxica-app-apex/           (monorepo root)
├── package.json            (workspace configuration)
├── tsconfig.json           (shared TypeScript config)
├── biome.json              (shared linting/formatting)
├── app/                    (umaxica.app workspace)
│   ├── src/index.tsx       (Hono application entry)
│   ├── src/renderer.tsx    (JSX renderer for SSR)
│   ├── vite.config.ts      (Vite bundler config)
│   ├── wrangler.jsonc      (Cloudflare Workers config)
│   ├── test/               (domain-specific tests)
│   └── package.json        (workspace dependencies)
├── com/                    (umaxica.com workspace)
├── org/                    (umaxica.org workspace)
├── net/                    (umaxica.net workspace)
└── dev/                    (umaxica.dev workspace)
    ├── src/index.ts        (Plain Hono, no JSX)
    └── package.json
```

**Key Characteristics:**
- Each workspace is an independent Hono application
- Workspaces share common dependencies via the root `package.json`
- Each workspace has its own build, test, and deployment configuration
- Code sharing is minimal by design (domains have distinct behaviors)

### 2.2 Common Platform
- **Framework:** Hono 4.10+ (TypeScript/TSX)
- **Package Manager:** Bun 1.3+ (manages workspaces)
- **Build Tool:** Vite 6+ with `@cloudflare/vite-plugin` for edge bundling
- **Runtime:** Cloudflare Workers (primary deployment target)
- **Rendering:** Hono JSX Renderer + `vite-ssr-components` (for .app, .com, .org, .net)
- **Testing:** Bun Test (unit tests per workspace)
- **Linting/Formatting:** Biome (shared configuration)
- **Deployment:** Wrangler CLI (per workspace)
- **Provisioning:** Terraform modules capture Cloudflare, Vercel, and ancillary environment configuration
- **Monitoring:** OpenTelemetry → (TBD in future phase)

### 2.3 Domain-Specific Roles

| Domain | Workspace | Primary Role | Rendering | Deployment |
|---------|-----------|--------------|-----------|------------|
| **umaxica.com** | `com/` | Corporate portal | Hono JSX/SSR | Cloudflare Workers |
| **umaxica.org** | `org/` | Organizational portal | Hono JSX/SSR | Cloudflare Workers |
| **umaxica.app** | `app/` | Application entry | Hono JSX/SSR | Cloudflare Workers |
| **umaxica.dev** | `dev/` | Development/staging | Plain text response | Local/Vercel |
| **umaxica.net** | `net/` | Service network edge | Hono JSX/SSR | Cloudflare Workers |

---

## 3. Component Design (Per-Workspace Architecture)

### 3.1 Workspace Structure (app, com, org, net)

Each workspace with JSX/SSR support follows this structure:

#### 3.1.1 Application Entry Point
- **Location:** `{workspace}/src/index.tsx`
- **Language:** TypeScript + JSX
- **Responsibilities:**
  - Initialize Hono application instance
  - Register JSX renderer middleware from `renderer.tsx`
  - Define routes (currently root `/` only)
  - Export default app for Cloudflare Workers runtime

**Example (app/src/index.tsx):**
```typescript
import { Hono } from "hono";
import { renderer } from "./renderer";

const app = new Hono();
app.use(renderer);

app.get("/", (c) => {
  return c.render(<h1>Hello!</h1>);
});

export default app;
```

#### 3.1.2 JSX Renderer
- **Location:** `{workspace}/src/renderer.tsx`
- **Technology:** `hono/jsx-renderer` + `vite-ssr-components`
- **Responsibilities:**
  - Define HTML document structure
  - Inject Vite client for HMR during development
  - Load CSS stylesheets
  - Render JSX children into `<body>`

**Example (app/src/renderer.tsx):**
```typescript
import { jsxRenderer } from "hono/jsx-renderer";
import { Link, ViteClient } from "vite-ssr-components/hono";

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
});
```

#### 3.1.3 Vite Configuration
- **Location:** `{workspace}/vite.config.ts`
- **Plugins:**
  - `@cloudflare/vite-plugin`: Bundles Hono app for Cloudflare Workers
  - `vite-ssr-components/plugin`: Enables SSR with JSX components
- **Dev Server:**
  - Host: `0.0.0.0` (accessible in Docker container)
  - Port: Unique per workspace (e.g., 5071 for `app/`)
  - Polling: Enabled for Docker volume compatibility

**Example (app/vite.config.ts):**
```typescript
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import ssrPlugin from "vite-ssr-components/plugin";

export default defineConfig({
  plugins: [cloudflare(), ssrPlugin()],
  server: {
    host: true,
    port: 5071,
    strictPort: true,
    watch: { usePolling: true },
  },
});
```

#### 3.1.4 Wrangler Configuration
- **Location:** `{workspace}/wrangler.jsonc`
- **Purpose:** Configures Cloudflare Workers deployment
- **Key Settings:**
  - `name`: Unique worker name per domain
  - `compatibility_date`: Cloudflare Workers runtime version
  - `main`: Entry point (e.g., `./src/index.tsx`)

**Example (app/wrangler.jsonc):**
```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-app",
  "compatibility_date": "2025-08-03",
  "main": "./src/index.tsx"
}
```

#### 3.1.5 Workspace Package Configuration
- **Location:** `{workspace}/package.json`
- **Scripts:**
  - `dev`: Run Vite dev server with HMR
  - `build`: Build for production (Vite → Cloudflare Workers bundle)
  - `test`: Run Bun tests in workspace
  - `preview`: Build and preview production bundle locally
  - `deploy`: Build and deploy to Cloudflare Workers via Wrangler
- **Dependencies:**
  - `hono`: Web framework
  - `@cloudflare/vite-plugin`: Cloudflare Workers bundler
  - `vite`: Build tool
  - `vite-ssr-components`: SSR utilities
  - `wrangler`: Cloudflare Workers CLI

---

### 3.2 Workspace Structure (dev)

The `dev/` workspace has a simplified structure without JSX:

#### 3.2.1 Application Entry Point
- **Location:** `dev/src/index.ts`
- **Language:** TypeScript (plain, no JSX)
- **Responsibilities:**
  - Initialize Hono application
  - Return plain text responses
  - Serve as a minimal staging/debug environment

**Example (dev/src/index.ts):**
```typescript
import { Hono } from "hono";

const app = new Hono();

const welcomeStrings = [
  "Hello Hono!",
  "To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono",
];

app.get("/", (c) => {
  return c.text(welcomeStrings.join("\n\n"));
});

export default app;
```

**Note:** The `dev/` workspace currently lacks:
- Vite configuration (may use alternative bundler or direct execution)
- Wrangler configuration (may deploy to Vercel instead)
- JSX rendering capabilities

---

## 4. Request Handling (Future Implementation)

### 4.1 Current State
As of the current implementation phase, all workspaces serve **static welcome pages**:
- JSX workspaces (app, com, org, net): Render `<h1>Hello!</h1>`
- Plain workspace (dev): Return text `"Hello Hono!"`

### 4.2 Planned Redirect Workflow
The following workflow is **planned for the next phase**:

1. Parse the incoming request and normalize the host by stripping `www.`
2. Validate query parameters; allow-list `lx`, `ri`, and `tz`, discarding all other keys
3. When a trusted `ri` code is present, route to the configured regional apex
   (e.g., `ri=jp` → `jp.umaxica.com`, `ri=us` → `us.umaxica.com`)
4. If no region is supplied, redirect to the canonical apex; future phases will inspect
   signed JWT cookies and geolocation/user-agent hints
5. If the request targets diagnostic routes (`/health`, `/v1/health`, error paths),
   respond locally without redirecting

### 4.3 Planned Routing Table
| Path | Method | Description | Implementation Status |
|------|--------|-------------|----------------------|
| `/` | GET | Domain-specific welcome or redirect | ✅ Welcome page implemented |
| `/favicon.ico` | GET | Static asset | ⏳ Planned |
| `/robots.txt` | GET | Static asset | ⏳ Planned |
| `/sitemap.xml` | GET | Static asset | ⏳ Planned |
| `/health` | GET | Health check | ⏳ Planned |
| `/v1/health` | GET | Health API | ⏳ Planned |
| `/*` | GET | Catch-all redirect | ⏳ Planned |

---

## 5. Shared Infrastructure

### 5.1 Root-Level Configuration

#### 5.1.1 TypeScript Configuration
- **Location:** `tsconfig.json` (root)
- **Key Settings:**
  - `jsx: "react-jsx"`: Enable JSX transform for Hono
  - `module: "Preserve"`: Preserve ESM module syntax
  - `moduleResolution: "bundler"`: Optimize for Vite bundler
  - `strict: true`: Enable all strict type checks

#### 5.1.2 Biome Configuration
- **Location:** `biome.json` (root)
- **Purpose:** Shared linting and formatting rules across all workspaces
- **Usage:**
  - `bun run format`: Format all files
  - `bun run lint`: Lint all files
  - `bun run check`: Combined format + lint

#### 5.1.3 Workspace Configuration
- **Location:** `package.json` (root)
- **Workspaces:** `["app", "com", "dev", "org", "net"]`
- **Benefits:**
  - Shared dependencies (Hono, Biome) installed once at root
  - Cross-workspace script execution
  - Unified versioning for common packages

---

## 6. Deployment Architecture

### 6.1 Per-Workspace Deployment
Each workspace deploys **independently** to Cloudflare Workers:

1. Developer runs `bun run deploy` in workspace directory
2. Vite builds the application bundle
3. Wrangler deploys the bundle to Cloudflare Workers
4. Domain-specific worker is updated (e.g., `my-app` for `app/`)

### 6.2 Deployment Flow Diagram
```
Developer
  └─> bun run deploy (in workspace)
       └─> vite build
            └─> Bundle TypeScript + JSX → JavaScript
                 └─> wrangler deploy
                      └─> Upload to Cloudflare Workers
                           └─> Worker deployed to edge
```

### 6.3 CI/CD Integration (Planned)
- GitHub Actions will be configured to:
  - Detect changed workspaces
  - Run tests for affected workspaces
  - Deploy only modified domains
  - Verify deployment via `/health` endpoints

---

## 7. Code Reuse Strategy

### 7.1 Current Approach: Minimal Sharing
By design, workspaces are **independent** with minimal code sharing:
- Each domain has distinct behavior and requirements
- Copying small utilities is preferred over premature abstraction
- Monorepo provides organizational benefits without tight coupling

### 7.2 Future Shared Components (Planned)
When common patterns emerge, the following may be extracted:

```
shared/
├── middleware/
│   ├── redirect.ts       (Canonicalization logic)
│   ├── locale.ts         (Query parameter validation)
│   └── telemetry.ts      (OpenTelemetry instrumentation)
├── utils/
│   ├── url.ts            (URL parsing/construction)
│   └── headers.ts        (Security headers)
└── types/
    └── common.ts         (Shared TypeScript types)
```

**Usage in workspaces:**
```typescript
import { redirectMiddleware } from "../../shared/middleware/redirect";
app.use(redirectMiddleware);
```

---

## 8. Observability & Operations (Planned)

### 8.1 Telemetry Events
- Emit redirect events with source host, normalized params, and destination
- Emit diagnostic events for health responses and errors
- Use OpenTelemetry exporters compatible with Cloudflare Workers

### 8.2 Health Endpoints
Each workspace will implement:
- `/health`: Simple JSON response `{ "status": "ok" }`
- `/v1/health`: Detailed JSON with version, uptime, region

### 8.3 Error Handling
- 400/500 error pages rendered as branded HTML (not redirects)
- Errors logged to OpenTelemetry with trace context
- Graceful degradation for missing KV data

---

## 9. Security Considerations

### 9.1 Per-Workspace Security Headers
Each workspace configures security headers via Hono middleware:
- `Strict-Transport-Security`: Enforce HTTPS
- `Content-Security-Policy`: Prevent XSS (domain-specific policies)
- `X-Frame-Options`: Prevent clickjacking
- `Referrer-Policy`: Control referrer information

### 9.2 Environment Variables Configuration
Each workspace requires the following environment variables for Rails backend integration:

**Required Variables:**
- `BRAND_NAME`: Brand display name (e.g., `"Umaxica"`)
- `EDGE_CORPORATE_URL`: Rails backend URL with regional subdomain
  - Example: `"https://jp.umaxica.com"` or `"https://us.umaxica.com"`
- `EDGE_SERVICE_URL`: Service portal Rails backend URL with regional subdomain
  - Example: `"https://jp.umaxica.app"` or `"https://us.umaxica.app"`
- `EDGE_ORGANIZATION_URL`: Organization portal Rails backend URL with regional subdomain
  - Example: `"https://jp.umaxica.org"` or `"https://us.umaxica.org"`
- `EDGE_STATUS_URL`: Status/development Rails backend URL with regional subdomain
  - Example: `"https://us.umaxica.dev"` or `"https://jp.umaxica.dev"`
- `DEFAULT_LOCALE`: Default locale code (e.g., `"ja"` for Japanese, `"en"` for English)
- `DEFAULT_REGION`: Default region code (e.g., `"jp"` for Japan, `"us"` for United States)

**Configuration Method:**
- For Cloudflare Workers: Set in `wrangler.jsonc` or via Cloudflare dashboard
- For Vercel: Set via Vercel dashboard or `.env` files (not committed)

**Regional Subdomain Pattern:**
All Rails backend URLs use the pattern `https://[region].umaxica.[tld]` where:
- `[region]` is a two-letter region code (jp, us, etc.)
- `[tld]` is the domain extension (com, app, org, dev)

### 9.3 Secrets Management
- Secrets stored in Cloudflare Workers environment variables
- Accessed via Wrangler configuration or runtime environment
- Never committed to version control

---

## 10. Testing Strategy

### 10.1 Per-Workspace Tests
- **Location:** `{workspace}/test/`
- **Framework:** Bun Test
- **Coverage:**
  - Unit tests for route handlers
  - Integration tests for middleware
  - Snapshot tests for rendered HTML

**Example test structure:**
```
app/test/
├── root-route.test.ts    (Test root "/" handler)
├── health.test.ts        (Test /health endpoint)
└── redirect.test.ts      (Test redirect logic)
```

### 10.2 Running Tests
```bash
# Test all workspaces
bun test

# Test specific workspace
cd app && bun test

# Test with coverage
bun test --coverage
```

---

## 11. Development Workflow

### 11.1 Local Development
1. Start Docker Compose environment: `docker compose up -d`
2. Attach to container: `docker exec -it edge-core-1 bash`
3. Navigate to workspace: `cd app/`
4. Start dev server: `bun run dev`
5. Access at `http://localhost:5071`

### 11.2 Development Ports (Docker)
| Workspace | Dev Port | Purpose |
|-----------|----------|---------|
| `app/` | 5071 | umaxica.app development |
| `com/` | 5072 | umaxica.com development |
| `org/` | 5073 | umaxica.org development |
| `net/` | 5074 | umaxica.net development |
| `dev/` | 5075 | umaxica.dev development |

### 11.3 Hot Module Replacement (HMR)
- Vite provides HMR for all JSX workspaces
- File changes trigger instant browser updates
- No need to restart dev server

---

## 12. Migration from Previous Architecture

### 12.1 What Changed
**Previous (documented but not implemented):**
- Single Hono application
- Centralized `src/router/portal.ts`
- Shared routing logic

**Current (implemented):**
- Monorepo with 5 independent Hono applications
- Per-domain customization
- Minimal code sharing

### 12.2 Rationale for Change
- **Flexibility:** Each domain can evolve independently
- **Deployment:** Deploy only changed domains
- **Performance:** Smaller bundle sizes per domain
- **Maintainability:** Clear separation of concerns

---

## 13. Future Work

### 13.1 Next Phase: Redirect Logic
- Implement www canonicalization middleware
- Add regional redirect logic (ri parameter)
- Integrate with Rails backend URLs

### 13.2 Next Phase: Static Assets
- Serve `favicon.ico`, `robots.txt`, `sitemap.xml`
- Configure CDN caching headers
- Domain-specific asset variants

### 13.3 Next Phase: Authentication
- Validate JWT cookies for personalized routing
- No token issuance (handled by Rails backend)
- Geolocation and User-Agent heuristics

### 13.4 Next Phase: Observability
- Implement OpenTelemetry instrumentation
- Configure exporter (Datadog, Honeycomb, etc.)
- Add distributed tracing for redirect chains

---

## 14. Appendices

### 14.1 File System Layout
```
umaxica-app-apex/
├── docs/                  (Project documentation)
│   ├── srs.md
│   ├── hld.md
│   ├── dds.md            (This file)
│   └── test.md
├── app/                  (umaxica.app workspace)
├── com/                  (umaxica.com workspace)
├── org/                  (umaxica.org workspace)
├── net/                  (umaxica.net workspace)
├── dev/                  (umaxica.dev workspace)
├── package.json          (Root workspace config)
├── tsconfig.json         (Shared TypeScript config)
├── biome.json            (Shared linter/formatter)
├── compose.yml           (Docker development environment)
└── Dockerfile            (Container definition)
```

### 14.2 Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| hono | 4.10+ | Web framework |
| vite | 6.3+ | Build tool |
| @cloudflare/vite-plugin | 1.2+ | Cloudflare Workers bundler |
| vite-ssr-components | 0.5+ | SSR utilities for Hono JSX |
| wrangler | 4.17+ | Cloudflare Workers CLI |
| bun | 1.3+ | Package manager & test runner |
| @biomejs/biome | 2.3+ | Linter & formatter |

---

> **Note:**
> This Detailed Design Specification (DDS) reflects the **current implementation** as of the latest code review.
> It supersedes previous architectural assumptions and aligns with the actual monorepo structure.
> Future phases will incrementally add redirect logic, static assets, authentication, and observability features.
