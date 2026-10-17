// ES-module shim for the CommonJS `clamp` package (module.exports = clamp), which a dependency in the library's
// node_modules imports as a default export. Vite dev serves that package raw (it isn't pre-bundled, because it's
// resolved from the sibling repo), so the default import fails. Aliased in vite.config.mjs. F-036.
export default function clamp(value, min, max) {
  return min < max ? (value < min ? min : value > max ? max : value) : value < max ? max : value > min ? min : value;
}
