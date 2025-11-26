import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import localesPlugin from '@react-aria/optimize-locales-plugin';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  ssr: {
    noExternal: isProd ? true : undefined,
  },
  optimizeDeps: {
    include: ['react-router'],
  },
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    // Don't include any locale strings in the client JS bundle.
    { ...localesPlugin.vite({ locales: [] }), enforce: 'pre' },
  ],
});
