import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue2';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The design system is consumed from source (D-01). Default: the sibling checkout `../linarc-design-components`.
 * Override with LINARC_DS_PATH (environment or `.env`) when the library lives elsewhere. tailwind.config.js and
 * src/style.css read the same setting, so this is the only place the path is resolved.
 */
function resolveDsRoot(mode) {
  const env = loadEnv(mode, __dirname, '');
  const configured = process.env.LINARC_DS_PATH || env.LINARC_DS_PATH || '../linarc-design-components';
  const root = path.resolve(__dirname, configured);
  if (!fs.existsSync(path.join(root, 'src', 'styles', 'global.css'))) {
    throw new Error(
      `Design system not found at ${root}. Check it out next to this folder as ../linarc-design-components ` +
        `(then \`yarn install\` inside it), or point LINARC_DS_PATH at it. See docs/1-setup-playbook.md §2.`,
    );
  }
  // tailwind.config.js (CommonJS, loaded later by PostCSS in this same process) reads the resolved path from here.
  process.env.LINARC_DS_ROOT = root;
  return root;
}

export default defineConfig(({ mode }) => {
  const DS_ROOT = resolveDsRoot(mode);

  // src/utils/Colors.js does `import tailwindConfig from '../../tailwind.config'`, a CommonJS file. The production
  // build converts it, but the dev server serves it raw and the app crashes ("does not provide an export named
  // 'default'"). Re-export it as ESM. F-003.
  const dsTailwindConfigAsEsm = {
    name: 'ds-tailwind-config-esm',
    enforce: 'pre',
    transform(code, id) {
      if (path.normalize(id.split('?')[0]) !== path.join(DS_ROOT, 'tailwind.config.js')) return null;
      return { code: code.replace(/module\.exports\s*=/, 'export default'), map: null };
    },
  };

  // Prototype files may import the library's own dependencies (portal-vue, moment, …) without installing them here:
  // if a bare import doesn't resolve from this repo, resolve it from the library instead. F-015.
  const dsDependencyFallback = {
    name: 'ds-dependency-fallback',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || importer.startsWith(DS_ROOT) || /^[./\0]/.test(source) || path.isAbsolute(source)) return null;
      const own = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (own) return own;
      return this.resolve(source, path.join(DS_ROOT, 'src/build.js'), { ...options, skipSelf: true });
    },
  };

  return {
    plugins: [dsTailwindConfigAsEsm, dsDependencyFallback, vue()],
    // Library code reads webpack-style `process.env` (NODE_ENV, VUE_APP_* API ids). Provide NODE_ENV only; VUE_APP_*
    // stay undefined so prototypes never call real APIs. F-015.
    define: {
      'process.env': JSON.stringify({ NODE_ENV: mode === 'production' ? 'production' : 'development' }),
    },
    resolve: {
      alias: [
        // Design system source (same alias the library uses internally)
        { find: '@', replacement: path.resolve(DS_ROOT, 'src') },
        { find: '@development/linarc-design-components', replacement: path.resolve(DS_ROOT, 'src/build.js') },
        // Icons (lucide-vue re-exports + Linarc module icons), from the library's installed copy
        { find: '@development/linarc-icons', replacement: path.resolve(DS_ROOT, 'node_modules/@development/linarc-icons') },
        // Vuex for the mock store in main.js (DatePicker reads holidays / working days from it; F-065)
        { find: /^vuex$/, replacement: path.resolve(DS_ROOT, 'node_modules/vuex/dist/vuex.esm.js') },
        // Webpack-style `~package/...` imports in library SCSS (e.g. datepicker.scss) → the library's node_modules
        { find: /^~(?!\/)(.+)$/, replacement: path.resolve(DS_ROOT, 'node_modules') + '/$1' },
        // This repo's own source: `~/prototypes/...`
        { find: /^~\//, replacement: path.resolve(__dirname, 'src') + '/' },
        // CommonJS `clamp` (a dependency of the text editor's colour picker) imported as a default export; served raw
        // in dev because it lives in the library's node_modules. ESM shim. F-036.
        { find: /^clamp$/, replacement: path.resolve(__dirname, 'src/shims/clamp.js') },
        // Same gap for `lodash.throttle` (vue-color, the colour picker reached through FormV2's rich-text field). F-008.
        { find: /^lodash\.throttle$/, replacement: path.resolve(__dirname, 'src/shims/lodash.throttle.js') },
      ],
      // Library files would otherwise resolve `vue` from the library's own node_modules, giving two Vue instances
      // (breaks portal-vue, vuex, v-click-outside, etc.). F-002.
      dedupe: ['vue'],
      // The library imports directories that only hold an `index.vue` (`@/components/TextEditorV2`), which webpack
      // resolves through its `.vue` extension. Vite's default list has no `.vue`. F-036.
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    server: {
      port: 5173,
      host: true,
      fs: {
        // Serve files from the design system checkout (a sibling by default)
        allow: [__dirname, DS_ROOT],
      },
    },
  };
});
