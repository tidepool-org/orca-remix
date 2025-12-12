# Reusable Components & Utilities Recommendations

This document outlines opportunities to refactor commonly repeated UI patterns and code functionality into shared reusable components and utilities. Implementing these recommendations will improve maintainability and ensure visual consistency across the application.

---

## Table of Contents

1. [High-Priority UI Components](#high-priority-ui-components)
2. [Medium-Priority UI Components](#medium-priority-ui-components)
3. [Lower-Priority UI Components](#lower-priority-ui-components)
4. [Shared Utility Functions](#shared-utility-functions)
5. [Implementation Notes](#implementation-notes)

---

## High-Priority UI Components

### 1. `DetailsToggleButton` - Show/Hide Details Button

**Current State:** The "Show Details" / "Hide Details" toggle button pattern is duplicated across **5 profile components** with nearly identical styling and behavior.

**Files Affected:**

- `app/components/Clinic/ClinicProfile.tsx` (lines 274-286)
- `app/components/Clinic/ClinicianProfile.tsx` (lines 155-167)
- `app/components/Clinic/PatientProfile.tsx` (lines 116-128)
- `app/components/Clinic/PrescriptionProfile.tsx` (lines 100-112)
- `app/components/User/UserProfile.tsx` (lines 110-122)

**Duplicated Code Pattern:**

```tsx
<button
  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
  className="flex items-center gap-1 text-sm text-primary hover:text-primary-600 transition-colors"
  aria-expanded={isDetailsExpanded}
  aria-label={isDetailsExpanded ? 'Hide details' : 'Show details'}
>
  <span>{isDetailsExpanded ? 'Hide Details' : 'Show Details'}</span>
  {isDetailsExpanded ? (
    <ChevronUp className="w-4 h-4" aria-hidden="true" />
  ) : (
    <ChevronDown className="w-4 h-4" aria-hidden="true" />
  )}
</button>
```

**Recommended Component:**

```tsx
// app/components/DetailsToggleButton.tsx
type DetailsToggleButtonProps = {
  isExpanded: boolean;
  onToggle: () => void;
  expandedText?: string;
  collapsedText?: string;
};

export default function DetailsToggleButton({
  isExpanded,
  onToggle,
  expandedText = 'Hide Details',
  collapsedText = 'Show Details',
}: DetailsToggleButtonProps) { ... }
```

**Benefits:**

- Single source of truth for styling
- Consistent accessibility attributes
- Easy to update toggle styling site-wide

---

### 2. `ProfileHeader` - Collapsible Profile Header Section

**Current State:** All 5 profile pages share an identical layout pattern consisting of:

1. Row 1: Title/name + toggle button
2. Row 2: Copyable identifiers (IDs, emails, etc.)
3. Collapsible details grid section

**Files Affected:**

- `app/components/Clinic/ClinicProfile.tsx` (lines 270-344)
- `app/components/Clinic/ClinicianProfile.tsx` (lines 150-233)
- `app/components/Clinic/PatientProfile.tsx` (lines 111-258)
- `app/components/Clinic/PrescriptionProfile.tsx` (lines 84-165)
- `app/components/User/UserProfile.tsx` (lines 105-181)

**Recommended Component:**

```tsx
// app/components/ProfileHeader.tsx
type ProfileHeaderProps = {
  title: string | React.ReactNode;
  identifiers: Array<{
    label?: string;
    value: string;
    copyable?: boolean;
  }>;
  detailsGrid?: React.ReactNode;
  isDetailsExpanded?: boolean;
  onToggleDetails?: () => void;
  rightContent?: React.ReactNode; // For chips, badges, etc.
};
```

**Benefits:**

- Standardized profile header layout
- Consistent identifier display with copy buttons
- Unified collapsible behavior

---

### 3. `CopyableIdentifier` - Copyable ID/Value Display

**Current State:** The pattern of displaying an ID/value with a clipboard copy button is repeated extensively throughout the codebase.

**Files Affected:**

- `app/components/Clinic/ClinicProfile.tsx` (lines 291-302)
- `app/components/Clinic/ClinicianProfile.tsx` (lines 172-183)
- `app/components/Clinic/PatientProfile.tsx` (lines 133-159)
- `app/components/Clinic/PrescriptionProfile.tsx` (lines 117-128, 176-193)
- `app/components/User/UserProfile.tsx` (lines 127-137)
- Various table cell renderers

**Duplicated Code Pattern:**

```tsx
<span className="flex items-center gap-1 text-default-500">
  <span className="text-default-400">ID:</span>
  <span className="font-mono text-xs">{id}</span>
  <ClipboardButton clipboardText={id} />
</span>
```

**Recommended Component:**

```tsx
// app/components/CopyableIdentifier.tsx
type CopyableIdentifierProps = {
  label?: string;
  value: string;
  showCopyButton?: boolean;
  variant?: 'default' | 'compact' | 'inline';
  labelClassName?: string;
  valueClassName?: string;
};
```

**Benefits:**

- Consistent styling for all identifier displays
- Optional labels and copy functionality
- Easy visual updates

---

### 4. `ProfileDetailGrid` - Detail Grid with Label/Value Pairs

**Current State:** All profile pages display details in a responsive grid with consistent styling for labels (small, muted text) and values.

**Files Affected:**

- `app/components/Clinic/ClinicProfile.tsx` (lines 308-342)
- `app/components/Clinic/ClinicianProfile.tsx` (lines 188-229)
- `app/components/Clinic/PatientProfile.tsx` (lines 165-253)
- `app/components/Clinic/PrescriptionProfile.tsx` (lines 134-163, 173-230)
- `app/components/User/UserProfile.tsx` (lines 143-177)

**Duplicated Code Pattern:**

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
  <div>
    <span className="text-default-400 block text-xs">Label</span>
    <span className="text-default-600">Value</span>
  </div>
  ...
</div>
```

**Recommended Component:**

```tsx
// app/components/ProfileDetailGrid.tsx
type DetailItem = {
  label: string;
  value: React.ReactNode;
  hidden?: boolean;
};

type ProfileDetailGridProps = {
  items: DetailItem[];
  columns?: 2 | 3 | 4 | 5;
};
```

**Benefits:**

- Consistent label/value styling
- Responsive column handling
- Easy to conditionally hide items

---

### 5. `ProfileTabs` - Standardized Tabs Wrapper

**Current State:** All profile pages using tabs share identical `Tabs` configuration and styling.

**Files Affected:**

- `app/components/Clinic/ClinicProfile.tsx` (lines 349-359)
- `app/components/Clinic/ClinicianProfile.tsx` (lines 240-250)
- `app/components/Clinic/PatientProfile.tsx` (lines 265-275)
- `app/components/User/UserProfile.tsx` (lines 210-220)

**Duplicated Code Pattern:**

```tsx
<Tabs
  aria-label="..."
  variant="underlined"
  classNames={{
    tabList: 'gap-4 w-full relative rounded-none p-0 border-b border-divider',
    cursor: 'w-full bg-primary',
    tab: 'max-w-fit px-2 h-12',
    tabContent: 'group-data-[selected=true]:text-primary',
  }}
>
```

**Recommended Component:**

```tsx
// app/components/ProfileTabs.tsx
type ProfileTabsProps = {
  'aria-label': string;
  children: React.ReactNode;
  defaultSelectedKey?: string;
};
```

**Benefits:**

- Single place to update tab styling
- Consistent visual appearance across profiles
- Reduces boilerplate in profile components

---

### 6. `TabWithBadge` - Tab Title with Count Badge

**Current State:** Almost every tab across profiles shows an icon, label, and optional count badge with identical styling.

**Files Affected:**

- All profile files with tabs (ClinicProfile, ClinicianProfile, PatientProfile, UserProfile)
- Approximately 15+ instances

**Duplicated Code Pattern:**

```tsx
<Tab
  key="data"
  title={
    <div className="flex items-center gap-2">
      <Database className="w-4 h-4" />
      <span>Data</span>
      {totalDataSets > 0 && (
        <span className="text-xs bg-default-100 px-1.5 py-0.5 rounded-full">
          {totalDataSets}
        </span>
      )}
    </div>
  }
>
```

**Recommended Component:**

```tsx
// app/components/TabWithBadge.tsx
type TabWithBadgeProps = {
  icon: LucideIcon;
  label: string;
  count?: number;
  showBadge?: boolean;
};
```

---

## Medium-Priority UI Components

### 7. `TableEmptyState` - Empty Table Placeholder

**Current State:** Every table component has a nearly identical empty state with an icon and message.

**Files Affected:**

- `app/components/Clinic/PatientsTable.tsx` (lines 315-322)
- `app/components/Clinic/CliniciansTable.tsx` (lines 189-199)
- `app/components/Clinic/ClinicsTable.tsx` (lines 214-222)
- `app/components/Clinic/PrescriptionsTable.tsx` (lines 205-213)
- `app/components/Clinic/PatientInvitesTable.tsx` (lines 177-184)
- `app/components/Clinic/ClinicianInvitesTable.tsx` (lines 161-174)
- `app/components/User/DataSetsTable.tsx` (lines 301-306)
- `app/components/User/DataSourcesTable.tsx` (lines 317-325)
- `app/components/User/DataSharingSection.tsx` (multiple instances)

**Duplicated Code Pattern:**

```tsx
<div className="flex flex-col items-center justify-center py-8">
  <Icon className="w-12 h-12 text-default-300 mb-4" aria-hidden="true" />
  <span className="text-default-500">Message</span>
</div>
```

**Recommended Component:**

```tsx
// app/components/TableEmptyState.tsx
type TableEmptyStateProps = {
  icon: LucideIcon;
  message: string;
  subMessage?: string;
};
```

---

### 8. `TableLoadingState` - Table Loading Spinner

**Current State:** Every table has an identical loading state with a centered spinner.

**Files Affected:** Same as TableEmptyState (all table components)

**Duplicated Code Pattern:**

```tsx
<div className="flex justify-center py-8">
  <Spinner size="lg" label="Loading..." />
</div>
```

**Recommended Component:**

```tsx
// app/components/TableLoadingState.tsx
type TableLoadingStateProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
};
```

---

### 9. `TableFilterInput` - Filter/Search Input for Tables

**Current State:** Multiple tables have local filter inputs with nearly identical configuration.

**Files Affected:**

- `app/components/Clinic/ClinicsTable.tsx` (lines 74-93)
- `app/components/Clinic/PrescriptionsTable.tsx` (lines 56-75)
- `app/components/User/DataSetsTable.tsx` (lines 343-366)
- `app/components/User/DataSourcesTable.tsx` (lines 75-94)

**Duplicated Code Pattern:**

```tsx
<div className="flex justify-between items-center mb-4">
  <Input
    isClearable
    placeholder="Filter by..."
    aria-label="Filter..."
    startContent={
      <Search className="w-4 h-4 text-default-400" aria-hidden="true" />
    }
    value={filterValue}
    onClear={() => setFilterValue('')}
    onValueChange={setFilterValue}
    size="sm"
    className="max-w-xs"
  />
</div>
```

**Recommended Component:**

```tsx
// app/components/TableFilterInput.tsx
type TableFilterInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  showResultCount?: boolean;
  filteredCount?: number;
  totalCount?: number;
};
```

---

### 10. `DeleteActionButton` - Destructive Action Table Button

**Current State:** Multiple tables have identical delete/remove/revoke action buttons with tooltips.

**Files Affected:**

- `app/components/Clinic/CliniciansTable.tsx` (lines 167-181)
- `app/components/Clinic/PatientInvitesTable.tsx` (lines 156-169)
- `app/components/Clinic/ClinicianInvitesTable.tsx` (lines 139-153)

**Duplicated Code Pattern:**

```tsx
<Tooltip content="..." color="danger">
  <Button
    isIconOnly
    size="sm"
    color="danger"
    variant="light"
    onPress={() => handleClick(item)}
    aria-label="..."
    isDisabled={!onAction}
  >
    <Trash2 size={16} />
  </Button>
</Tooltip>
```

**Recommended Component:**

```tsx
// app/components/DeleteActionButton.tsx
type DeleteActionButtonProps = {
  tooltip: string;
  ariaLabel: string;
  onPress: () => void;
  isDisabled?: boolean;
  icon?: LucideIcon;
};
```

---

### 11. `StatusChip` - Standardized Status Chip

**Current State:** Status chips with color mapping based on status values are implemented in multiple places.

**Files Affected:**

- `app/components/Clinic/PrescriptionsTable.tsx` (lines 96-117) - `getStateColor`
- `app/components/Clinic/PrescriptionProfile.tsx` (lines 18-39) - `getStateColor`
- `app/components/User/DataSharingSection.tsx` (lines 240-254, 358-372) - `getStatusColor`
- `app/components/User/DataSourcesTable.tsx` (lines 149-162) - `getStateColor`
- `app/components/Clinic/ClinicianProfile.tsx` (lines 59-69) - `getRoleColor`
- `app/components/Clinic/ClinicianInvitesTable.tsx` (lines 119-137) - status color logic

**Recommended Component:**

```tsx
// app/components/StatusChip.tsx
type StatusType = 'prescription' | 'invite' | 'dataSource' | 'role' | 'custom';

type StatusChipProps = {
  status: string;
  type: StatusType;
  colorMap?: Record<
    string,
    'success' | 'warning' | 'danger' | 'default' | 'primary' | 'secondary'
  >;
};
```

---

### 12. `RecentItemsTable` - Recent Items Table

**Current State:** Three nearly identical "Recently Viewed" tables exist with the same structure.

**Files Affected:**

- `app/components/Clinic/RecentPatients.tsx`
- `app/components/Clinic/RecentClinicians.tsx`
- `app/components/User/RecentUsers.tsx`

**Recommended Abstraction:** Create a generic `RecentItemsTable` component that accepts:

- Column configuration
- Items array
- Empty state message
- Navigation handler

---

### 13. `LookupForm` - Entity Lookup Form

**Current State:** `ClinicLookup` and `UserLookup` are almost identical.

**Files Affected:**

- `app/components/Clinic/ClinicLookup.tsx`
- `app/components/User/UserLookup.tsx`

**Recommended Component:**

```tsx
// app/components/LookupForm.tsx
type LookupFormProps = {
  action: string;
  icon: LucideIcon;
  title: string;
  placeholder: string;
  error?: string;
  errorType?: 'validation' | 'api';
};
```

---

## Lower-Priority UI Components

### 14. `DangerZoneSection` - Danger Zone Container

**Current State:** Danger zone sections appear in multiple places with similar styling.

**Files Affected:**

- `app/components/Clinic/ClinicProfile.tsx` (lines 683-708)
- `app/components/User/UserActions.tsx` (lines 183-211)

---

### 15. `SettingsToggleRow` - Toggle with Label/Description

**Current State:** Settings sections use a repeated pattern of toggle switches with labels and descriptions.

**Files Affected:**

- `app/components/Clinic/ClinicProfile.tsx` (lines 518-533, 643-679)
- `app/components/Clinic/ClinicianProfile.tsx` (lines 298-330)

**Duplicated Code Pattern:**

```tsx
<div className="flex items-center justify-between">
  <div>
    <p className="text-sm font-medium">Label</p>
    <p className="text-xs text-default-500">Description</p>
  </div>
  <Switch ... />
</div>
```

---

### 16. `CardSection` - Consistent Card Layout

**Current State:** Several components use HeroUI Card with identical header patterns (icon + title + subtitle).

**Files Affected:**

- `app/components/User/DataExportSection.tsx`
- `app/components/User/PumpSettingsSection.tsx`
- `app/components/Reports/ClinicMergeReportSection.tsx`

---

## Shared Utility Functions

### 1. Date Formatting Utilities

**Current State:** `intlFormat` from `date-fns` is used with identical options throughout the codebase.

**Files Affected:** Nearly all table and profile components

**Duplicated Code Pattern:**

```tsx
intlFormat(
  new Date(dateStr),
  { year: 'numeric', month: 'short', day: 'numeric' },
  { locale },
);
```

**Recommended Utility:**

```tsx
// app/utils/dateFormatters.ts
export function formatShortDate(dateStr: string, locale: string): string;
export function formatDateWithTime(dateStr: string, locale: string): string;
export function formatDateOnly(dateStr: string, locale: string): string;
```

**Benefits:**

- Consistent date formatting across the app
- Single place to change date display preferences
- Reduces boilerplate in components

---

### 2. Status Color Mapping Utilities

**Current State:** Color mapping functions are duplicated across components.

**Files Affected:**

- `app/components/Clinic/PrescriptionsTable.tsx`
- `app/components/Clinic/PrescriptionProfile.tsx`
- `app/components/User/DataSharingSection.tsx`
- `app/components/User/DataSourcesTable.tsx`
- `app/components/Clinic/ClinicianProfile.tsx`

**Recommended Utility:**

```tsx
// app/utils/statusColors.ts
export const prescriptionStateColors: Record<string, ChipColor> = { ... };
export const inviteStatusColors: Record<string, ChipColor> = { ... };
export const dataSourceStateColors: Record<string, ChipColor> = { ... };
export const roleColors: Record<string, ChipColor> = { ... };

export function getStatusColor(status: string, type: 'prescription' | 'invite' | 'dataSource' | 'role'): ChipColor;
```

---

### 3. Role Formatting Utilities

**Current State:** Role label formatting is duplicated in multiple files.

**Files Affected:**

- `app/components/Clinic/ClinicianProfile.tsx` (lines 71-82)
- `app/components/Clinic/CliniciansTable.tsx` (line 148)
- `app/components/Clinic/ClinicianInvitesTable.tsx` (line 103)

**Duplicated Code Pattern:**

```tsx
primaryRole.replace('CLINIC_', '').toLowerCase();
```

**Recommended Utility:**

```tsx
// app/utils/roleFormatters.ts
export function formatRoleLabel(role: string): string;
export function getRoleDisplayName(role: string): string;
```

---

### 4. Tag/Site Name Resolution

**Current State:** Helper functions to resolve tag/site IDs to names are duplicated.

**Files Affected:**

- `app/components/Clinic/PatientsTable.tsx` (lines 76-91)
- `app/components/Clinic/PatientProfile.tsx` (lines 90-105)

**Duplicated Code Pattern:**

```tsx
const getTagName = useCallback(
  (tagId: string): string => {
    const tag = clinicData?.patientTags?.find((t) => t.id === tagId);
    return tag?.name || tagId;
  },
  [clinicData?.patientTags],
);
```

**Recommended Utility or Hook:**

```tsx
// app/utils/clinicResolvers.ts or app/hooks/useClinicResolvers.ts
export function useClinicResolvers(clinic: Clinic | undefined) {
  const getTagName = useCallback(...);
  const getSiteName = useCallback(...);
  return { getTagName, getSiteName };
}
```

---

### 5. Pagination Calculation Utilities

**Current State:** Pagination range calculations are repeated in multiple tables.

**Files Affected:**

- `app/components/Clinic/PatientsTable.tsx` (lines 109-117)
- `app/components/Clinic/CliniciansTable.tsx` (lines 64-73)
- `app/components/Clinic/ClinicsTable.tsx` (lines 95-104)
- `app/components/Clinic/PatientInvitesTable.tsx` (lines 72-81)

**Duplicated Code Pattern:**

```tsx
const effectivePageSize =
  pageSize ?? (items.length > 0 ? Math.ceil(totalItems / totalPages) : 25);
const firstItemOnPage =
  totalItems > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
const lastItemOnPage = Math.min(currentPage * effectivePageSize, totalItems);
```

**Recommended Utility:**

```tsx
// app/utils/pagination.ts
export function calculatePaginationRange(
  totalItems: number,
  currentPage: number,
  totalPages: number,
  pageSize?: number,
  defaultPageSize?: number,
): { firstItem: number; lastItem: number; effectivePageSize: number };
```

---

### 6. BG Units Conversion Utilities

**Current State:** Blood glucose unit conversion functions are defined locally.

**Files Affected:**

- `app/components/User/PumpSettingsSection.tsx` (lines 43-67)

**Recommended Utility:**

```tsx
// app/utils/bgUnits.ts
export function mgdlToMmol(mgdl: number): number;
export function mmolToMgdl(mmol: number): number;
export function formatBgValue(value: number, useMmol: boolean): string;
```

---

### 7. Time Conversion Utilities

**Current State:** Time conversion from milliseconds is defined locally.

**Files Affected:**

- `app/components/User/PumpSettingsSection.tsx` (line 38-42)

**Recommended Utility:**

```tsx
// app/utils/timeConversion.ts
export function msToTime(ms: number): string; // Returns HH:MM
export function msToHours(ms: number): number;
```

---

## Implementation Notes

### Suggested Implementation Order

1. **Phase 1 - Quick Wins (High Impact, Low Effort):**
   - `DetailsToggleButton`
   - `TableEmptyState`
   - `TableLoadingState`
   - Date formatting utilities
   - Status color mapping utilities

2. **Phase 2 - Medium Effort:**
   - `CopyableIdentifier`
   - `ProfileDetailGrid`
   - `TabWithBadge`
   - `ProfileTabs`
   - `StatusChip`
   - Pagination utilities

3. **Phase 3 - Higher Effort (More Complexity):**
   - `ProfileHeader` (combines multiple sub-components)
   - `LookupForm`
   - `RecentItemsTable`
   - `TableFilterInput`

### File Organization Suggestion

```
app/
├── components/
│   ├── ui/                      # Atomic UI components
│   │   ├── DetailsToggleButton.tsx
│   │   ├── CopyableIdentifier.tsx
│   │   ├── StatusChip.tsx
│   │   ├── DeleteActionButton.tsx
│   │   ├── TableEmptyState.tsx
│   │   ├── TableLoadingState.tsx
│   │   └── TableFilterInput.tsx
│   ├── layout/                  # Layout components
│   │   ├── ProfileHeader.tsx
│   │   ├── ProfileDetailGrid.tsx
│   │   ├── ProfileTabs.tsx
│   │   ├── TabWithBadge.tsx
│   │   ├── CardSection.tsx
│   │   ├── DangerZoneSection.tsx
│   │   └── SettingsToggleRow.tsx
│   └── ... (existing component folders)
├── utils/
│   ├── dateFormatters.ts
│   ├── statusColors.ts
│   ├── roleFormatters.ts
│   ├── pagination.ts
│   ├── bgUnits.ts
│   └── timeConversion.ts
└── hooks/
    └── useClinicResolvers.ts
```

### Migration Strategy

1. Create new shared components/utilities alongside existing code
2. Update one component at a time to use the shared version
3. Write tests for new shared components
4. Run `npm run typecheck` and `npm run lint` after each migration
5. Verify visual consistency with manual testing
6. Remove duplicated code after successful migration

---

## Summary

| Category                      | Count | Impact                                         |
| ----------------------------- | ----- | ---------------------------------------------- |
| High-Priority UI Components   | 6     | Major code reduction, critical for consistency |
| Medium-Priority UI Components | 7     | Good code reduction, improves maintainability  |
| Lower-Priority UI Components  | 3     | Nice to have, smaller impact                   |
| Shared Utility Functions      | 7     | Reduces duplication, improves consistency      |

**Total Identified Patterns:** 23

Implementing these recommendations will:

- Reduce code duplication by an estimated 30-40%
- Ensure visual consistency across all profile pages and tables
- Make future styling updates much easier (single source of truth)
- Improve maintainability and reduce bug surface area
