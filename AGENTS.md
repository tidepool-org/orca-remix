# AGENTS.md

## Build/Lint/Test Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without changes

## Code Style Guidelines

- **Formatting**: Prettier with single quotes, 2-space tabs, no semicolons (implicit)
- **Imports**: Use `~/` alias for app imports (e.g., `~/components/...`). Order: external packages, then `~/` imports, then relative imports
- **Types**: Use Zod schemas for validation (`app/schemas/`), infer TS types with `z.infer<typeof Schema>`. Prefer explicit types for props (`type XProps = {...}`)
- **Naming**: PascalCase for components/types, camelCase for functions/variables. Files: PascalCase for components, camelCase for utilities
- **Components**: Use HeroUI (`@heroui/react`) for UI primitives. Functional components with default exports
- **Error Handling**: Use custom error classes (`APIError`, `ValidationError`) from `~/utils/errors`. Use `errorResponse()` helper in loaders/actions
- **Destructive Actions**: All destructive actions (delete, disconnect, revoke, etc.) must display a confirmation modal requiring explicit user action before dispatching the API call. Use the `ConfirmationModal` component from `~/components/ConfirmationModal`
- **React Router**: Routes in `app/routes/` with flat-file convention. Export `loader`/`action` for data, `meta` for metadata
- **State**: Use React hooks, `useLoaderData`/`useActionData` for route data, `useSubmit` for form submissions
- **Styling**: Tailwind CSS with HeroUI theme. Use `className` props for styling

## API Documentation

- **Full API docs**: https://tidepool.redocly.app/tidepool-apis
- **Clinic API** (clinics, patients, clinicians): https://tidepool.redocly.app/reference/clinic.v1
- **Export API**: https://tidepool.redocly.app/reference/export.v1

## Workflow

- **Code Formatting**: After completing a set of changes, run `npm run format` to ensure consistent code formatting with Prettier.
- **Commit Messages**: After completing a set of changes, provide a suitable git commit message summarizing the work done. Use conventional commit format (e.g., `feat:`, `fix:`, `docs:`, `refactor:`) when appropriate.
