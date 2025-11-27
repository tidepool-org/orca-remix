import { createRequestHandler } from '@react-router/express';
import express from 'express';

const vite =
  process.env.NODE_ENV === 'production'
    ? undefined
    : await import('vite').then(({ createServer }) =>
        createServer({
          server: {
            middlewareMode: true,
          },
        }),
      );

const app = express();

// handle asset requests
if (vite) {
  app.use(vite.middlewares);
} else {
  app.use(
    '/assets',
    express.static('build/client/assets', { immutable: true, maxAge: '1y' }),
  );
}
app.use(express.static('build/client', { maxAge: '1h' }));

// Ignore Chrome DevTools requests
app.get('/.well-known/appspecific/*', (req, res) => {
  res.status(404).end();
});

// handle SSR requests
app.all(
  '*',
  createRequestHandler({
    build: vite
      ? () => vite.ssrLoadModule('virtual:react-router/server-build')
      : await import('./build/server/index.js'),
  }),
);

const port = 3000;
app.listen(port, () => console.log('http://localhost:' + port));
