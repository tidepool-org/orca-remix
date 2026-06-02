import { useEffect, useRef } from 'react';
import {
  ArrowRightFromLine,
  ArrowLeftFromLine,
  UserCircle2Icon,
  Cross,
  FileBarChart,
} from 'lucide-react';
import { Theme } from 'remix-themes';
import { Button } from '@heroui/react';
import { NavLink } from 'react-router';

import Logo from '~/components/Logo/Logo';
import SmallLogo from '~/components/Logo/Tidepool_T_Icon_Dark.svg';
import { type SidebarOpenProps } from '~/layouts/Dashboard';
import { useSidebarExpanded } from '~/contexts/SidebarExpandedContext';

function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarOpenProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  const { sidebarExpanded, setSidebarExpanded } = useSidebarExpanded();

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: Event) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        target &&
        (!sidebarOpen ||
          sidebar.current.contains(target as Node) ||
          trigger.current.contains(target as Node))
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, [sidebarOpen, setSidebarOpen]);

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!sidebarOpen || key !== 'Escape') return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [sidebarOpen, setSidebarOpen]);

  const links = [
    {
      icon: UserCircle2Icon,
      text: 'User Management',
      href: '/users',
    },
    {
      icon: Cross,
      text: 'Clinic Management',
      href: '/clinics',
    },
    {
      icon: FileBarChart,
      text: 'Reports',
      href: '/reports',
    },
  ];

  return (
    <div>
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-content4 bg-opacity-30 text-content4-foreground z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-screen overflow-y-auto overflow-x-hidden no-scrollbar w-64 lg:w-[72px] lg:sidebar-expanded:!w-[var(--side-w)] shrink-0 bg-[color:var(--nav-bg)] text-[color:var(--nav-fg)] py-[14px] px-3 transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between lg:justify-center lg:sidebar-expanded:justify-start mb-4 pb-[10px]">
          {/* Close button */}
          <Button
            ref={trigger}
            className="lg:hidden bg-transparent text-[color:var(--nav-fg)]"
            onPress={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            isIconOnly
            size="sm"
          >
            <span className="sr-only">Close sidebar</span>
            <ArrowLeftFromLine aria-hidden="true" />
          </Button>

          <NavLink
            to="/"
            className="block px-2 sidebar-expanded:px-0 py-1 sidebar-expanded:pt-0"
          >
            <Logo
              className="hidden lg:block"
              src={sidebarExpanded ? undefined : SmallLogo}
              width={sidebarExpanded ? 172 : 22}
              theme={Theme.DARK}
            />
            <Logo
              className="lg:hidden right-2"
              width={152}
              theme={Theme.DARK}
            />
          </NavLink>
        </div>

        {/* Links */}
        <nav className="flex flex-col gap-1">
          <span className="hidden sidebar-expanded:block lg:sidebar-expanded:block px-3 pb-[6px] pt-3 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[color:var(--nav-fg-dim)]">
            Manage
          </span>
          <ul className="flex flex-col gap-[2px]">
            {links.map(({ href, text, icon: Icon }, i) => (
              <li key={i}>
                <NavLink
                  to={href}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-[10px] rounded-[7px] px-[10px] py-[7px] font-medium transition-colors',
                      'lg:justify-center sidebar-expanded:justify-start',
                      isActive
                        ? 'bg-[color:var(--nav-active-bg)] text-[color:var(--nav-active-fg)] font-semibold'
                        : 'text-[color:var(--nav-fg)] hover:bg-white/[0.07] hover:text-white',
                    ].join(' ')
                  }
                >
                  <Icon
                    className="shrink-0 w-[18px] h-[18px]"
                    aria-hidden="true"
                  />
                  <span className="lg:hidden sidebar-expanded:block whitespace-nowrap">
                    {text}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse button (sidebar foot) */}
        <div className="mt-auto pt-3 hidden lg:flex justify-center sidebar-expanded:justify-start">
          <button
            type="button"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            aria-controls="sidebar"
            aria-expanded={sidebarExpanded}
            className="flex items-center gap-[10px] rounded-[7px] px-[10px] py-2 text-[12px] text-[color:var(--nav-fg-dim)] hover:text-white hover:bg-white/[0.07] transition-colors"
          >
            <ArrowRightFromLine
              className={`shrink-0 w-4 h-4 ${sidebarExpanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            <span className="hidden sidebar-expanded:inline">Collapse</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
