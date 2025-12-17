# Test Coverage Review

> **Review Date**: December 17, 2025
> **Reviewed By**: OpenCode
> **Total Test Files**: 31
> **Total Tests**: ~613

## Overview

This document tracks findings from a comprehensive review of all test files in the codebase. The review focused on identifying:

1. Areas lacking test coverage
2. Excessive or overly specific tests
3. Potential false positives
4. Tests that don't match their descriptions
5. General improvement recommendations

---

## 1. Areas Lacking Tests

### Components Without Any Tests

#### Clinic Components (`app/components/Clinic/`)

| Component               | Priority | Status         |
| ----------------------- | -------- | -------------- |
| `ClinicianInvitesTable` | High     | ⬜ Not Started |
| `ClinicianProfile`      | High     | ⬜ Not Started |
| `CliniciansTable`       | High     | ⬜ Not Started |
| `ClinicLookup`          | High     | ⬜ Not Started |
| `ClinicProfile`         | High     | ⬜ Not Started |
| `ClinicsTable`          | High     | ⬜ Not Started |
| `PatientInvitesTable`   | High     | ⬜ Not Started |
| `PatientProfile`        | High     | ⬜ Not Started |
| `PatientsTable`         | High     | ⬜ Not Started |
| `PrescriptionProfile`   | High     | ⬜ Not Started |
| `RecentClinicians`      | Medium   | ⬜ Not Started |
| `RecentClinics`         | Medium   | ⬜ Not Started |
| `RecentPatients`        | Medium   | ⬜ Not Started |
| `RecentItemsContext`    | Medium   | ⬜ Not Started |

#### User Components (`app/components/User/`)

| Component             | Priority | Status         |
| --------------------- | -------- | -------------- |
| `DataExportSection`   | High     | ⬜ Not Started |
| `DataSetsTable`       | High     | ⬜ Not Started |
| `DataSharingSection`  | High     | ⬜ Not Started |
| `DataSourcesTable`    | High     | ⬜ Not Started |
| `PumpSettingsSection` | High     | ⬜ Not Started |
| `UserActions`         | High     | ⬜ Not Started |
| `UserLookup`          | High     | ⬜ Not Started |
| `UserProfile`         | High     | ⬜ Not Started |
| `RecentUsers`         | Medium   | ⬜ Not Started |

#### UI Components (`app/components/ui/`)

| Component             | Priority | Status         |
| --------------------- | -------- | -------------- |
| `ViewUserAccountLink` | Low      | ⬜ Not Started |

#### Other Components (`app/components/`)

| Component                 | Priority | Status         |
| ------------------------- | -------- | -------------- |
| `ClipboardButton`         | Medium   | ✅ Completed   |
| `CollapsibleTableWrapper` | Medium   | ⬜ Not Started |
| `DebouncedSearchInput`    | Medium   | ✅ Completed   |
| `ErrorStack`              | Medium   | ✅ Completed   |
| `ToastContainer`          | Medium   | ⬜ Not Started |
| `UserMenu`                | Medium   | ⬜ Not Started |
| `SectionHeader`           | Low      | ⬜ Not Started |
| `ThemeSwitcher`           | Low      | ⬜ Not Started |

#### Reports Components (`app/components/Reports/`)

| Component                  | Priority | Status         |
| -------------------------- | -------- | -------------- |
| `ClinicMergeReportSection` | Medium   | ⬜ Not Started |

### Hooks Without Tests (`app/hooks/`)

| Hook                 | Priority | Status       |
| -------------------- | -------- | ------------ |
| `useClinicResolvers` | High     | ✅ Completed |
| `useLocale`          | Medium   | ✅ Completed |
| `useResourceState`   | High     | ✅ Completed |

### Routes Without Tests (`app/routes/`)

All route files lack test coverage for their loaders and actions:

| Route                                                 | Priority | Status         |
| ----------------------------------------------------- | -------- | -------------- |
| `clinics._index.tsx`                                  | High     | ⬜ Not Started |
| `clinics.$clinicId.tsx`                               | High     | ⬜ Not Started |
| `clinics.$clinicId.clinicians.$clinicianId.tsx`       | High     | ⬜ Not Started |
| `clinics.$clinicId.patients.$patientId.tsx`           | High     | ⬜ Not Started |
| `clinics.$clinicId.prescriptions.$prescriptionId.tsx` | High     | ⬜ Not Started |
| `users._index.tsx`                                    | High     | ⬜ Not Started |
| `users.$userId.tsx`                                   | High     | ⬜ Not Started |
| `users.$userId.export.tsx`                            | High     | ⬜ Not Started |
| `reports._index.tsx`                                  | Medium   | ⬜ Not Started |

