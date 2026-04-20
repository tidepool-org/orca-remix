# Orca 2.0

Internal admin tool for [Tidepool](https://www.tidepool.org/), built with React Router v7 (SSR), HeroUI, and Tailwind CSS.

## Tech Stack

| Layer          | Library                                                                                                                | Docs                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Framework      | [React Router v7](https://reactrouter.com/)                                                                            | [React Router docs](https://reactrouter.com/start/framework/installation) |
| Server         | [Express](https://expressjs.com/)                                                                                      | —                                                                         |
| UI components  | [HeroUI v2](https://www.heroui.com/) (formerly NextUI)                                                                 | [HeroUI docs](https://www.heroui.com/docs/guide/introduction)             |
| Styling        | [Tailwind CSS v3](https://tailwindcss.com/)                                                                            | [Tailwind docs](https://v3.tailwindcss.com/docs)                          |
| Icons          | [Lucide React](https://lucide.dev/)                                                                                    | [Lucide icons](https://lucide.dev/icons/)                                 |
| Validation     | [Zod](https://zod.dev/)                                                                                                | —                                                                         |
| Testing        | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | —                                                                         |
| Date utilities | [date-fns](https://date-fns.org/)                                                                                      | —                                                                         |

> **A note on Remix**: This project was originally built with [Remix](https://remix.run/), which is why the repo is named `orca-remix`. By Remix v2, the framework had become such a thin layer over React Router that the maintainers [merged the two projects](https://remix.run/blog/merging-remix-and-react-router) — Remix v3 became React Router v7, with its full-stack features (loaders, actions, SSR, file-based routing) folded directly in. Migration was largely an import rename. Remix documentation applies equally to this codebase.

## How It Works

### Server-Side Rendering with React Router v7

Every page request is handled server-side by Express (`server.mjs`), which delegates to React Router's request handler. React Router renders the matched route tree on the server, sends complete HTML to the browser, then React **hydrates** the page client-side for subsequent interactivity — no client-side data fetching on first load.

### Loaders — fetching data

Every route can export a `loader` function that runs **on the server** before the page renders:

```ts
// app/routes/clinics.$clinicId.tsx
export async function loader({ params }: LoaderFunctionArgs) {
  const clinic = await apiRequest({
    ...apiRoutes.clinic.getById(params.clinicId),
    schema: ClinicSchema,          // Zod validation of the API response
  });
  return { clinic };
}

export default function ClinicPage() {
  const { clinic } = useLoaderData<typeof loader>();  // fully typed
  return <ClinicProfile clinic={clinic} />;
}
```

The loader has direct access to request headers, cookies, and env vars — it is never exposed to the browser. Components receive the data synchronously via `useLoaderData()`.

### Actions — mutations

Route `action` functions handle form submissions and `fetch` calls with non-GET methods. Like loaders, they run server-side only:

```ts
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  await apiRequest({ ...apiRoutes.clinic.update(id), body: data });
  return { success: true };
}
```

Components trigger actions via `useSubmit()` or a `<Form>` element. React Router re-runs the current route's loader after a successful action to keep the UI in sync.

### Flat-file routing

Routes are defined by filename in `app/routes/` using React Router's flat-file convention (`@react-router/fs-routes`):

| Filename                                    | URL                                      |
| ------------------------------------------- | ---------------------------------------- |
| `clinics._index.tsx`                        | `/clinics`                               |
| `clinics.$clinicId.tsx`                     | `/clinics/:clinicId`                     |
| `clinics.$clinicId.patients.$patientId.tsx` | `/clinics/:clinicId/patients/:patientId` |
| `action.set-theme.ts`                       | `/action/set-theme` (action-only route)  |

Files with a `.` in the name that don't use `$` params create nested URL segments. Parent routes (`clinics.tsx`) render an `<Outlet />` where child routes mount.

### Authentication

Authentication is handled at two layers:

1. **Pomerium proxy** (infrastructure level) — the app runs behind a Pomerium reverse proxy that enforces SSO. The proxy injects a `x-pomerium-jwt-assertion` header containing a signed JWT with the user's identity (`name`, `email`, `picture`).
2. **`requireAuth()` in `root.tsx`** — a defense-in-depth check that validates the header is present on every request.

The app itself authenticates to the Tidepool API as a **server service account** (`auth.server.ts`). It acquires a session token using `SERVER_NAME` + `SERVER_SECRET`, caches it in memory with a 1-hour TTL, and attaches it to every `apiRequest()` call. If the token expires and multiple requests arrive simultaneously, they share a single re-authentication attempt rather than each firing their own, so the API isn't flooded with redundant login requests.

### Cookie sessions

UI state that needs to survive page loads (recently viewed clinics/users, sidebar state, theme, locale) is persisted in **signed HTTP-only cookies** via React Router's `createCookieSessionStorage`. Sessions are read in loaders and written in action responses. See `app/sessions.server.ts`.

### API communication

All Tidepool API calls go through `apiRequest()` / `apiRequestSafe()` in `api.server.ts`. Route definitions are centralized in `apiRoutes` — a typed map of `{ method, path, body? }` objects. `apiRequest()` throws typed `APIError` on failure; `apiRequestSafe()` returns a discriminated union for cases where a 404 is a valid result rather than an error.

## Project Structure

```
app/
├── routes/              # File-based routes (loader + action + component per file)
├── components/
│   ├── ui/              # Reusable primitives (ProfileHeader, SectionPanel, DetailGrid…)
│   ├── Clinic/          # Clinic feature components
│   ├── User/            # User feature components
│   └── Reports/         # Reports feature components
├── hooks/               # Custom hooks (useLocale, usePersistedTab, useResourceState…)
├── layouts/             # Dashboard shell (sidebar + header, wraps all routes)
├── contexts/            # React contexts (Toast, SidebarExpanded, ProfileExpanded)
├── schemas/             # Zod schemas for API request/response validation
├── utils/               # Pure helpers (formatters, error classes, converters)
├── api.server.ts        # apiRequest() helper + apiRoutes definitions
├── auth.server.ts       # Server-to-API authentication (service account token)
├── sessions.server.ts   # Cookie session storage definitions
└── root.tsx             # App shell: providers, root loader, error boundary
server.mjs               # Express server entry point
```

## Environment Variables

| Variable          | Required | Description                                         |
| ----------------- | -------- | --------------------------------------------------- |
| `SESSION_SECRET`  | Yes      | Secret for signing session cookies                  |
| `SERVER_SECRET`   | Yes      | Tidepool service account password                   |
| `SERVER_NAME`     | Yes      | Tidepool service account username                   |
| `API_HOST`        | Yes      | Base URL for the Tidepool API                       |
| `DEV_AUTH_BYPASS` | Dev only | Set to `true` to skip Pomerium header check locally |
| `DEV_AUTH_EMAIL`  | Dev only | Email to use when auth is bypassed                  |
| `DEV_AUTH_NAME`   | Dev only | Display name to use when auth is bypassed           |

## Development

```sh
npm install
npm run dev        # starts Express + Vite dev server at http://localhost:3000
```

**TypeScript**: Prefer explicit types over `any` and avoid type assertions (`as`) unless necessary. Use `z.infer<typeof Schema>` to derive types from Zod schemas rather than maintaining parallel type definitions. Run `npm run typecheck` to catch errors — React Router also generates route-specific types during this step.

**Formatting**: The project uses Prettier with a checked-in config. Configure your editor to format on save using the Prettier extension ([VS Code](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), [JetBrains](https://plugins.jetbrains.com/plugin/10456-prettier)) so code style stays consistent without manual intervention. At minimum, run `npm run format` before committing.

Other commands:

```sh
npm run build          # production build
npm run lint           # ESLint
npm run typecheck      # TypeScript + React Router typegen
npm run format         # Prettier (run after making changes)
npm run test:run       # run all tests once
npm run test           # Vitest in watch mode
npm run test:coverage  # coverage report
```

## Production

```sh
npm run build
node server.mjs
```

Or with Docker:

```sh
docker build -t orca-remix .
docker run -p 3000:3000 --env-file .env orca-remix
```

Environment variables are not baked into the image — they must be supplied at runtime via `--env-file` or individual `-e KEY=VALUE` flags.
