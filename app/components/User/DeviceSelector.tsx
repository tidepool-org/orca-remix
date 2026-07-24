import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Chip,
} from '@heroui/react';
import { Smartphone, ChevronDown } from 'lucide-react';

// Presentational device picker. The section resolves friendly names / upload
// dates and passes ready-to-render display rows; this component owns only the
// dropdown UI (select-on-click, standard keyboard nav — no Apply step).
export type DeviceDisplay = {
  key: string;
  manufacturer: string | null;
  model: string | null;
  serial?: string;
  lastUpload: string;
  versionCount: number;
  active: boolean;
};

export type DeviceSelectorProps = {
  devices: DeviceDisplay[];
  selectedKey: string;
  onSelect: (key: string) => void;
};

// `model` already carries the full friendly label (getFriendlyDeviceName
// resolves manufacturer + model, e.g. "Roche 982" / "Tidepool Loop"), so it is
// the primary title; manufacturer is only a fallback when no model resolved.
const deviceTitle = (d: DeviceDisplay) => d.model || d.manufacturer || d.key;

export default function DeviceSelector({
  devices,
  selectedKey,
  onSelect,
}: DeviceSelectorProps) {
  const selected =
    devices.find((d) => d.key === selectedKey) ?? devices[0] ?? null;

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="bordered"
          className="h-10 border-[color:var(--border-strong)] data-[hover=true]:border-primary"
          startContent={
            <Smartphone
              className="w-[18px] h-[18px] text-primary"
              aria-hidden="true"
            />
          }
          endContent={
            <ChevronDown
              className="w-[15px] h-[15px] text-[color:var(--text-faint)]"
              aria-hidden="true"
            />
          }
          aria-label="Select device"
        >
          <span className="font-semibold">
            {selected ? deviceTitle(selected) : 'No device'}
          </span>
          {selected?.serial && (
            <span className="font-mono text-xs text-[color:var(--text-faint)]">
              {selected.serial}
            </span>
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Devices"
        variant="flat"
        selectionMode="single"
        selectedKeys={new Set([selectedKey])}
        onSelectionChange={(keys) => {
          const key = Array.from(keys)[0];
          if (key !== undefined) onSelect(String(key));
        }}
        items={devices}
      >
        {(d) => (
          <DropdownItem
            key={d.key}
            textValue={deviceTitle(d)}
            description={
              d.serial ? (
                <span className="font-mono">Serial {d.serial}</span>
              ) : undefined
            }
            endContent={
              <div className="flex items-center gap-3 whitespace-nowrap pl-4">
                {d.active && (
                  <Chip size="sm" color="success" variant="flat" radius="full">
                    Active
                  </Chip>
                )}
                <span className="text-xs font-mono text-[color:var(--text-faint)]">
                  {d.versionCount} version{d.versionCount !== 1 ? 's' : ''} ·{' '}
                  {d.lastUpload}
                </span>
              </div>
            }
          >
            <span className="font-semibold">{deviceTitle(d)}</span>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
