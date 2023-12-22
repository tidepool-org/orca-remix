import { Button } from '@nextui-org/react';
import Logo from '~/components/Logo/Logo';
import ThemeSwitcher from '~/components/ThemeSwitcher';
import UserMenu from '~/components/UserMenu';
import { Menu } from 'lucide-react';

import type { SidebarOpenProps } from '~/layouts/Dashboard';

function Header({ sidebarOpen, setSidebarOpen }: SidebarOpenProps) {
  return (
    <header className="sticky top-0 bg-content1 border-b border-slate-200 dark:border-slate-700 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">
          {/* Header: Left side */}
          <div className="flex items-center">
            {/* Hamburger button */}
            <Button
              className="bg-transparent text-foreground lg:hidden"
              size="sm"
              isIconOnly
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu />
            </Button>
            <div>
              <Logo className="lg:hidden" />
            </div>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
            <ThemeSwitcher />
            <div>
              {/*  Divider */}
              <hr className="w-px h-6 bg-slate-200 dark:bg-slate-700 border-none" />
            </div>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
