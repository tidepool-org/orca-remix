import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownSection,
  Avatar,
  Kbd,
} from '@heroui/react';
import { useMemo } from 'react';

import { type RootLoaderType } from '~/root';
import { useLoaderData } from 'react-router';
import { version } from '../../package.json';

type UserMenuProps = {
  onOpenShortcuts: () => void;
};

export default function UserMenu({ onOpenShortcuts }: UserMenuProps) {
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
        <DropdownSection showDivider>
          <DropdownItem
            key="profile"
            className="h-14 gap-2 data-[hover=true]:bg-transparent data-[hover=true]:text-foreground cursor-default"
            isReadOnly
          >
            <p>Signed in as</p>
            <p className="font-semibold">{agent?.name}</p>
            <em>{agent?.email}</em>
          </DropdownItem>
        </DropdownSection>
        <DropdownSection>
          <DropdownItem
            key="shortcuts"
            onPress={onOpenShortcuts}
            endContent={<Kbd className="font-mono text-xs">?</Kbd>}
          >
            Shortcuts
          </DropdownItem>
        </DropdownSection>
        <DropdownSection>
          <DropdownItem
            key="version"
            className="text-default-400 text-xs text-center justify-center data-[hover=true]:bg-transparent data-[hover=true]:text-default-400 cursor-default"
            isReadOnly
          >
            v{version}
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
