# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orca is a Tidepool internal admin tool built with React Router v7 (migrated from Remix) and server-side rendered via Express. It manages clinics, users, patients, clinicians, and device data through the Tidepool API.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking (also runs React Router typegen)
- `npm run format` - Format with Prettier
- `npm run format:check` - Check formatting
- `npm run test` - Run Vitest in watch mode
- `npm run test:run` - Run all tests once
- `npm run test:run -- path/to/file.test.tsx` - Run a single test file
- `npm run test:coverage` - Run tests with coverage

Always run `npm run format` after completing changes. Run `npm run test:run` before committing.

## Architecture

**Stack**: React 18 + React Router v7 + Vite + Express SSR + Tailwind CSS + HeroUI

**Key directories**:

- `app/routes/` - Flat-file routing with `$param` for dynamic segments (e.g., `clinics.$clinicId.tsx`)
- `app/components/` - Feature-organized components (`Clinic/`, `User/`, `Reports/`, `ui/`)
- `app/components/ui/` - Reusable UI primitives (check here before building new patterns)
- `app/utils/` - Shared utilities (formatters, converters, error classes)
- `app/schemas/` - Zod validation schemas
- `app/hooks/` - Custom hooks (`useLocale`, `usePersistedTab`, `useResourceState`)
- `app/layouts/` - Dashboard layout (sidebar + header)
- `app/test-utils/` - Custom `render` wrapping HeroUI provider

**Server-side files** (`.server.ts` suffix):

- `api.server.ts` - Centralized API route definitions and `apiRequest()`/`apiRequestSafe()` helpers
- `auth.server.ts` - Authentication logic with `authorizeServer()`
- `sessions.server.ts` - Cookie session storage (theme, users, clinics, patients, clinicians)

**Data flow**: Route `loader()` functions call the Tidepool API server-side via `apiRequest()` → components access data with `useLoaderData()` → mutations use `useSubmit()` with route `action()` functions.

**Path alias**: `~/` maps to `app/` (e.g., `import { apiRequest } from '~/api.server'`)

## Code Conventions

- **Formatting**: Prettier with single quotes, 2-space indent, no semicolons
- **Imports**: External packages first, then `~/` imports, then relative imports
- **Naming**: PascalCase for components/types and their files, camelCase for functions/variables and utility files
- **Types**: Prefer explicit prop types (`type XProps = {...}`). Use Zod schemas for validation, infer TS types with `z.infer<typeof Schema>`
- **Components**: HeroUI (`@heroui/react`) for UI primitives. Functional components with default exports
- **Code reuse**: Check `app/components/ui/` and `app/utils/` before building new patterns. See `docs/reusable-components-recommendations.md` for identified patterns
- **Routes**: Export `loader`/`action` for data, `meta` for metadata
- **Error handling**: Use `APIError`/`ValidationError` from `~/utils/errors` and `errorResponse()` in loaders/actions
- **Destructive actions**: Must use `ConfirmationModal` component requiring explicit user confirmation before API calls
- **Accessibility**: WCAG AA. Interactive elements need `aria-label` when not self-descriptive. Decorative icons get `aria-hidden="true"`. Tables need `aria-label`
- **Commit messages**: Conventional commit format (`feat:`, `fix:`, `docs:`, `refactor:`). Do not execute git commits — only provide the message for the user to review

## Testing

**Framework**: Vitest + React Testing Library

- Import `render` from `~/test-utils` (not `@testing-library/react` directly)
- Co-locate tests: `ComponentName.test.tsx` next to the component
- Use `userEvent.setup()` for interactions, accessible queries (`getByRole`, `getByLabelText`) over `getByTestId`
- Mock React Router hooks when needed:
  ```typescript
  vi.mock('react-router', async () => ({
    ...(await vi.importActual('react-router')),
    useLoaderData: () => mockData,
  }));
  ```
- HeroUI changes button text during loading (e.g., "Confirm" → "Loading Confirm") — use regex matchers for loading states

**Test structure**: Organize with `describe` blocks for Rendering, User Interactions, Conditional States, and Accessibility.

**Test quality**: Test behavior, not implementation. Don't test what TypeScript enforces. Avoid duplicate coverage. Every test should answer: "What bug would this catch that nothing else would?"

**Patterns**: Use `waitFor` for async state changes. Use `within()` to scope queries to specific table rows.

**What to test**: Complex state logic, user interactions with side effects, business rules, error handling, reusable utilities. **What to skip**: Thin wrappers, presentational-only components, CSS, third-party internals, route loaders/actions (prefer E2E). See `docs/testing-strategy.md` for component-level guidance.

## API Documentation

- Full API docs: https://tidepool.redocly.app/tidepool-apis
- Clinic API: https://tidepool.redocly.app/reference/clinic.v1
- Export API: https://tidepool.redocly.app/reference/export.v1
