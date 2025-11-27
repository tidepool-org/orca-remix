import { HydratedRouter } from 'react-router/dom';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

// Remove Requestly injected elements before hydration - they cause hydration mismatches
const requestlyElements = document.querySelectorAll(
  'rq-implicit-test-rule-widget, rq-overlay',
);
requestlyElements.forEach((el) => el.remove());

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
