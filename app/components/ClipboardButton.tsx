import { Button, ButtonProps } from '@heroui/react';
import debounce from 'lodash/debounce';
import { Copy, CopyCheck } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

type ClipboardButtonProps = ButtonProps & {
  clipboardText?: string;
};

export default function ClipboardButton({
  clipboardText = 'Sorry, there was nothing to copy.',
  children = <Copy className="w-4" aria-hidden="true" />,
  title = 'Copy to clipboard',
  spinner = <CopyCheck className="w-4" aria-hidden="true" />,
  isIconOnly = true,
  size = 'sm',
  radius = 'sm',
  variant = 'light',
  ...buttonProps
}: ClipboardButtonProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const debouncedRef = useRef<ReturnType<typeof debounce> | null>(null);

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
      className="text-foreground/80 h-unit-7 min-w-unit-7 w-unit-7"
      isLoading={isLoading}
      title={title}
      aria-label={title}
      spinner={spinner}
      isIconOnly={isIconOnly}
      size={size}
      radius={radius}
      variant={variant}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}
