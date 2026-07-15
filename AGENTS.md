# AGENTS.md

## Build/Lint/Test Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without changes
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report

## Code Style Guidelines

- **Formatting**: Prettier with single quotes, 2-space tabs, no semicolons (implicit)
- **Imports**: Use `~/` alias for app imports (e.g., `~/components/...`). Order: external packages, then `~/` imports, then relative imports
- **Types**: Use Zod schemas for validation (`app/schemas/`), infer TS types with `z.infer<typeof Schema>`. Prefer explicit types for props (`type XProps = {...}`)
- **Naming**: PascalCase for components/types, camelCase for functions/variables. Files: PascalCase for components, camelCase for utilities
- **Components**: Use HeroUI (`@heroui/react`) for UI primitives. Functional components with default exports
- **Code Reuse**: Before implementing new UI patterns, check `app/components/ui/` for existing reusable components and `app/utils/` for shared utilities. When adding new functionality, look for opportunities to extract repeated patterns into shared components. See `docs/reusable-components-recommendations.md` for identified patterns
- **Error Handling**: Use custom error classes (`APIError`, `ValidationError`) from `~/utils/errors`. Use `errorResponse()` helper in loaders/actions
- **Destructive Actions**: All destructive actions (delete, disconnect, revoke, etc.) must display a confirmation modal requiring explicit user action before dispatching the API call. Use the `ConfirmationModal` component from `~/components/ConfirmationModal`
- **React Router**: Routes in `app/routes/` with flat-file convention. Export `loader`/`action` for data, `meta` for metadata
- **State**: Use React hooks, `useLoaderData`/`useActionData` for route data, `useSubmit` for form submissions
- **Styling**: Tailwind CSS with HeroUI theme. Use `className` props for styling
- **Accessibility**: Follow WCAG AA guidelines. All interactive elements (buttons, inputs, toggles) must have `aria-label` attributes when not self-descriptive. Decorative icons should have `aria-hidden="true"`. Tables must have `aria-label` describing their content

## API Documentation

- **Full API docs**: https://tidepool.redocly.app/tidepool-apis
- **Clinic API** (clinics, patients, clinicians): https://tidepool.redocly.app/reference/clinic.v1
- **Export API**: https://tidepool.redocly.app/reference/export.v1

## Workflow

- **Code Formatting**: After completing a set of changes, run `npm run format` to ensure consistent code formatting with Prettier.
- **Commit Messages**: After completing a set of changes, provide a suitable git commit message summarizing the work done. Use conventional commit format (e.g., `feat:`, `fix:`, `docs:`, `refactor:`) when appropriate. **Do not execute the git commit** - only provide the message for the user to review and commit themselves.

## Testing Guidelines

- **Framework**: Vitest with React Testing Library for component testing
- **File Naming**: Test files should be co-located with components using `*.test.tsx` suffix (e.g., `ConfirmationModal.test.tsx`)
- **Test Utilities**: Import from `~/test-utils` instead of `@testing-library/react` directly. This provides a custom `render` function that wraps components with necessary providers (HeroUI)
- **Coverage Requirements**: New components should include tests for:
  - Basic rendering and props
  - User interactions (clicks, form inputs)
  - Conditional rendering states
  - Accessibility (buttons have proper labels, etc.)
- **Mocking React Router**: For components using `useLoaderData`, `useActionData`, or `useSubmit`, mock the `react-router` module:
  ```typescript
  vi.mock('react-router', async () => ({
    ...(await vi.importActual('react-router')),
    useLoaderData: () => mockData,
  }));
  ```
- **HeroUI Notes**: HeroUI modifies button accessible names when loading (e.g., "Confirm" becomes "Loading Confirm"). Use regex matchers like `/Loading Confirm/i` when testing loading states
- **Running Tests**: Run `npm run test:run` before committing to ensure all tests pass

### Test Value Assessment

Before writing tests, evaluate whether they provide sufficient value. Not all components need unit tests.

**Write unit tests when:**

- Complex state logic (filtering, sorting, pagination)
- User interactions with side effects (form submissions, delete confirmations)
- Business rule validation (data transformations, permission checks)
- Reusable utility functions (date formatters, converters)
- Error handling paths (API errors, validation errors)

**Skip unit tests when:**

- Thin wrapper components (e.g., `ClinicLookup` wrapping `LookupForm` - parent is already tested)
- Purely presentational components (TypeScript enforces prop types)
- CSS/styling verification (fragile, low value)
- Third-party library behavior (HeroUI internals)
- Route loaders/actions (prefer E2E tests - too much mocking required)

**Test quality guidelines:**

- Test behavior, not implementation ("filters patients by search term" not "sets filterText state")
- Don't test what TypeScript already enforces (required props, type constraints)
- Avoid duplicate coverage (if `CopyableIdentifier` is tested, don't re-test copy behavior in every component using it)
- Every test should answer: "What bug would this catch that nothing else would?"

See `docs/testing-strategy.md` for detailed component assessments and examples.

### Test Structure Best Practices

Organize tests using `describe` blocks for logical groupings:

```typescript
describe('ComponentName', () => {
  describe('Rendering', () => {
    // Basic rendering tests
  });

  describe('User Interactions', () => {
    // Click handlers, form inputs, etc.
  });

  describe('Conditional States', () => {
    // Loading, error, empty states
  });

  describe('Accessibility', () => {
    // aria-labels, roles, etc.
  });
});
```

### Common Testing Patterns

- **User Events**: Use `userEvent.setup()` for simulating user interactions
- **Async Operations**: Use `await` with user events and `waitFor` for async state changes
- **Finding Elements**: Prefer accessible queries (`getByRole`, `getByLabelText`) over `getByTestId`
- **Table Testing**: Use `within()` to scope queries to specific table rows
