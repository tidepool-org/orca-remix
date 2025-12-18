# Testing Strategy

> **Created**: December 18, 2025
> **Purpose**: Define when and how to write tests to maximize value while minimizing maintenance burden

## Core Principles

1. **Test behavior, not implementation** - Tests should verify what the component does, not how it does it
2. **Prefer fewer, high-value tests** - One well-designed test is better than five redundant ones
3. **Tests are code too** - They require maintenance; only write tests that earn their keep
4. **TypeScript is your first line of defense** - Don't test what the compiler already enforces

---

## Decision Matrix: When to Write Unit Tests

### Write Unit Tests When

| Criteria                                | Examples                                                        |
| --------------------------------------- | --------------------------------------------------------------- |
| **Complex state logic**                 | Filtering, sorting, pagination state machines                   |
| **User interactions with side effects** | Form submissions, delete confirmations, toggle behaviors        |
| **Business rule validation**            | Data transformations, status calculations, permission checks    |
| **Conditional rendering with logic**    | Showing/hiding based on computed values, not just prop presence |
| **Error handling paths**                | API error states, validation errors, edge cases                 |
| **Reusable utility functions**          | Date formatters, unit converters, string manipulators           |

### Skip Unit Tests When

| Criteria                         | Examples                             | Why Skip                           |
| -------------------------------- | ------------------------------------ | ---------------------------------- |
| **Thin wrapper components**      | `ClinicLookup` wrapping `LookupForm` | Parent component is already tested |
| **Purely presentational**        | Components that only render props    | TypeScript enforces prop types     |
| **CSS/styling verification**     | Testing that a class is applied      | Fragile, low value                 |
| **TypeScript-enforced props**    | Required props, type constraints     | Compiler catches these             |
| **Third-party library behavior** | HeroUI component internals           | Library maintainers test this      |
| **Simple delegation patterns**   | Components that pass props through   | Integration tests catch issues     |

---

## Component Testing Value Assessment

### High-Value Components (Recommended for Unit Tests)

These components have complex logic, state management, or user interactions that benefit from unit testing:

#### Clinic Components

| Component               | Reason to Test                           |
| ----------------------- | ---------------------------------------- |
| `ClinicianInvitesTable` | Filtering, sorting, status-based actions |
| `ClinicianProfile`      | Complex data display, multiple actions   |
| `CliniciansTable`       | Filtering, sorting, row selection        |
| `ClinicProfile`         | Settings toggles, tier display logic     |
| `ClinicsTable`          | Search, filtering, pagination            |
| `PatientInvitesTable`   | Status-based filtering, bulk actions     |
| `PatientProfile`        | Permission checks, data relationships    |
| `PatientsTable`         | Complex filtering, sorting, selection    |
| `RecentItemsContext`    | State management, localStorage sync      |

#### User Components

| Component             | Reason to Test                         |
| --------------------- | -------------------------------------- |
| `DataExportSection`   | Export triggers, status polling        |
| `DataSetsTable`       | Data display, filtering                |
| `DataSharingSection`  | Permission toggles, confirmation flows |
| `DataSourcesTable`    | Source status display, actions         |
| `PumpSettingsSection` | Complex nested data display            |
| `UserActions`         | Multiple action buttons, confirmations |
| `UserProfile`         | Tabbed interface, data aggregation     |

#### Other

| Component                  | Reason to Test                              |
| -------------------------- | ------------------------------------------- |
| `ClinicMergeReportSection` | Complex report display, data transformation |

### Low-Value Components (Skip Unit Tests)

These components are thin wrappers or purely presentational. Integration/E2E tests provide sufficient coverage:

| Component             | Reason to Skip                           |
| --------------------- | ---------------------------------------- |
| `ClinicLookup`        | Thin wrapper around `LookupForm`         |
| `UserLookup`          | Thin wrapper around `LookupForm`         |
| `PrescriptionProfile` | Mostly data display, minimal logic       |
| `RecentClinicians`    | Thin wrapper around `RecentItemsTable`   |
| `RecentClinics`       | Thin wrapper around `RecentItemsTable`   |
| `RecentPatients`      | Thin wrapper around `RecentItemsTable`   |
| `RecentUsers`         | Thin wrapper around `RecentItemsTable`   |
| `UserMenu`            | Simple dropdown, HeroUI handles behavior |
| `ViewUserAccountLink` | Simple link component                    |

