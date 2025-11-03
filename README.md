# Umaxica App (APEX)
（ ＾ν＾） Hello, World!

## Project Documentation
- **Software Requirements Specification:** See `docs/srs.md` for the full scope, edge redirect requirements, and the decision to manage infrastructure and configuration via Terraform-backed provisioning.
- **High-Level Design:** Refer to `docs/hld.md` for the monorepo architecture built around per-domain Hono apps on Vercel and Cloudflare Workers, along with the infrastructure-as-code, observability, and deployment principles.
- **Detailed Design Specification:** `docs/dds.md` covers per-workspace structure, tooling (Bun workspaces, Vite, Wrangler), and planned shared components and telemetry.
- **Test Specification:** Testing strategy, environments, and coverage expectations are documented in `docs/test.md`, including Terraform-managed staging/production environments and the automation stack (Playwright, Bun Test, Biome, Lighthouse CI, k6).

Each document is intended to evolve with the implementation; update both the corresponding doc and this README section whenever requirements, design decisions, or testing obligations change.

## Known Issues & Limitations
- This is a work in progress.
- The public availability of this repository is not guaranteed permanently.
- No warranty is provided, and the authors shall not be held liable for any damages arising from the use of this repository.


