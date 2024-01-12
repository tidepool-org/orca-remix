import { unstable_vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import { installGlobals } from '@remix-run/node';
import tsconfigPaths from 'vite-tsconfig-paths';
import localesPlugin from '@react-aria/optimize-locales-plugin';

installGlobals();

export default defineConfig({
  plugins: [
    remix(),
    tsconfigPaths(),
    // Don't include any locale strings in the client JS bundle.
    { ...localesPlugin.vite({ locales: [] }), enforce: 'pre' },
  ],
});
