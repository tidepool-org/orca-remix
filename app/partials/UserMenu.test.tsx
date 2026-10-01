import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, type Theme } from 'remix-themes';

import { render, screen, userEvent, waitFor } from '~/test-utils';
import UserMenu from './UserMenu';

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useLoaderData: () => ({
    agent: { name: 'Test Agent', email: 'agent@example.com' },
  }),
}));

describe('UserMenu', () => {
  const fetchMock = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(new Response());
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function openMenu(specifiedTheme: Theme | null) {
    const user = userEvent.setup();
    render(
      <ThemeProvider
        specifiedTheme={specifiedTheme}
        themeAction="/action/set-theme"
      >
        <UserMenu onOpenShortcuts={vi.fn()} />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('img', { name: 'avatar' }));
    await screen.findByRole('menu', { hidden: true });
    return user;
  }

  function themeItem(name: RegExp) {
    return screen.getByRole('menuitem', { name, hidden: true });
  }

  function selectedItems() {
    return screen.queryAllByRole('menuitem', {
      name: /selected/i,
      hidden: true,
    });
  }

  function postedThemes() {
    return fetchMock.mock.calls
      .filter(([url]) => url === '/action/set-theme')
      .map(([, init]) => JSON.parse(init.body).theme);
  }

  describe('Rendering', () => {
    it('renders Light, Dark and System menu items under a Theme section', async () => {
      await openMenu(null);

      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(themeItem(/^light/i)).toBeInTheDocument();
      expect(themeItem(/^dark/i)).toBeInTheDocument();
      expect(themeItem(/^system/i)).toBeInTheDocument();
    });

    it('marks Dark as selected when the stored theme is dark', async () => {
      await openMenu('dark' as Theme);

      expect(selectedItems()).toEqual([themeItem(/^dark/i)]);
    });

    it('marks System as selected when no theme is stored', async () => {
      await openMenu(null);

      expect(selectedItems()).toEqual([themeItem(/^system/i)]);
    });
  });

  describe('User Interactions', () => {
    it('posts { theme: null } to /action/set-theme when System is chosen', async () => {
      const user = await openMenu('dark' as Theme);

      await user.click(themeItem(/^system/i));

      await waitFor(() => expect(postedThemes()).toEqual([null]));
    });

    it("posts { theme: 'light' } to /action/set-theme when Light is chosen", async () => {
      const user = await openMenu(null);

      await user.click(themeItem(/^light/i));

      await waitFor(() => expect(postedThemes()).toEqual(['light']));
    });
  });

  describe('Accessibility', () => {
    it('theme icons are hidden from assistive technology', async () => {
      await openMenu('dark' as Theme);

      for (const name of [/^light/i, /^dark/i, /^system/i]) {
        const icons = themeItem(name).querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);
        icons.forEach((icon) =>
          expect(icon).toHaveAttribute('aria-hidden', 'true'),
        );
      }
    });
  });
});
