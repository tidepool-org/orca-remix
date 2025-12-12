import { Form, useSearchParams, useNavigation } from 'react-router';
import { Input, Button } from '@heroui/react';
import type { LucideIcon } from 'lucide-react';
import React from 'react';
import Well from '~/partials/Well';
import { useToast } from '~/contexts/ToastContext';
import SectionHeader from '~/components/SectionHeader';
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

  return (
    <Form action={action}>
      <Well>
        <div className="flex flex-col gap-4">
          <SectionHeader icon={icon} title={title} />

          <div className="flex items-center gap-4">
            <Input
              name={inputName ?? searchParamName}
              type="text"
              placeholder={placeholder}
              aria-label={ariaLabel ?? placeholder}
              value={searchValue || ''}
              onChange={handleSearchChange}
              className="flex-1 min-w-48 max-w-xs"
              classNames={searchInputClasses}
              isInvalid={!!error && errorType === 'validation'}
              errorMessage={errorType === 'validation' ? error : undefined}
            />

            <Button type="submit" color="primary" isLoading={isSearching}>
              {submitText}
            </Button>
          </div>
        </div>
      </Well>
    </Form>
  );
}
