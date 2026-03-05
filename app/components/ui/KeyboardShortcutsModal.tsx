import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Kbd,
} from '@heroui/react';

type ShortcutGroup = {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['g', 'h'], description: 'Go to Home' },
      { keys: ['g', 'u'], description: 'Go to Users' },
      { keys: ['g', 'c'], description: 'Go to Clinics' },
      { keys: ['g', 'r'], description: 'Go to Reports' },
      { keys: ['g', 'b'], description: 'Go back' },
      { keys: ['g', 'f'], description: 'Go forward' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['s'], description: 'Toggle sidebar' },
      { keys: ['/'], description: 'Focus search' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Open this help' },
      { keys: ['Esc'], description: 'Close modal / sidebar' },
    ],
  },
];

type KeyboardShortcutsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      aria-label="Keyboard shortcuts"
      classNames={{ closeButton: 'outline-none' }}
    >
      <ModalContent>
        <ModalHeader>Keyboard Shortcuts</ModalHeader>
        <ModalBody className="pb-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-default-500 mb-2">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-default-700">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className="text-xs text-default-400">
                              then
                            </span>
                          )}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
