import { useState, useEffect, useRef } from 'react';
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
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-screen overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-24 lg:sidebar-expanded:!w-64 shrink-0 bg-content4 text-content4-foreground p-4 pt-0 transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between lg:justify-center sidebar-expanded:justify-between mb-5 pr-3 sm:px-2 h-16">
          {/* Close button */}
          <Button
            ref={trigger}
            className="lg:hidden bg-transparent text-content4-foreground"
            onPress={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            isIconOnly
            size="sm"
          >
            <span className="sr-only">Close sidebar</span>
            <ArrowLeftFromLine />
          </Button>

          <NavLink to="/">
            <Logo
              className={`hidden lg:block right-${sidebarExpanded ? 3 : 0}`}
              src={sidebarExpanded ? undefined : SmallLogo}
              width={sidebarExpanded ? undefined : 32}
              theme={Theme.DARK}
            />
            <Logo className="lg:hidden right-2" theme={Theme.DARK} />
          </NavLink>
        </div>

        {/* Links */}
        <nav className="space-y-8">
          <ul className="px-3">
            {links.map(({ href, text, icon: Icon }, i) => (
              <li key={i}>
                <NavLink
                  to={href}
                  className="text-content4-foreground hover:text-content4-foreground/80 [&.active]:bg-primary-600 [&.active]:text-content4-foreground rounded-md p-2 block"
                >
                  <div className="flex gap-2 lg:justify-center sidebar-expanded:justify-start">
                    <Icon className="shrink-0 w-6 h-6" />
                    <div className="lg:hidden sidebar-expanded:block whitespace-nowrap">
                      {text}
                    </div>
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Expand / collapse button */}
        <div className="pt-3 hidden lg:inline-flex justify-center sidebar-expanded:justify-end mt-auto">
          <div className="px-2 py-2">
            <Button
              className="bg-transparent text-content4-foreground"
              onPress={() => setSidebarExpanded(!sidebarExpanded)}
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              isIconOnly
              size="sm"
            >
              <span className="sr-only">Expand / collapse sidebar</span>
              <ArrowRightFromLine className="sidebar-expanded:rotate-180" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
