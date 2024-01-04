import { useState } from 'react';

import { Outlet, useMatches } from '@remix-run/react';
import { Breadcrumbs, BreadcrumbItem } from '@nextui-org/react';
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
  handle: {
    breadcrumb: Breadcrumb;
  };
}

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const matches = useMatches() as IMatch[];

  const breadcrumbs: Breadcrumb[] = map(
    filter(matches, (match) => match.handle?.breadcrumb) as IMatch[],
    (match) => match.handle?.breadcrumb,
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main>
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Breadcrumbs */}
            {!!breadcrumbs.length && (
              <Breadcrumbs className="mb-4">
                <BreadcrumbItem href="/">
                  <Home className="w-4" />
                </BreadcrumbItem>

                {breadcrumbs.map(({ href, label }, index) => (
                  <BreadcrumbItem key={index} href={href}>
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
  );
}

export default Dashboard;
