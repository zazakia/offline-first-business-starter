# ADR 001: Use Turborepo for Monorepo Management

## Status
Accepted

## Context
We need a monorepo tool that supports multiple packages (shared types, UI, adapters, entities) and multiple apps (web, mobile, desktop).

## Decision
Use Turborepo with pnpm workspaces.

## Rationale
- Turborepo has the best DX for parallel builds, caching, and dependency graph
- pnpm is faster and stricter than npm/yarn
- Both are well-maintained and widely adopted

## Consequences
- All packages must be defined in `pnpm-workspace.yaml`
- `turbo.json` controls the build pipeline
- Dependencies between packages are managed via workspace protocol (`workspace:*`)
