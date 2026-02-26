import { Button } from '@heroui/react';
import { Check, X } from 'lucide-react';

export type SaveCancelButtonsProps = {
  /** Called when the Save button is pressed */
  onSave: () => void;
  /** Called when the Cancel button is pressed */
  onCancel: () => void;
  /** Whether the buttons should be disabled (e.g., during submission) */
  isDisabled?: boolean;
  /** Accessible label for the save button */
  saveAriaLabel?: string;
  /** Accessible label for the cancel button */
  cancelAriaLabel?: string;
};

/**
 * Inline Save and Cancel icon buttons for settings that require explicit confirmation.
 * Rendered as small icon-only buttons with Check and X icons.
 */
export default function SaveCancelButtons({
  onSave,
  onCancel,
  isDisabled = false,
  saveAriaLabel = 'Save changes',
  cancelAriaLabel = 'Cancel changes',
}: SaveCancelButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        color="success"
        onPress={onSave}
        isDisabled={isDisabled}
        aria-label={saveAriaLabel}
      >
        <Check size={16} />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        color="danger"
        onPress={onCancel}
        isDisabled={isDisabled}
        aria-label={cancelAriaLabel}
      >
        <X size={16} />
      </Button>
    </div>
  );
}
