# Repository Guidelines

## Project Structure & Module Organization
- Current layout is lightweight (`README.md`, `.github/workflows/blank.yml`, `.gitignore`); keep scaffolding tidy while the stack is finalized.
- Place runtime code under `src/` grouped by feature (for example, `src/api/status`, `src/ui/components`). Co-locate feature tests or provide mirrored folders under `tests/`.
- Store static assets in `public/` and keep a README there listing generated files.
- Add short module READMEs or docstrings that explain contracts, especially for any status polling or incident models.

## Build, Test, and Development Commands
- Initialize the workspace with `npm init -y` (or `pnpm init`) before adding dependencies; commit the resulting manifest.
- Use `npm install` to sync dependencies and check `package-lock.json` into version control.
- Standard scripts once the app is scaffolded:
  - `npm run dev` – run the local status dashboard (e.g., via Vite or Next.js). Keep it hot-reloading-friendly.
  - `npm test` – execute the full test suite (Jest/Vitest). Ensure CI invokes this command.
  - `npm run build` – produce the production bundle; keep output under `dist/`.
  - `npm run lint` – run ESLint/Prettier checks; fail fast on formatting issues.

## Coding Style & Naming Conventions
- Prefer TypeScript for new modules; use `.ts`/`.tsx`, 2-space indentation, and semicolons.
- Keep file names kebab-case (`status-panel.tsx`) and React components PascalCase (`StatusPanel`).
- Configure Prettier and ESLint (`typescript-eslint` preset). Run `npm run lint -- --fix` before committing formatting changes.
- Store secrets in `.env.local`; never commit credential files or private tokens.

## Testing Guidelines
- Adopt Vitest or Jest with Testing Library for UI components; create shared helpers under `tests/utils/`.
- Name spec files `<feature>.spec.ts` (unit) and `<feature>.test.ts` (integration). Keep fixtures small and colocated.
- Target ≥80% line coverage once core modules exist; add coverage thresholds to `vitest.config.ts` or `jest.config.ts`.
- Run `npm test -- --watch` during active development; ensure CI uses `npm test -- --runInBand` for deterministic output.

## Commit & Pull Request Guidelines
- Existing history (`Create blank.yml`, `Initial commit`) uses short imperative subjects—continue that style (e.g., “Add status polling hook”).
- Keep commit bodies focused on what changed and why; reference issue IDs (`Refs #42`) when applicable.
- Pull requests should ship with a short summary, screenshots or logs for UX/API changes, a test plan (`npm test`, manual checks), and deployment notes if relevant.
- Request review after CI passes. Address feedback with follow-up commits; avoid force-push unless rebasing an in-flight branch.
