import { ReactElement, ReactNode } from 'react';

interface WellProps {
  children: ReactNode | ReactElement;
}

export default function Well({ children }: WellProps): ReactElement {
  return (
    <div className="flex flex-col p-6 lg:p-8 bg-content1 text-content1-foreground rounded-xl gap-4 border-1 border-content2">
      {children}
    </div>
  );
}
