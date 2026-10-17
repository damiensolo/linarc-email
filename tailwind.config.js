const path = require('path');

// The design system's own Tailwind config (tokens as classes, the catch-all safelist; D-04) with this repo's files added
// to `content`. The library path is resolved once in vite.config.mjs (LINARC_DS_PATH, default ../linarc-design-components).
const DS_ROOT = process.env.LINARC_DS_ROOT || path.resolve(__dirname, process.env.LINARC_DS_PATH || '../linarc-design-components');
const baseConfig = require(path.join(DS_ROOT, 'tailwind.config.js'));

module.exports = {
  ...baseConfig,
  content: ['./index.html', './src/**/*.{vue,js}', path.join(DS_ROOT, 'src/**/*.{vue,js}')],
};
