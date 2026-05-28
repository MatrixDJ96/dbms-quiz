import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Inlina il chunk JS e il CSS dentro index.html: la build diventa un singolo
// file autosufficiente, apribile con doppio click (file://) e ospitabile sotto
// qualsiasi path, senza richieste esterne bloccate dalla CORS policy.
function inlineSingleFile() {
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    name: 'inline-single-file',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlName = Object.keys(bundle).find((f) => f.endsWith('.html'));
      if (!htmlName) return;
      const html = bundle[htmlName];
      let source = html.source;
      for (const name of Object.keys(bundle)) {
        const file = bundle[name];
        const baseName = escapeRe(name.split('/').pop());
        if (file.type === 'chunk' && name.endsWith('.js')) {
          const code = file.code.replace(/<\/(script)/gi, '<\\/$1');
          source = source.replace(
            new RegExp(`<script[^>]*\\bsrc="[^"]*${baseName}"[^>]*></script>`),
            () => `<script type="module">${code}</script>`
          );
          delete bundle[name];
        } else if (file.type === 'asset' && name.endsWith('.css')) {
          source = source.replace(
            new RegExp(`<link[^>]*\\bhref="[^"]*${baseName}"[^>]*>`),
            () => `<style>${file.source}</style>`
          );
          delete bundle[name];
        }
      }
      html.source = source;
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), inlineSingleFile()],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
