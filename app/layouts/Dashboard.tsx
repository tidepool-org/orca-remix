import { useState } from 'react';

import {
  Outlet,
  useMatches,
  useNavigation,
  useSearchParams,
} from 'react-router';
import { Breadcrumbs, BreadcrumbItem, Spinner } from '@heroui/react';
import { Home } from 'lucide-react';
import filter from 'lodash/filter';
import map from 'lodash/map';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

export type SidebarOpenProps = {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type Breadcrumb = {
  href: string;
  label: string;
};

interface IMatch {
  pathname: string;
  handle: {
    breadcrumb: Breadcrumb;
  };
}

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const matches = useMatches() as IMatch[];
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const isLoading = navigation.state === 'loading';

  // Params to preserve for clinic profile breadcrumbs (whitelist approach)
  const clinicProfileParamKeys = [
    'tab',
    'search',
    'page',
    'limit',
    'sort',
    'cliniciansSearch',
    'cliniciansPage',
    'cliniciansLimit',
  ];

  // Build preserved params string for clinic profile routes
  const getClinicProfileParams = (): string => {
    const preservedParams = new URLSearchParams();
    clinicProfileParamKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) preservedParams.set(key, value);
    });
    return preservedParams.toString();
  };

  const breadcrumbs: Breadcrumb[] = map(
    filter(matches, (match) => match.handle?.breadcrumb) as IMatch[],
    (match) => {
      let href = match.pathname;
      // Preserve whitelisted params for clinic profile breadcrumbs when navigating back from nested routes
      if (match.pathname.match(/^\/clinics\/[^/]+$/)) {
        const paramsString = getClinicProfileParams();
        if (paramsString) {
          href = `${match.pathname}?${paramsString}`;
        }
      }
      return { ...match.handle?.breadcrumb, href };
    },
  );

  return (
    <div className="flex h-screen overflow-hidden justify-center">
      {/* Centered container for sidebar + content */}
      <div className="flex w-full max-w-[240vh] border-r border-content2">
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Content area */}
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/*  Site header */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <main className="relative flex-1">
            {/* Loading overlay */}
            {isLoading && (
              <div
                className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center"
                aria-label="Loading content"
              >
                <Spinner size="lg" />
              </div>
            )}

            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
              {/* Breadcrumbs */}
              {!!breadcrumbs.length && (
                <Breadcrumbs
                  className="mb-4"
                  classNames={{
                    list: 'gap-2',
                  }}
                  itemClasses={{
                    item: 'text-foreground/80 data-[current=true]:text-foreground',
                    separator: 'text-foreground/40',
                  }}
                >
                  <BreadcrumbItem href="/">
                    <Home className="w-4" />
                  </BreadcrumbItem>

                  {breadcrumbs.map(({ href, label }) => (
                    <BreadcrumbItem key={href} href={href}>
                      {label}
                    </BreadcrumbItem>
                  ))}
                </Breadcrumbs>
              )}

              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
