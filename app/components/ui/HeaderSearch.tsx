import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '@heroui/react';
import { Search } from 'lucide-react';

/**
 * Determines the search route based on the input value.
 * - Email addresses → /users
 * - Share codes (XXXX-XXXX-XXXX) → /clinics
 * - Hex strings 10+ chars → /clinics (clinic IDs are hex)
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

  // Hex string 10+ chars (no dashes) → clinic
  const clinicIdRegex = /^[0-9a-f]{10,}$/i;
  if (clinicIdRegex.test(trimmed)) return '/clinics';

  // Default → user
  return '/users';
}

export default function HeaderSearch() {
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return;

      const target = e.target as HTMLElement;
      const tagName = target.tagName;
      if (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      e.preventDefault();
      inputRef.current?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    const route = getSearchRoute(trimmed);
    navigate(`${route}?search=${encodeURIComponent(trimmed)}`);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        ref={inputRef}
        type="text"
        placeholder="User ID, email, clinic ID, or share code"
        aria-label="Search for a user or clinic"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        size="sm"
        className="w-72"
        classNames={{
          inputWrapper: 'bg-default-100',
          input: 'group-data-[has-value=true]:text-content1-foreground',
        }}
        startContent={
          <Search className="w-4 h-4 text-default-400" aria-hidden="true" />
        }
        endContent={
          <kbd
            className="hidden sm:inline-flex items-center px-1.5 border border-default-300 rounded text-xs text-default-400 font-sans"
            aria-hidden="true"
          >
            /
          </kbd>
        }
      />
    </form>
  );
}
