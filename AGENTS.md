# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm/Turborepo TypeScript monorepo. Applications live in `apps/`: `apps/web` is the Vite web client and `apps/desktop` is the desktop client. Reusable domain and platform modules live in `packages/`, including `entity-*` packages, `core`, database adapters, `ui-core`, and `sync-engine`. Keep package source in `packages/<package>/src/` and expose public APIs through `src/index.ts`. End-to-end tests are in `e2e/`; design and architecture references are in `docs/`.

## Build, Test, and Development Commands

Use Node 20+ and pnpm 9+.

- `pnpm install` — install all workspace dependencies.
- `pnpm dev` — run development tasks through Turborepo.
- `pnpm build` — build every workspace package and application.
- `pnpm test` — run package test tasks (Vitest where configured).
- `pnpm lint` — run configured lint tasks across the workspace.
- `pnpm format` — format TypeScript, TSX, JSON, and Markdown with Prettier.
- `pnpm exec playwright test` — run the Playwright suite in `e2e/`.
- `pnpm codegen` — run the workspace code generator.

Target a package while iterating, for example: `pnpm --filter @clinic/core test`.

## Coding Style & Naming Conventions

Write TypeScript with two-space indentation and let Prettier control formatting. Use `camelCase` for functions and variables, `PascalCase` for React components and exported types, and kebab-case package names. Follow the established domain layout: `patient.entity.ts`, `patient.schema.ts`, `patient.service.ts`, `patient.policies.ts`, and `patient.hooks.ts`. Keep cross-package imports on each package’s public `index.ts` boundary rather than reaching into internal files.

## Testing Guidelines

Place unit tests in `src/__tests__/` and name them `*.test.ts` or `*.test.tsx`. Add or update a focused unit test for behavior changes; use `e2e/*.spec.ts` for user-facing workflows. Run the affected package test before the workspace suite, then run `pnpm test` and relevant Playwright coverage before opening a PR.

## Commit & Pull Request Guidelines

Recent commits use short, imperative subjects, such as `Preserve recent mobile project configuration updates`. Keep each commit focused and explain the user-visible or architectural reason. PRs should summarize scope, link the relevant issue or plan, list verification commands, and include screenshots for UI changes. Call out schema, generated-code, or configuration changes explicitly.

## Security & Configuration

Do not commit credentials or environment-specific settings. Treat `docs/supabase/schema.sql` as a reviewed database contract; document migrations and validate affected application flows before merging.
