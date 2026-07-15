import { render, RenderOptions } from '@testing-library/react';
import { HeroUIProvider } from '@heroui/react';
import { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';

type WrapperProps = {
  children: ReactNode;
};

/**
 * Custom render function that wraps components with necessary providers
 * Use this instead of @testing-library/react's render for components
 * that use HeroUI components
 */
function AllProviders({ children }: WrapperProps) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library except render (which we override)
export {
  screen,
  waitFor,
  fireEvent,
  within,
  cleanup,
  act,
  renderHook,
} from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export custom render as the default render
export { customRender as render };

/**
 * Creates a mock for useLoaderData hook
 * Usage: vi.mock('react-router', async () => ({
 *   ...await vi.importActual('react-router'),
 *   useLoaderData: () => mockLoaderData,
 * }))
 */
export function createMockLoaderData<T>(data: T): () => T {
  return () => data;
}

/**
 * Creates a mock for useActionData hook
 */
export function createMockActionData<T>(
  data: T | undefined,
): () => T | undefined {
  return () => data;
}

/**
 * Creates a mock submit function for testing form submissions
 */
export function createMockSubmit() {
  return vi.fn();
}

/**
 * Creates a mock navigation state
 */
export type MockNavigationState = {
  state: 'idle' | 'loading' | 'submitting';
  formData?: FormData;
  formAction?: string;
  formMethod?: string;
};

export function createMockNavigation(
  overrides: Partial<MockNavigationState> = {},
): MockNavigationState {
  return {
    state: 'idle',
    ...overrides,
  };
}
