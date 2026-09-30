import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Chip,
} from '@heroui/react';
import { Calendar, ChevronDown } from 'lucide-react';
import { fieldSurfaceClasses, fieldMenuItemClasses } from '~/utils/fieldStyles';

export type VersionDisplay = {
  index: number;
  rangeLabel: string;
  isCurrent: boolean;
  isInitial: boolean;
  changeCount: number;
};

export type SettingsVersionSelectorProps = {
  versions: VersionDisplay[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export default function SettingsVersionSelector({
  versions,
  selectedIndex,
  onSelect,
}: SettingsVersionSelectorProps) {
  const selected =
    versions.find((v) => v.index === selectedIndex) ?? versions[0] ?? null;

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="bordered"
          className={fieldSurfaceClasses}
          startContent={
            <Calendar className="w-4 h-4 text-primary" aria-hidden="true" />
          }
          endContent={
            <ChevronDown
              className="w-[15px] h-[15px] text-[color:var(--text-faint)]"
              aria-hidden="true"
            />
          }
          aria-label="View settings from"
        >
          <span className="font-mono text-[13px] font-medium">
            {selected ? selected.rangeLabel : '—'}
          </span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Settings history"
        variant="flat"
        itemClasses={fieldMenuItemClasses}
        selectionMode="single"
        selectedKeys={new Set([String(selectedIndex)])}
        onSelectionChange={(keys) => {
          const key = Array.from(keys)[0];
          if (key !== undefined) onSelect(parseInt(String(key), 10));
        }}
        items={versions}
      >
        {(v) => (
          <DropdownItem
            key={String(v.index)}
            textValue={v.rangeLabel}
            endContent={
              <div className="flex items-center gap-2 whitespace-nowrap pl-4">
                {v.isCurrent && (
                  <Chip size="sm" color="primary" variant="flat" radius="sm">
                    current
                  </Chip>
                )}
                {v.isInitial && (
                  <Chip size="sm" variant="flat" radius="sm">
                    initial
                  </Chip>
                )}
                {v.changeCount > 0 && (
                  <span className="text-xs font-mono text-[color:var(--warn)]">
                    {v.changeCount} change{v.changeCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            }
          >
            <span className="font-mono text-[13px]">{v.rangeLabel}</span>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