---

## E2E vs Unit Test Decision Guide

| Scenario                         | Test Type | Rationale                            |
| -------------------------------- | --------- | ------------------------------------ |
| Route loaders/actions            | E2E       | Tests real API integration           |
| Multi-step user flows            | E2E       | Validates complete journeys          |
| Form submission → API → redirect | E2E       | Too many mocks needed for unit tests |
| Complex component state          | Unit      | Fast feedback, isolated testing      |
| Utility function logic           | Unit      | Pure functions, easy to test         |
| Error boundary behavior          | Unit      | Can simulate errors easily           |

### Route Testing Strategy

Routes in `app/routes/` contain loaders and actions that interact with APIs. These are better tested with E2E tests because:

1. **Mocking complexity** - Loaders depend on auth, API clients, and request context
2. **Integration value** - The real value is testing the full request/response cycle
3. **Maintenance burden** - Unit tests for loaders require extensive mocking that breaks with refactors

**Recommendation**: Prioritize E2E tests for route coverage rather than unit testing loaders/actions.

---

## Test Quality Guidelines

### What Makes a Good Test

```typescript
// GOOD: Tests behavior
it('filters patients by search term', async () => {
  render(<PatientsTable patients={mockPatients} />)
  await userEvent.type(screen.getByRole('searchbox'), 'john')
  expect(screen.getByText('John Doe')).toBeInTheDocument()
  expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
})

// BAD: Tests implementation
it('sets filterText state when typing', async () => {
  // Testing internal state is fragile
})
```

### What to Avoid

1. **Snapshot tests for dynamic content** - Break frequently, provide little insight
2. **Testing CSS classes** - Fragile, not behavior-focused
3. **Testing prop drilling** - TypeScript handles this
4. **Duplicate coverage** - If `CopyableIdentifier` is tested, don't re-test copy behavior in every component that uses it

---

## Existing Test Assessment

### Tests That May Be Over-Engineering

These test files provide limited value relative to their maintenance cost:

| Test File                          | Assessment                              | Recommendation    |
| ---------------------------------- | --------------------------------------- | ----------------- |
| `SectionHeader.test.tsx`           | Tests a simple presentational component | Consider removing |
| `ThemeSwitcher.test.tsx`           | Tests HeroUI dropdown behavior          | Consider removing |
| `CollapsibleTableWrapper.test.tsx` | Tests simple wrapper logic              | Consider removing |

### Tests Worth Keeping

All tests in `app/components/ui/` for interactive components like:

- `ConfirmationModal` - Complex interaction flow
- `DeleteActionButton` - Confirmation behavior
- `TablePagination` - Stateful navigation
- `ProfileTabs` - Tab switching logic

---

## Testing Checklist for New Components

Before writing tests, ask:

- [ ] Does this component have logic beyond prop display?
- [ ] Are there user interactions with side effects?
- [ ] Is there conditional rendering based on computed values?
- [ ] Would a bug here be caught by E2E tests anyway?
- [ ] Is this component reused across multiple features?

If most answers are "no", consider skipping unit tests and relying on E2E coverage.

---

## Summary

| Category                              | Unit Test | E2E Test | Skip |
| ------------------------------------- | --------- | -------- | ---- |
| Complex tables with filtering/sorting | Yes       | Also     | -    |
| Forms with validation                 | Yes       | Also     | -    |
| State management hooks                | Yes       | -        | -    |
| Utility functions                     | Yes       | -        | -    |
| Thin wrapper components               | -         | Yes      | Unit |
| Route loaders/actions                 | -         | Yes      | Unit |
| Purely presentational                 | -         | Maybe    | Unit |
| Third-party component wrappers        | -         | Maybe    | Unit |

**Goal**: Maximize confidence per test written. Every test should answer: "What bug would this catch that nothing else would?"
