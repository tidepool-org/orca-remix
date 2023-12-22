import type { LoaderFunctionArgs } from '@remix-run/node';
import type { ClientLoaderFunctionArgs } from '@remix-run/react';
import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
  useNavigate,
  useLoaderData,
} from '@remix-run/react';

import './tailwind.css';
import { NextUIProvider } from '@nextui-org/react';

import {
  ThemeProvider,
  useTheme,
  PreventFlashOnWrongTheme,
} from 'remix-themes';
import { themeSessionResolver } from './sessions.server';

import Dashboard from './layouts/Dashboard';
import { Agent } from './routes/action.get-agent';

// Return the theme from the session storage using the loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { getTheme } = await themeSessionResolver(request);
  return {
    theme: getTheme(),
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
  const data = useLoaderData<typeof clientLoader>();
  return (
    <ThemeProvider specifiedTheme={data.theme} themeAction="/action/set-theme">
      <App />
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
  return (
    <html lang="en" data-theme={theme ?? ''}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
        <Links />
      </head>
      <body className="sidebar-expanded">
        <NextUIProvider navigate={navigate}>
          <Dashboard />
          <ScrollRestoration />
          <Scripts />
          {process.env.NODE_ENV === 'development' && <LiveReload />}
        </NextUIProvider>
      </body>
    </html>
  );
}
