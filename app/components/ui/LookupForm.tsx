import { Form, useSearchParams, useNavigation } from 'react-router';
import { Input, Button } from '@heroui/react';
import { Search as SearchIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React from 'react';
import { useToast } from '~/contexts/ToastContext';
import SectionPanel from '~/components/ui/SectionPanel';
import { searchInputClasses } from '~/utils/tableStyles';

type LookupFormProps = {
  /**
   * Form action URL
   */
  action: string;
  /**
   * Icon to display in the section header
   */
  icon: LucideIcon;
  /**
   * Title for the section header
   */
  title: string;
  /**
   * Input placeholder text
   */
  placeholder: string;
  /**
   * Aria label for the input (defaults to placeholder)
   */
  'aria-label'?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Type of error: 'validation' shows inline, 'api' shows toast
   */
  errorType?: 'validation' | 'api';
  /**
   * Search param name (defaults to 'search')
   */
  searchParamName?: string;
  /**
   * Input name attribute (defaults to searchParamName)
   */
  inputName?: string;
  /**
   * Submit button text
   */
  submitText?: string;
};

/**
 * Reusable lookup form component for entity search.
 * Handles search input state, form submission, and error display.
 *
 * @example
 * // Clinic lookup
 * <LookupForm
 *   action="/clinics"
 *   icon={Cross}
 *   title="Clinic Lookup"
 *   placeholder="Clinic ID or Share Code"
 *   error={error}
 *   errorType={errorType}
 * />
 *
 * @example
 * // User lookup
 * <LookupForm
 *   action="/users"
 *   icon={UserCircle2Icon}
 *   title="User Lookup"
 *   placeholder="User ID or Email Address"
 *   error={error}
 *   errorType={errorType}
 * />
 */
export default function LookupForm({
  action,
  icon,
  title,
  placeholder,
  'aria-label': ariaLabel,
  error,
  errorType = 'validation',
  searchParamName = 'search',
  inputName,
  submitText = 'Search',
}: LookupFormProps) {
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const { showToast } = useToast();

  const isSearching =
    (navigation.state === 'loading' || navigation.state === 'submitting') &&
    navigation.location?.pathname === action;

  const search = searchParams.get(searchParamName);
  const [searchValue, setSearchValue] = React.useState(search);
  const lastErrorRef = React.useRef<string | undefined>();

  React.useEffect(() => {
    setSearchValue(search || '');
  }, [search]);

  // Show toast only for API errors
  React.useEffect(() => {
    if (error && errorType === 'api' && error !== lastErrorRef.current) {
      showToast(error, 'error');
      lastErrorRef.current = error;
    }
  }, [error, errorType, showToast]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const Icon = icon;

  return (
    <Form action={action}>
      <SectionPanel icon={<Icon />} title={title} aria-label={title}>
        <div className="flex items-end gap-[10px]">
          <Input
            name={inputName ?? searchParamName}
            type="text"
            placeholder={placeholder}
            aria-label={ariaLabel ?? placeholder}
            value={searchValue || ''}
            onChange={handleSearchChange}
            className="flex-1 min-w-48 max-w-xs"
            classNames={{
              ...searchInputClasses,
              inputWrapper: `${searchInputClasses.inputWrapper} h-[38px] min-h-[38px] data-[focus=true]:border-[color:var(--primary)] data-[focus=true]:!bg-[color:var(--surface)] group-data-[focus=true]:!bg-[color:var(--surface)] data-[focus=true]:shadow-[0_0_0_3px_var(--primary-soft)] group-data-[focus-visible=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0`,
              input: `${searchInputClasses.input} text-[13px] placeholder:text-[color:var(--text-faint)]`,
            }}
            isInvalid={!!error && errorType === 'validation'}
            errorMessage={errorType === 'validation' ? error : undefined}
          />

          <Button
            type="submit"
            color="primary"
            className="font-semibold text-[13px] h-[38px] px-4 gap-[7px] shadow-[0_1px_2px_rgba(70,79,194,0.3)] data-[hover=true]:!bg-[color:var(--primary-strong)] data-[disabled=true]:opacity-[0.45] data-[disabled=true]:shadow-none"
            startContent={
              !isSearching ? (
                <SearchIcon className="w-4 h-4" aria-hidden="true" />
              ) : undefined
            }
            isLoading={isSearching}
          >
            {submitText}
          </Button>
        </div>
      </SectionPanel>
    </Form>
  );
}
