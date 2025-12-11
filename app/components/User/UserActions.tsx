import { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { Button, Divider } from '@heroui/react';
import {
  Mail,
  KeyRound,
  ShieldCheck,
  Send,
  Trash2,
  UserX,
  AlertTriangle,
} from 'lucide-react';

import ConfirmationModal from '../ConfirmationModal';
import { useToast } from '~/contexts/ToastContext';
import type { User } from './types';

type ActionType =
  | 'verify-email'
  | 'password-reset'
  | 'send-confirmation'
  | 'resend-confirmation'
  | 'delete-data'
  | 'delete-account';

type UserActionsProps = {
  user: User;
};

export default function UserActions({ user }: UserActionsProps) {
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const [activeModal, setActiveModal] = useState<ActionType | null>(null);

  const isSubmitting = fetcher.state !== 'idle';

  // Determine if this is an unclaimed/custodial account (no email set up)
  const isUnclaimedAccount = !user.username;
  const displayName = user.username || user.userid;

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data as {
        success?: boolean;
        error?: string;
        action?: string;
        message?: string;
      };

      if (data.success) {
        showToast(data.message || 'Action completed successfully', 'success');
        setActiveModal(null);
      } else if (data.error) {
        showToast(data.error, 'error');
        // Keep modal open on error so user can retry
      }
    }
  }, [fetcher.state, fetcher.data, showToast]);

  const handleAction = (action: ActionType) => {
    fetcher.submit({ intent: action }, { method: 'post' });
  };

  const openModal = (action: ActionType) => {
    setActiveModal(action);
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setActiveModal(null);
    }
  };

  const actionConfigs = {
    'verify-email': {
      title: 'Verify User Email',
      description: `This will manually verify the email address for ${displayName}. The user will be able to log in immediately after verification.`,
      confirmText: 'Verify Email',
      confirmVariant: 'primary' as const,
      requiresInput: false,
      icon: <ShieldCheck className="text-primary" size={20} />,
    },
    'password-reset': {
      title: 'Send Password Reset',
      description: `This will send a password reset email to ${displayName}. The user will receive an email with instructions to reset their password.`,
      confirmText: 'Send Reset Email',
      confirmVariant: 'primary' as const,
      requiresInput: false,
      icon: <KeyRound className="text-primary" size={20} />,
    },
    'send-confirmation': {
      title: 'Send Confirmation Email',
      description: `This will send a new account confirmation email to ${displayName}. Use this if the user never received their initial confirmation.`,
      confirmText: 'Send Confirmation',
      confirmVariant: 'primary' as const,
      requiresInput: false,
      icon: <Send className="text-primary" size={20} />,
    },
    'resend-confirmation': {
      title: 'Resend Confirmation Email',
      description: `This will resend the account confirmation email to ${displayName}. Use this if the previous confirmation email expired.`,
      confirmText: 'Resend Confirmation',
      confirmVariant: 'primary' as const,
      requiresInput: false,
      icon: <Mail className="text-primary" size={20} />,
    },
    'delete-data': {
      title: 'Delete User Data',
      description: `This will permanently delete all upload data for ${displayName}. The user account will remain intact, but all diabetes data will be removed. This action cannot be undone.`,
      confirmText: 'Delete All Data',
      confirmVariant: 'danger' as const,
      requiresInput: true,
      inputPlaceholder: 'Enter email or user ID',
      expectedInput: displayName,
      inputLabel: `Confirm by typing the user ${user.username ? 'email' : 'ID'}`,
      icon: <Trash2 className="text-danger" size={20} />,
    },
    'delete-account': {
      title: 'Delete User Account',
      description: `This will permanently delete the account for ${displayName} and all associated data. This action cannot be undone.`,
      confirmText: 'Delete Account',
      confirmVariant: 'danger' as const,
      requiresInput: true,
      inputPlaceholder: 'Enter email or user ID',
      expectedInput: displayName,
      inputLabel: `Confirm by typing the user ${user.username ? 'email' : 'ID'}`,
      icon: <UserX className="text-danger" size={20} />,
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Account Actions</h2>

      {/* Standard Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<ShieldCheck size={16} />}
          onPress={() => openModal('verify-email')}
          isDisabled={user.emailVerified || isUnclaimedAccount}
        >
          Verify Email
        </Button>

        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<KeyRound size={16} />}
          onPress={() => openModal('password-reset')}
          isDisabled={isUnclaimedAccount}
        >
          Send Password Reset
        </Button>

        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Send size={16} />}
          onPress={() => openModal('send-confirmation')}
          isDisabled={user.emailVerified || isUnclaimedAccount}
        >
          Send Confirmation
        </Button>

        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Mail size={16} />}
          onPress={() => openModal('resend-confirmation')}
          isDisabled={user.emailVerified || isUnclaimedAccount}
        >
          Resend Confirmation
        </Button>
      </div>

      {/* Danger Zone */}
      <Divider className="my-2" />

      <div className="flex items-center gap-2 text-danger">
        <AlertTriangle size={18} />
        <h3 className="text-sm font-semibold">Danger Zone</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="flat"
          color="danger"
          startContent={<Trash2 size={16} />}
          onPress={() => openModal('delete-data')}
        >
          Delete User Data
        </Button>

        <Button
          size="sm"
          variant="flat"
          color="danger"
          startContent={<UserX size={16} />}
          onPress={() => openModal('delete-account')}
        >
          Delete Account
        </Button>
      </div>

      {/* Confirmation Modals */}
      {activeModal && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={() => handleAction(activeModal)}
          title={actionConfigs[activeModal].title}
          description={actionConfigs[activeModal].description}
          confirmText={actionConfigs[activeModal].confirmText}
          confirmVariant={actionConfigs[activeModal].confirmVariant}
          requiresInput={actionConfigs[activeModal].requiresInput}
          inputPlaceholder={
            'inputPlaceholder' in actionConfigs[activeModal]
              ? (actionConfigs[activeModal] as { inputPlaceholder: string })
                  .inputPlaceholder
              : undefined
          }
          expectedInput={
            'expectedInput' in actionConfigs[activeModal]
              ? (actionConfigs[activeModal] as { expectedInput: string })
                  .expectedInput
              : undefined
          }
          inputLabel={
            'inputLabel' in actionConfigs[activeModal]
              ? (actionConfigs[activeModal] as { inputLabel: string })
                  .inputLabel
              : undefined
          }
          isLoading={isSubmitting}
          icon={actionConfigs[activeModal].icon}
        />
      )}
    </div>
  );
}
