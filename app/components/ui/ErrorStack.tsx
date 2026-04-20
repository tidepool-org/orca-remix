import { Accordion, AccordionItem } from '@heroui/react';
import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { AlertCircle } from 'lucide-react';

const isDev = process.env.NODE_ENV !== 'production';

export default function ErrorStack() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  let title = 'Unexpected Error';
  let message = 'An unknown error occurred.';
  let stack: string[] = [];

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText || ''}`.trim();
    message =
      typeof error.data === 'string' ? error.data : JSON.stringify(error.data);
  } else if (error instanceof Response) {
    title = `${error.status} ${error.statusText || ''}`.trim();
    message = error.statusText || 'Response error';
  } else if (error instanceof Error) {
    title = error.name;
    message = error.message;
    if (isDev && error.stack) {
      const parts = error.stack.split('at');
      parts.shift();
      stack = parts;
    }
  } else if (typeof error === 'string') {
    message = error;
  }

  return (
    <div className="bg-content1 text-content1-foreground rounded-lg px-2 border-1 border-content2">
      <Accordion>
        <AccordionItem
          key="1"
          aria-label="error"
          startContent={<AlertCircle className="text-danger" />}
          subtitle={message}
          title={title}
        >
          {stack.length > 0 && (
            <div className="text-sm">
              {stack.map((item, i) => (
                <p className="mb-1" key={i}>
                  at {item}
                </p>
              ))}
            </div>
          )}
        </AccordionItem>
      </Accordion>
    </div>
  );
}
