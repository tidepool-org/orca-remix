import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
} from '@heroui/react';
import { Search, Building2, User, UserCheck, Users } from 'lucide-react';
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
};

const typeLabels = {
  clinic: 'Clinics',
  user: 'Users',
  patient: 'Patients',
  clinician: 'Clinicians',
};

const typeOrder: RecentEntity['type'][] = [
  'clinic',
  'user',
  'patient',
  'clinician',
];

export default function HeaderSearch() {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [entities, setEntities] = useState<RecentEntity[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const autocompleteRef = useRef<HTMLInputElement>(null);

  const fetchEntities = useCallback(async () => {
    if (hasFetched) return;
    try {
      const res = await fetch('/action/recent-entities');
      if (res.ok) {
        const data: RecentEntity[] = await res.json();
        setEntities(data);
      }
    } catch {
      // Silently fail - search still works without suggestions
    }
    setHasFetched(true);
  }, [hasFetched]);

  // Invalidate cache on navigation so newly viewed entities appear
  useEffect(() => {
    setHasFetched(false);
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
        onInputChange={setInputValue}
        allowsCustomValue
        size="sm"
        placeholder={isFocused ? 'Name, ID, Email, or Share Code' : 'Search'}
        aria-label="Search for a user, clinic, patient, or clinician"
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
        onSelectionChange={navigateToEntity}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            // If an item is highlighted in the dropdown, let Autocomplete handle it.
            // e.currentTarget may be the input itself or a wrapper div, so handle both.
            const el = e.currentTarget;
            const input =
              el instanceof HTMLInputElement ? el : el.querySelector('input');
            if (input?.getAttribute('aria-activedescendant')) return;

            const trimmed = inputValue.trim();
            if (trimmed) {
              e.preventDefault();
              const route = getSearchRoute(trimmed);
              navigate(`${route}?search=${encodeURIComponent(trimmed)}`);
              setInputValue('');
            }
          }
        }}
        className="w-80"
        inputProps={{
          classNames: {
            base: `transition-[width] duration-200 ease-in-out ${isFocused || inputValue ? 'w-80' : 'w-36'}`,
            inputWrapper: 'bg-default-100',
            input: 'group-data-[has-value=true]:text-content1-foreground',
          },
        }}
        startContent={
          <Search
            className="w-4 h-4 shrink-0 text-default-400"
            aria-hidden="true"
          />
        }
        endContent={
          !isFocused && !inputValue ? (
            <kbd
              className="hidden sm:inline-flex items-center px-1.5 border border-default-300 rounded text-xs text-default-400 font-mono"
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
          onAction: navigateToEntity,
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
                'flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small text-xs font-semibold text-default-500',
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
                    <Icon className="w-4 h-4 shrink-0 text-default-400" />
                    <div className="flex flex-col">
                      <span className="text-sm">{entity.label}</span>
                      {entity.sublabel && (
                        <span className="text-xs text-default-400">
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
