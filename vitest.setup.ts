import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia for HeroUI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver for HeroUI components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// Mock scrollIntoView for testing
Element.prototype.scrollIntoView = () => {};

// Mock scrollTo for testing — jsdom doesn't implement it, and @react-aria's
// selectable-collection scroll path (menus, autocomplete, modal focus) calls
// it when moving focus, surfacing as an unhandled error.
Element.prototype.scrollTo = () => {};
