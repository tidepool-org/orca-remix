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

  const isConfirmDisabled =
    isLoading || (requiresInput && inputValue !== expectedInput);

  const handleConfirm = () => {
    if (!isConfirmDisabled) {
      onConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          {icon ||
            (confirmVariant === 'danger' && (
              <AlertTriangle className="text-danger" size={20} />
            ))}
          <span>{title}</span>
        </ModalHeader>
        <ModalBody>
          <p className="text-default-600">{description}</p>
          {requiresInput && (
            <div className="mt-4">
              <Input
                label={inputLabel}
                placeholder={inputPlaceholder}
                value={inputValue}
                onValueChange={setInputValue}
                isDisabled={isLoading}
                variant="bordered"
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
