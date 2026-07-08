# ADR 002: Use Repository Pattern for Data Access

## Status
Accepted

## Context
We need to support multiple database engines (IndexedDB on web, SQLite on mobile/desktop, Postgres on server) without changing business logic.

## Decision
All data access goes through the `Repository<T>` interface (6 methods). Each platform provides its own implementation.

## Rationale
- Business logic is completely decoupled from storage
- Adding a new platform = implementing 6 methods
- Testing is easy — mock the repository
- Swap databases without touching entity code

## Consequences
- Every entity needs a repository instance at the app level
- Complex queries may need raw access to the underlying DB (escape hatch via `findMany` with filters)
- Cross-entity transactions require coordination at the app level
