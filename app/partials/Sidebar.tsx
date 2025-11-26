import { useState, useEffect, useRef } from 'react';
import {
  ArrowRightFromLine,
  ArrowLeftFromLine,
  UserCircle2Icon,
  Cross,
} from 'lucide-react';
import { Theme } from 'remix-themes';
import { Button, Link } from '@nextui-org/react';
import { useLoaderData, NavLink } from 'react-router';

import Logo from '~/components/Logo/Logo';
import SmallLogo from '~/components/Logo/Tidepool_T_Icon_Dark.svg';
import { type SidebarOpenProps } from '~/layouts/Dashboard';
import { type RootLoaderType } from '~/root';

function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarOpenProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  const { sidebarExpanded: localSidebarExpanded } =
    useLoaderData<RootLoaderType>();

  const [sidebarExpanded, setSidebarExpanded] = useState<boolean | undefined>();

  // synchronize on init
  useEffect(() => {
    if (localSidebarExpanded != undefined)
      setSidebarExpanded(localSidebarExpanded);
  }, [localSidebarExpanded]);

  // synchronize on change
  useEffect(() => {
    if (sidebarExpanded != undefined) {
      if (
        sidebarExpanded?.toString() !== localStorage.getItem('sidebar-expanded')
      )
        localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());

      const bodyElement = document.querySelector('body') as HTMLElement;
      if (sidebarExpanded) {
        bodyElement.classList.add('sidebar-expanded');
      } else {
        bodyElement.classList.remove('sidebar-expanded');
      }
    }
  }, [sidebarExpanded]);

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
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

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
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-screen overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:!w-64 shrink-0 bg-content4 text-content4-foreground p-4 pt-0 transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between mb-5 pr-3 sm:px-2 h-16">
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

          <Link as={NavLink} to="/">
            <Logo
              className={`hidden md:block 2xl:hidden right-${
                sidebarOpen || sidebarExpanded ? 3 : 0
              }`}
              src={sidebarOpen || sidebarExpanded ? undefined : SmallLogo}
              width={sidebarOpen || sidebarExpanded ? undefined : 32}
              theme={Theme.DARK}
            />
            <Logo className="md:hidden 2xl:block right-2" theme={Theme.DARK} />
          </Link>
        </div>

        {/* Links */}
        <nav className="space-y-8">
          <ul>
            {links.map(({ href, text, icon: Icon }, i) => (
              <li className="mx-3" key={i}>
                <Link
                  as={NavLink}
                  to={href}
                  className="text-content4-foreground [&.active]:bg-primary-600 rounded-md p-2"
                >
                  <div className="flex  gap-2">
                    <div className="block sidebar-expanded:block">
                      <Icon />
                    </div>
                    <div className="hidden sidebar-expanded:block whitespace-nowrap">
                      {text}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Expand / collapse button */}
        <div className="pt-3 hidden lg:inline-flex 2xl:hidden justify-end mt-auto">
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
