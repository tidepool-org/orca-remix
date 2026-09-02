import { useRef, useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router';
import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
} from '@heroui/react';
import {
  Search,
  Building2,
  User,
  UserCheck,
  Users,
  FileText,
} from 'lucide-react';
import type { RecentEntity } from '~/routes/action.recent-entities';

/**
 * Determines the search route based on the input value.
 * - Email addresses → /users
 * - Share codes (XXXX-XXXX-XXXX) → /clinics
 * - Exactly 24 hex chars → /clinics (clinic IDs)
 * - Everything else → /users
 */
function getSearchRoute(value: string): string {
  const trimmed = value.trim();

  if (trimmed.includes('@')) return '/users';

  const shareCodeRegex =
    /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
  if (shareCodeRegex.test(trimmed)) return '/clinics';

  const clinicIdRegex = /^[a-f0-9]{24}$/;
  if (clinicIdRegex.test(trimmed)) return '/clinics';

  return '/users';
}

const typeIcons = {
  clinic: Building2,
  user: User,
  patient: Users,
  clinician: UserCheck,
  prescription: FileText,
};

const typeLabels = {
  clinic: 'Clinics',
  user: 'Users',
  patient: 'Patients',
  clinician: 'Clinicians',
  prescription: 'Prescriptions',
};

// Validate the suggestions payload at runtime rather than trusting a bare cast.
const recentEntitiesSchema = z.array(
  z.object({
    id: z.string(),
    label: z.string(),
    sublabel: z.string().optional(),
    type: z.enum(['clinic', 'user', 'patient', 'clinician', 'prescription']),
    href: z.string(),
  }),
);

const typeOrder: RecentEntity['type'][] = [
  'clinician',
  'clinic',
  'user',
  'patient',
  'prescription',
];

export default function HeaderSearch() {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [entities, setEntities] = useState<RecentEntity[]>([]);
  const hasFetchedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const hasArrowNavigated = useRef(false);

  const fetchEntities = useCallback(async () => {
    if (hasFetchedRef.current) return;
    // Abort any previous in-flight request before starting a new one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/action/recent-entities', {
        signal: controller.signal,
      });
      if (res.ok) {
        const parsed = recentEntitiesSchema.safeParse(await res.json());
        if (parsed.success) setEntities(parsed.data);
      }
    } catch (err) {
      // A stale request aborted on navigation must not mark the cache fetched.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // Silently fail - search still works without suggestions
    }
    hasFetchedRef.current = true;
  }, []);

  // Invalidate cache on navigation so newly viewed entities appear, and abort
  // any pending request so a stale response can't overwrite fresh state.
  useEffect(() => {
    hasFetchedRef.current = false;
    return () => abortRef.current?.abort();
  }, [location.pathname]);

  const handleFocus = () => {
    setIsFocused(true);
    fetchEntities();
  };

  const navigateToEntity = useCallback(
    (key: React.Key | null) => {
      if (key === null) return;
      const entity = entities.find((e) => `${e.type}:${e.id}` === String(key));
      if (entity) {
        navigate(entity.href);
        setInputValue('');
        // Deferred a frame on purpose: this runs inside onSelectionChange, and a
        // synchronous blur there releases focus without closing the popover.
        requestAnimationFrame(() => autocompleteRef.current?.blur());
      }
    },
    [entities, navigate],
  );

  // Group entities by type for sections
  const groupedSections = typeOrder
    .map((type) => ({
      type,
      label: typeLabels[type],
      items: entities.filter((e) => e.type === type),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div id="header-search">
      <Autocomplete
        ref={autocompleteRef}
        inputValue={inputValue}
        // Never holds a selection: a launcher, not a select.
        selectedKey={null}
        onInputChange={(val) => {
          setInputValue(val);
          hasArrowNavigated.current = false;
        }}
        allowsCustomValue
        size="sm"
        selectorIcon={null}
        disableSelectorIconRotation
        selectorButtonProps={{ className: 'hidden' }}
        placeholder={isFocused ? 'Name, ID, Email, or Share Code' : 'Search'}
        aria-label="Search for a user, clinic, patient, clinician, or prescription"
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
        onSelectionChange={navigateToEntity}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            hasArrowNavigated.current = true;
          }
          if (e.key === 'Enter') {
            // If the user has actively navigated the dropdown with arrow keys
            // and an item is highlighted, let Autocomplete handle the selection.
            const el = e.currentTarget;
            const input =
              el instanceof HTMLInputElement ? el : el.querySelector('input');
            if (
              hasArrowNavigated.current &&
              input?.getAttribute('aria-activedescendant')
            )
              return;

            const trimmed = inputValue.trim();
            if (trimmed) {
              e.preventDefault();
              const route = getSearchRoute(trimmed);
              navigate(`${route}?search=${encodeURIComponent(trimmed)}`);
              setInputValue('');
              hasArrowNavigated.current = false;
              autocompleteRef.current?.blur();
            }
          }
        }}
        className="w-80"
        inputProps={{
          classNames: {
            base: `transition-[width] duration-200 ease-in-out ${isFocused || inputValue ? 'w-80' : 'w-40'}`,
            input: 'group-data-[has-value=true]:text-[color:var(--text)]',
          },
        }}
        startContent={
          <Search
            className="w-4 h-4 shrink-0 text-[color:var(--text-faint)]"
            aria-hidden="true"
          />
        }
        endContent={
          !isFocused && !inputValue ? (
            <kbd
              className="inline-flex items-center mr-1.5 px-1.5 py-0.5 border border-[color:var(--field-border)] bg-[color:var(--surface)] rounded text-[10.5px] text-[color:var(--text-faint)] font-mono"
              aria-hidden="true"
            >
              /
            </kbd>
          ) : null
        }
        popoverProps={{
          classNames: { content: 'w-80' },
          placement: 'bottom-start',
        }}
        listboxProps={{
          emptyContent: inputValue.trim()
            ? 'Press Enter to search'
            : 'Start typing to filter',
        }}
      >
        {groupedSections.map((section) => (
          <AutocompleteSection
            key={section.type}
            title={section.label}
            classNames={{
              heading:
                'flex w-full sticky top-1 z-20 py-1.5 px-2 bg-[color:var(--surface-2)] shadow-small rounded-small text-xs font-semibold text-[color:var(--text-muted)]',
            }}
          >
            {section.items.map((entity) => {
              const Icon = typeIcons[entity.type];
              return (
                <AutocompleteItem
                  key={`${entity.type}:${entity.id}`}
                  textValue={`${entity.label} ${entity.sublabel || ''} ${entity.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0 text-[color:var(--text-faint)]" />
                    <div className="flex flex-col">
                      <span className="text-sm">{entity.label}</span>
                      {entity.sublabel && (
                        <span className="text-xs text-[color:var(--text-faint)]">
                          {entity.sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                </AutocompleteItem>
              );
            })}
          </AutocompleteSection>
        ))}
      </Autocomplete>
    </div>
  );
}
