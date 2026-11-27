import {
  type LoaderFunctionArgs,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useNavigate,
  useLoaderData,
  useRouteLoaderData,
} from 'react-router';

import './tailwind.css';
import { HeroUIProvider } from '@heroui/react';

import {
  ThemeProvider,
  useTheme,
  PreventFlashOnWrongTheme,
  type Theme,
} from 'remix-themes';

import {
  themeSessionResolver,
  sidebarSession,
  profileExpandedSession,
  pumpSettingsCompareSession,
} from './sessions.server';
import { authorizeServer } from './auth.server';
import { default as useLocale, LocaleProvider } from './hooks/useLocale';

import Dashboard from './layouts/Dashboard';
import ErrorStack from './components/ui/ErrorStack';
import getLocale from './utils/getLocale';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ui/ToastContainer';
import { requireAuth } from './utils/auth.server';
import {
  SidebarExpandedProvider,
  useSidebarExpanded,
} from './contexts/SidebarExpandedContext';
import { ProfileExpandedProvider } from './contexts/ProfileExpandedContext';
import { PumpSettingsCompareProvider } from './contexts/PumpSettingsCompareContext';

type Agent = {
  name?: string | undefined;
  picture?: string | undefined;
  email?: string | undefined;
};

// Return the theme from the session storage using the loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Verify authentication (defense-in-depth alongside the Tailscale Ingress).
  // requireAuth reads the Tailscale Serve identity headers (or returns the dev
  // mock user when auth is bypassed) and throws a 401 if they are missing.
  const authUser = requireAuth(request);

  const { getTheme } = await themeSessionResolver(request);
  await authorizeServer();
  const locale = getLocale(request);

  const sidebarCookie = await sidebarSession.getSession(
    request.headers.get('Cookie'),
  );
  const sidebarExpanded: boolean = sidebarCookie.get('expanded') !== false;

  const profileExpandedCookie = await profileExpandedSession.getSession(
    request.headers.get('Cookie'),
  );
  const profileExpandedMap: Record<string, boolean> =
    profileExpandedCookie.get('expanded') || {};

  const pumpSettingsCompareCookie = await pumpSettingsCompareSession.getSession(
    request.headers.get('Cookie'),
  );
  const pumpSettingsCompareToPrevious: boolean =
    pumpSettingsCompareCookie.get('compareToPrevious') !== false;

  // Agent data comes from the Tailscale identity read above
  // (or the dev mock user when auth is bypassed).
  const agent: Agent = {
    name: authUser.name,
    picture: authUser.picture,
    email: authUser.email,
  };

  return {
    locale,
    theme: (getTheme() || 'light') as Theme, // Default to light theme if no cookie is set
    sidebarExpanded,
    profileExpandedMap,
    pumpSettingsCompareToPrevious,
    agent,
  };
};

export type RootLoaderType = typeof loader;

// Use the theme in your app.
// If the theme is missing in session storage, PreventFlashOnWrongTheme will get
// the browser theme before hydration and will prevent a flash in browser.
// The client code runs conditionally, it won't be rendered if we have a theme in session storage.
function App() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [theme] = useTheme();
  const { locale, direction } = useLocale();
  const { sidebarExpanded } = useSidebarExpanded();

  return (
    <html lang={locale} dir={direction} data-theme={theme ?? ''}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
        <Links />
      </head>
      <body
        className={`${sidebarExpanded ? 'sidebar-expanded' : ''} ${
          theme ?? ''
        } text-foreground bg-background`}
      >
        <ToastProvider>
          <HeroUIProvider navigate={navigate}>
            <Dashboard />
            <ToastContainer />
            <ScrollRestoration />
            <Scripts />
          </HeroUIProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

// Wrap your app with ThemeProvider.
// `specifiedTheme` is the stored theme in the session storage.
// `themeAction` is the action name that's used to change the theme in the session storage.
export default function AppWithProviders() {
  const {
    theme,
    locale,
    sidebarExpanded,
    profileExpandedMap,
    pumpSettingsCompareToPrevious,
  } = useLoaderData<typeof loader>();

  return (
    <ThemeProvider specifiedTheme={theme} themeAction="/action/set-theme">
      <LocaleProvider locale={locale}>
        <SidebarExpandedProvider initialExpanded={sidebarExpanded}>
          <ProfileExpandedProvider initialExpandedMap={profileExpandedMap}>
            <PumpSettingsCompareProvider
              initialCompareToPrevious={pumpSettingsCompareToPrevious}
            >
              <App />
            </PumpSettingsCompareProvider>
          </ProfileExpandedProvider>
        </SidebarExpandedProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

export function ErrorBoundary() {
  const data = useRouteLoaderData<typeof loader>('root');
  const theme = data?.theme || 'dark';

  return (
    <html lang="en" data-theme={theme ?? ''}>
      <head>
        <title>Error | Tidepool ORCA</title>
        <Meta />
        <Links />
      </head>
      <body className={`${theme ?? ''} text-foreground bg-background`}>
        <HeroUIProvider>
          <div className="p-4">
            <ErrorStack />
          </div>
          <Scripts />
        </HeroUIProvider>
      </body>
    </html>
  );
}
