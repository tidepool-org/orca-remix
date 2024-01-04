import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from '@nextui-org/react';

import { type RootLoaderType } from '~/root';
import { useLoaderData } from '@remix-run/react';

export default function UserMenu() {
  const { agent } = useLoaderData<RootLoaderType>();

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          isBordered
          showFallback
          as="button"
          className="transition-transform"
          color="primary"
          size="sm"
          src={agent?.picture}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="Profile Actions" variant="flat">
        <DropdownItem key="profile" className="h-14 gap-2">
          <p>Signed in as</p>
          <p className="font-semibold">{agent?.name}</p>
          <em>{agent?.email}</em>
        </DropdownItem>
        <DropdownItem key="settings">My Settings</DropdownItem>
        <DropdownItem key="logout" color="danger">
          Log Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
