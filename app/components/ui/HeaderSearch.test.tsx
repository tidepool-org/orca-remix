import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import HeaderSearch from './HeaderSearch';
import type { RecentEntity } from '~/routes/action.recent-entities';

// Mock react-router
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/users',
      search: '',
      hash: '',
      state: null,
      key: 'test',
    }),
  };
});

// The recent-entities payload is fetched on focus. Values are synthetic on
// purpose — no real names, emails, or record ids belong in a fixture.
const mockEntities: RecentEntity[] = [
  {
    id: 'aaaa0000',
    label: 'Alpha Example',
    sublabel: 'alpha@example.invalid',
    type: 'user',
    href: '/users/aaaa0000',
  },
  {
    id: 'bbbb1111',
    label: 'Beta Example Clinic',
    sublabel: 'BBBB-1111-CCCC',
    type: 'clinic',
    href: '/clinics/bbbb1111',
  },
];

// HeroUI renders the popover inside an `aria-hidden` overlay container, so
// option queries need `hidden: true` to see it at all.
const findOptions = () => screen.findAllByRole('option', { hidden: true });
const getOptions = () => screen.queryAllByRole('option', { hidden: true });
const optionFor = (entity: RecentEntity) =>
  getOptions().find(
    (o) => o.getAttribute('data-key') === `${entity.type}:${entity.id}`,
  );

/** Renders the search, focuses it, and waits for the suggestions to arrive. */
async function renderAndOpen() {
  const user = userEvent.setup();
  render(<HeaderSearch />);
  const input = screen.getByRole('combobox') as HTMLInputElement;
  await user.click(input);
  await findOptions();
  return { user, input };
}

// Committing a search has to leave the input unfocused. A focused input lets
// react-aria reopen the suggestion popover from its input-change effect, and
// since committing also clears the filter, that reopen shows every recent
// entity on top of the page just navigated to. jsdom does not reproduce the
// reopen itself, so the released focus is what these assert.
describe('HeaderSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => mockEntities })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('releases focus when a typed term is committed', async () => {
    const { user, input } = await renderAndOpen();

    await user.type(input, 'Example');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(input).not.toHaveFocus());
  });

  it('releases focus when a recent entity is clicked', async () => {
    const { user, input } = await renderAndOpen();

    await user.click(optionFor(mockEntities[1])!);

    await waitFor(() => expect(input).not.toHaveFocus());
  });

  it('keeps focus when there is nothing to commit', async () => {
    const { user, input } = await renderAndOpen();

    await user.type(input, '   ');
    await user.keyboard('{Enter}');

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
  });
});
