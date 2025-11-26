import {
  type LoaderFunctionArgs,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useNavigate,
  useLoaderData,
  type ClientLoaderFunctionArgs,
} from 'react-router';

import './tailwind.css';
import { NextUIProvider } from '@nextui-org/react';

import {
  ThemeProvider,
  useTheme,
  PreventFlashOnWrongTheme,
} from 'remix-themes';

import { themeSessionResolver } from './sessions.server';
import { authorizeServer } from './auth.server';
import { default as useLocale, LocaleProvider } from './hooks/useLocale';

import Dashboard from './layouts/Dashboard';
import { Agent } from './routes/action.get-agent';
import ErrorStack from './components/ErrorStack';
import getLocale from './utils/getLocale';

// Return the theme from the session storage using the loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { getTheme } = await themeSessionResolver(request);
  authorizeServer();
  const locale = getLocale(request);

  return {
    locale,
    theme: getTheme() || 'light', // Default to light theme if no cookie is set
  };
};

export async function clientLoader({
  request,
  serverLoader,
}: ClientLoaderFunctionArgs) {
  const { origin } = new URL(request.url);
  const [serverData] = await Promise.all([serverLoader<typeof loader>()]);
  const agentData = await fetch(`${origin}/action/get-agent`);
  const agent: Agent = await agentData.json();

  const sidebarExpanded: boolean =
    localStorage.getItem('sidebar-expanded') !== 'false';

  return {
    ...serverData,
    agent,
    sidebarExpanded,
  };
}
clientLoader.hydrate = true;

export type RootLoaderType = typeof clientLoader;

// Wrap your app with ThemeProvider.
// `specifiedTheme` is the stored theme in the session storage.
// `themeAction` is the action name that's used to change the theme in the session storage.
export default function AppWithProviders() {
  const { theme, locale } = useLoaderData<typeof clientLoader>();

  return (
    <ThemeProvider specifiedTheme={theme} themeAction="/action/set-theme">
      <LocaleProvider locale={locale}>
        <App />
      </LocaleProvider>
    </ThemeProvider>
  );
}

// Use the theme in your app.
// If the theme is missing in session storage, PreventFlashOnWrongTheme will get
// the browser theme before hydration and will prevent a flash in browser.
// The client code runs conditionally, it won't be rendered if we have a theme in session storage.
function App() {
  const data = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const [theme] = useTheme();
  const { locale, direction } = useLocale();

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
        className={`sidebar-expanded ${
          theme ?? ''
        } text-foreground bg-background`}
      >
        <NextUIProvider navigate={navigate}>
          <Dashboard />
          <ScrollRestoration />
          <Scripts />
        </NextUIProvider>
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const data = useLoaderData<typeof loader>();
  const theme = data?.theme || 'dark';

  return (
    <html lang="en" data-theme={theme ?? ''}>
      <head>
        <title>Error | Tidepool ORCA</title>
        <Meta />
        <Links />
      </head>
      <body className={`${theme ?? ''} text-foreground bg-background`}>
        <NextUIProvider>
          <div className="p-4">
            <ErrorStack />
          </div>
          <Scripts />
        </NextUIProvider>
      </body>
    </html>
  );
}