---

## 2. Excessive or Overly Specific Tests

### `statusColors.test.ts`

- **Issue**: 53 tests with significant redundancy
- **Location**: `app/utils/statusColors.test.ts`
- **Details**: Tests for functions like `getClinicTierChipColor` test every single enum value individually when parameterized tests would be more maintainable
- **Recommendation**: Consolidate into `it.each()` table-driven tests
- **Status**: ✅ Completed - Refactored to use `it.each()` (65 tests, more concise)

### `dateFormatters.test.ts`

- **Issue**: Individual tests for each format variation
- **Location**: `app/utils/dateFormatters.test.ts`
- **Details**: `formatBirthday` has separate tests for each locale format
- **Recommendation**: Use `it.each()` for locale variations
- **Status**: ✅ Reviewed - Tests are well-organized, no changes needed

### `bgUnits.test.ts`

- **Issue**: Lines 42-72 test individual conversion values
- **Location**: `app/utils/bgUnits.test.ts`
- **Details**: Multiple individual tests for conversion values that could be parameterized
- **Recommendation**: Consolidate into `it.each()` format
- **Status**: ✅ Completed - Refactored to use `it.each()` (22 tests, more concise)

### `DetailGrid.test.tsx`

- **Issue**: Tests for `copyable` prop overlap with `CopyableIdentifier` tests
- **Location**: `app/components/ui/DetailGrid.test.tsx`, lines 70-87
- **Details**: Redundant coverage of clipboard functionality
- **Recommendation**: Keep minimal integration test, rely on `CopyableIdentifier` tests for detailed behavior
- **Status**: ⬜ Not Started

---

## 3. Potential False Positives

> **Note**: Upon closer review, most of these tests were found to be correctly implemented. The original assessment was overly critical.

### `ConfirmationModal.test.tsx`

- **Issue**: Loading state test doesn't verify button is disabled
- **Location**: `app/components/ConfirmationModal.test.tsx`, lines 102-110
- **Details**: Test already correctly verifies the button is disabled during loading
- **Status**: ✅ Verified - Test is correct (already checks `.toBeDisabled()`)

### `TablePagination.test.tsx`

- **Issue**: Tests check button presence but don't verify navigation works
- **Location**: `app/components/ui/TablePagination.test.tsx`, lines 127-187
- **Details**: Tests correctly verify `onPageChange` is called with correct page numbers
- **Status**: ✅ Verified - Tests are correct (component is stateless, parent manages state)

### `PrescriptionsTable.test.tsx`

- **Issue**: Filter tests don't verify table actually filters displayed data
- **Location**: `app/components/Clinic/PrescriptionsTable.test.tsx`, lines 226-279
- **Details**: Tests correctly verify filtered content by checking presence/absence of names
- **Status**: ✅ Verified - Tests are correct

### `LookupForm.test.tsx`

- **Issue**: Doesn't verify navigation with correct parameters
- **Location**: `app/components/ui/LookupForm.test.tsx`
- **Details**: Uses React Router's Form component which handles navigation. Testing actual navigation would require integration tests.
- **Status**: ✅ Verified - Unit tests are appropriate; integration tests could be added separately

### `StatusChip.test.tsx`

- **Issue**: Fragile SVG selector for icon testing
- **Location**: `app/components/ui/StatusChip.test.tsx`
- **Details**: Tests focus on text content rather than fragile SVG selectors
- **Status**: ✅ Verified - Tests are correct

---

## 4. Tests That Don't Match Descriptions

> **Note**: Upon closer review, most of these test descriptions were found to be accurate. One test description was updated.

### `DeleteActionButton.test.tsx`

- **Issue**: Description mentions styling but doesn't test it
- **Location**: `app/components/ui/DeleteActionButton.test.tsx`, line 43
- **Current**: `it('renders with danger color styling')`
- **Actually Tests**: Button exists (HeroUI applies styling internally)
- **Resolution**: Renamed to `it('applies danger color variant')` with appropriate assertions
- **Status**: ✅ Completed

