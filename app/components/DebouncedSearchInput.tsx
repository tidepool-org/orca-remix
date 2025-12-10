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

  const debouncedSearch = useCallback(
    (searchValue: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onSearch(searchValue);
      }, debounceMs);
    },
    [onSearch, debounceMs],
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
      value={localValue}
      onValueChange={handleChange}
      startContent={<SearchIcon className="text-default-400" size={16} />}
      isClearable
      onClear={() => handleChange('')}
      className="max-w-xs"
    />
  );
}
