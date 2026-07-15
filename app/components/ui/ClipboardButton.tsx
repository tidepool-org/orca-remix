import { Button, ButtonProps } from '@heroui/react';
import debounce from 'lodash/debounce';
import { Copy, CopyCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type ClipboardButtonProps = ButtonProps & {
  clipboardText?: string;
};

export default function ClipboardButton({
  clipboardText = 'Sorry, there was nothing to copy.',
  children,
  title = 'Copy to clipboard',
  spinner,
  isIconOnly = true,
  size = 'sm',
  radius = 'sm',
  variant = 'light',
  ...buttonProps
}: ClipboardButtonProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const debouncedRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Icon scales with the button size so it stays proportional to the
  // identifier text it sits beside (handoff .copy svg = 13px).
  const iconClass = size === 'md' ? 'w-[15px] h-[15px]' : 'w-[13px] h-[13px]';
  const copyIcon = children ?? (
    <Copy className={iconClass} aria-hidden="true" />
  );
  const successIcon = spinner ?? (
    <CopyCheck
      className={`${iconClass} text-[color:var(--ok)]`}
      aria-hidden="true"
    />
  );

  // Clean up pending debounce on unmount
  useEffect(() => {
    return () => {
      debouncedRef.current?.cancel();
    };
  }, []);

  const copyContent = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsLoading(true);

      debouncedRef.current?.cancel();

      const buttonTextUpdate = debounce(() => {
        setIsLoading(false);
      }, 1000);

      buttonTextUpdate();
      debouncedRef.current = buttonTextUpdate;
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Button
      onPress={() => copyContent(clipboardText)}
      className="text-[color:var(--text-faint)] hover:text-[color:var(--text)] opacity-100 transition-colors min-w-0 w-5 h-5"
      isLoading={isLoading}
      title={title}
      aria-label={title}
      spinner={successIcon}
      isIconOnly={isIconOnly}
      size={size}
      radius={radius}
      variant={variant}
      {...buttonProps}
    >
      {copyIcon}
    </Button>
  );
}
