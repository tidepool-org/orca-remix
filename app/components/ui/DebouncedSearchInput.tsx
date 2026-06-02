import { Input } from '@heroui/react';
import { SearchIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface DebouncedSearchInputProps {
  value?: string;
  placeholder?: string;
  onSearch: (search: string) => void;
  debounceMs?: number;
}

export default function DebouncedSearchInput({
  value = '',
  placeholder = 'Search...',
  onSearch,
  debounceMs = 1000,
}: DebouncedSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const onSearchRef = useRef(onSearch);

  // Keep ref in sync with latest callback
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const debouncedSearch = useCallback(
    (searchValue: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onSearchRef.current(searchValue);
      }, debounceMs);
    },
    [debounceMs],
  );

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      debouncedSearch(newValue);
    },
    [debouncedSearch],
  );

  // Update local value when prop changes (e.g., from URL params)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Input
      placeholder={placeholder}
      aria-label={placeholder}
      value={localValue}
      onValueChange={handleChange}
      startContent={
        <SearchIcon
          className="text-[color:var(--text-faint)]"
          size={16}
          aria-hidden="true"
        />
      }
      isClearable
      onClear={() => handleChange('')}
      size="sm"
      className="max-w-xs"
      classNames={{
        inputWrapper:
          'h-[34px] min-h-[34px] px-[11px] gap-2 bg-[color:var(--field-bg)] border border-[color:var(--field-border)] shadow-none rounded-[6px] data-[hover=true]:bg-[color:var(--field-bg)] data-[focus=true]:border-[color:var(--primary)] data-[focus=true]:!bg-[color:var(--surface)] group-data-[focus=true]:!bg-[color:var(--surface)] data-[focus=true]:shadow-[0_0_0_3px_var(--primary-soft)] group-data-[focus-visible=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0',
        input:
          'text-[13px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)]',
      }}
    />
  );
}