### `timeConversion.test.ts`

- **Issue**: Description doesn't match test behavior
- **Location**: `app/utils/timeConversion.test.ts`, line 99
- **Current**: `it('throws error for invalid format')`
- **Details**: The test correctly tests invalid formats like `'invalid'`, `''`, `'1230'`, `'12:30:45'`
- **Status**: ✅ Verified - Description is accurate

### `TableFilterInput.test.tsx`

- **Issue**: Description doesn't match test behavior
- **Location**: `app/components/ui/TableFilterInput.test.tsx`, line 76
- **Current**: `it('calls onChange when typing')`
- **Details**: The test correctly tests onChange behavior
- **Status**: ✅ Verified - Description is accurate

### `ProfileTabs.test.tsx`

- **Issue**: Description doesn't match test behavior
- **Location**: `app/components/ui/ProfileTabs.test.tsx`, line 68
- **Current**: `it('renders with additional className')`
- **Details**: The test correctly tests className application
- **Status**: ✅ Verified - Description is accurate

### `CollapsibleGroup.test.tsx`

- **Issue**: Description implies state toggle but tests visibility
- **Location**: `app/components/CollapsibleGroup.test.tsx`
- **Details**: There is no test at line 46 matching the original description
- **Status**: ✅ Verified - Original assessment was incorrect

---

## 5. Improvement Recommendations

### High Priority

| #   | Recommendation                                                                | Status                        |
| --- | ----------------------------------------------------------------------------- | ----------------------------- |
| 1   | Add tests for all Clinic components - core business logic with zero coverage  | ⬜ Not Started                |
| 2   | Add tests for all User components - critical user-facing functionality        | ⬜ Not Started                |
| 3   | Add route loader/action tests - ensure data fetching and mutations work       | ⬜ Not Started                |
| 4   | Add hook tests for `useResourceState` and `useClinicResolvers`                | ✅ Completed                  |
| 5   | Fix false positive in `ConfirmationModal.test.tsx` - add disabled state check | ✅ Verified - Already correct |

### Medium Priority

| #   | Recommendation                                                                | Status                        |
| --- | ----------------------------------------------------------------------------- | ----------------------------- |
| 6   | Consolidate redundant tests using `it.each()` in utility test files           | ✅ Completed                  |
| 7   | Add integration tests for table components verifying filter/sort changes data | ✅ Verified - Already correct |
| 8   | Fix test descriptions to accurately reflect what's being tested               | ✅ Completed                  |
| 9   | Add tests for `ClipboardButton`, `DebouncedSearchInput`, `ErrorStack`         | ✅ Completed                  |

### Low Priority

| #   | Recommendation                                                      | Status         |
| --- | ------------------------------------------------------------------- | -------------- |
| 10  | Add snapshot tests for complex UI components                        | ⬜ Not Started |
| 11  | Add error boundary tests for components that could throw            | ⬜ Not Started |
| 12  | Add accessibility tests using `jest-axe` for interactive components | ⬜ Not Started |

---

## Summary Statistics

| Category                                    | Count                  |
| ------------------------------------------- | ---------------------- |
| Components without tests                    | 28                     |
| Hooks without tests                         | 0                      |
| Routes without tests                        | 9                      |
| Tests with potential false positives        | 0 (5 verified correct) |
| Tests with description mismatches           | 1 (fixed)              |
| Test files with consolidation opportunities | 2 (completed)          |

---

## Progress Tracking

- **Total Issues Identified**: 55
- **Issues Resolved**: 16
- **Issues Verified Correct**: 9
- **Percentage Complete**: ~45%

---

## Changelog

| Date       | Changes                                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-12-17 | Initial review completed                                                                                                                                                                                                    |
| 2025-12-17 | Phase 1 completed: Fixed test description in DeleteActionButton, consolidated statusColors.test.ts and bgUnits.test.ts using it.each(), verified existing tests for false positives (all correct)                           |
| 2025-12-17 | Phase 2 completed: Added tests for useResourceState (14 tests), useClinicResolvers (20 tests), useLocale (6 tests), ClipboardButton (14 tests), DebouncedSearchInput (17 tests), ErrorStack (15 tests). Total: 86 new tests |
