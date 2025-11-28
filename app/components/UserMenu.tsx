import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@heroui/react";
import { useMemo } from 'react';

import { type RootLoaderType } from '~/root';
import { useLoaderData } from 'react-router';

export default function UserMenu() {
  const { agent } = useLoaderData<RootLoaderType>();

  // Memoize the avatar src to prevent unnecessary re-renders and refetches
  const avatarSrc = useMemo(() => {
    // Only return the picture URL if it exists and is a valid URL
    if (agent?.picture) {
      try {
        new URL(agent.picture);
        return agent.picture;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [agent?.picture]);

  // Memoize the Avatar component to only re-render when avatarSrc changes
  const memoizedAvatar = useMemo(
    () => (
      <Avatar
        isBordered
        showFallback
        as="button"
        className="transition-transform"
        color="primary"
        size="sm"
        src={avatarSrc}
        // Add loading strategy to prevent excessive requests
        imgProps={{
          loading: 'lazy',
          referrerPolicy: 'no-referrer',
        }}
      />
    ),
    [avatarSrc],
  );

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>{memoizedAvatar}</DropdownTrigger>
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
