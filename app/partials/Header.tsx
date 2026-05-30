import { Button, Link } from '@heroui/react';
import Logo from '~/components/Logo/Logo';
import ThemeSwitcher from './ThemeSwitcher';
import UserMenu from './UserMenu';
import HeaderSearch from '~/components/ui/HeaderSearch';
import { Menu } from 'lucide-react';

import { type SidebarOpenProps } from '~/layouts/Dashboard';

type HeaderProps = SidebarOpenProps & {
  onOpenShortcuts: () => void;
};

function Header({ sidebarOpen, setSidebarOpen, onOpenShortcuts }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-[color:var(--topbar-bg)] border-b border-[color:var(--topbar-border)] z-30 shadow-topbar">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[52px] -mb-px gap-4">
          {/* Header: Left side */}
          <div className="flex items-center flex-1">
            {/* Hamburger button */}
            <Button
              className="bg-transparent text-foreground lg:hidden"
              size="sm"
              isIconOnly
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onPress={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu />
            </Button>
            <div>
              <Link className="lg:hidden" href="/">
                <Logo />
              </Link>
            </div>
            <div className="hidden sm:block flex-1 max-w-2xl">
              <HeaderSearch />
            </div>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <UserMenu onOpenShortcuts={onOpenShortcuts} />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
