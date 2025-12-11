import { ReactElement, ReactNode } from 'react';

interface WellProps {
  children: ReactNode | ReactElement;
  className?: string;
}

export default function Well({
  children,
  className = '',
}: WellProps): ReactElement {
  const defaultClasses =
    'flex flex-grow flex-col p-6 lg:p-8 bg-content1 text-content1-foreground rounded-xl gap-4 border-2 border-content2';

  return <div className={`${defaultClasses} ${className}`}>{children}</div>;
}
