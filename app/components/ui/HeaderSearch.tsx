import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '@heroui/react';
import { Search } from 'lucide-react';

/**
 * Determines the search route based on the input value.
 * - Email addresses → /users
 * - Share codes (XXXX-XXXX-XXXX) → /clinics
 * - Exactly 24 hex chars → /clinics (clinic IDs)
 * - Everything else → /users
 */
function getSearchRoute(value: string): string {
  const trimmed = value.trim();

  // Email → user
  if (trimmed.includes('@')) return '/users';

  // Share code → clinic
  const shareCodeRegex =
    /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
  if (shareCodeRegex.test(trimmed)) return '/clinics';

  // Exactly 24 hex chars → clinic
  const clinicIdRegex = /^[a-f0-9]{24}$/;
  if (clinicIdRegex.test(trimmed)) return '/clinics';

  // Default → user
  return '/users';
}

export default function HeaderSearch() {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    const route = getSearchRoute(trimmed);
    navigate(`${route}?search=${encodeURIComponent(trimmed)}`);
    setValue('');
  };

  return (
    <form id="header-search" onSubmit={handleSubmit}>
      <Input
        ref={inputRef}
        type="text"
        placeholder={
          isFocused ? 'User ID, Email, Clinic ID, or Share Code' : 'Search'
        }
        aria-label="Search for a user or clinic"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        size="sm"
        className={`transition-[width] duration-200 ease-in-out ${isFocused || value ? 'w-80' : 'w-28'}`}
        classNames={{
          inputWrapper: 'bg-default-100',
          input: 'group-data-[has-value=true]:text-content1-foreground',
        }}
        startContent={
          <Search
            className="w-4 h-4 shrink-0 text-default-400"
            aria-hidden="true"
          />
        }
        endContent={
          !isFocused && !value ? (
            <kbd
              className="hidden sm:inline-flex items-center px-1.5 border border-default-300 rounded text-xs text-default-400 font-sans"
              aria-hidden="true"
            >
              /
            </kbd>
          ) : null
        }
      />
    </form>
  );
}
