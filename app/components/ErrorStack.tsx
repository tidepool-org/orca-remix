import { Accordion, AccordionItem } from '@nextui-org/react';
import { useRouteError } from '@remix-run/react';
import { AlertCircle } from 'lucide-react';

export default function ErrorStack() {
  const error = useRouteError() as Error;
  console.error(error);
  const stack = (error.stack || '').split('at');
  stack.shift();

  return (
    <div className="bg-content1 text-content1-foreground rounded-lg px-2 border-1 border-content3">
      <Accordion>
        <AccordionItem
          key="1"
          aria-label="error"
          startContent={<AlertCircle className="text-danger" />}
          subtitle={error.message}
          title={error.name}
        >
          <div className="text-sm">
            {stack.map((item, i) => (
              <p className="mb-1" key={i}>
                at {item}
              </p>
            ))}
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
