import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from '@heroui/react';
import { AlertTriangle } from 'lucide-react';

export type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  requiresInput?: boolean;
  inputPlaceholder?: string;
  expectedInput?: string;
  inputLabel?: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  requiresInput = false,
  inputPlaceholder = '',
  expectedInput = '',
  inputLabel = 'Type to confirm',
  isLoading = false,
  icon,
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = useState('');

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  // When input confirmation is required, fail safe: keep the button disabled
  // unless a non-empty expectedInput has been matched exactly. This prevents a
  // misconfiguration (requiresInput with an empty/omitted expectedInput) from
  // silently enabling the confirm button without any typed confirmation.
  const isConfirmDisabled =
    isLoading ||
    (requiresInput && (expectedInput === '' || inputValue !== expectedInput));

  const handleConfirm = () => {
    if (!isConfirmDisabled) {
      onConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      backdrop="blur"
      aria-label={title}
      classNames={{ base: 'border border-[color:var(--border)]' }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3">
          <span
            className={`grid place-items-center w-8 h-8 rounded-lg border ${
              confirmVariant === 'danger'
                ? 'bg-[color:var(--danger-soft)] border-[color:var(--danger-border)] text-[color:var(--danger)]'
                : 'bg-[color:var(--primary-soft)] border-[color:var(--primary-soft)] text-[color:var(--primary)]'
            }`}
            aria-hidden="true"
          >
            {icon || <AlertTriangle size={18} />}
          </span>
          <span className="text-base font-bold">{title}</span>
        </ModalHeader>
        <ModalBody>
          <p className="text-[color:var(--text-muted)]">{description}</p>
          {requiresInput && (
            <div className="mt-4">
              <Input
                label={inputLabel}
                placeholder={inputPlaceholder}
                value={inputValue}
                onValueChange={setInputValue}
                isDisabled={isLoading}
                variant="bordered"
                classNames={{ input: 'font-mono text-sm' }}
                color={inputValue === expectedInput ? 'success' : 'default'}
                description={`Type "${expectedInput}" to confirm`}
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            color={confirmVariant === 'danger' ? 'danger' : 'primary'}
            onPress={handleConfirm}
            isDisabled={isConfirmDisabled}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
