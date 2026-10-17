// ES-module shim for the CommonJS `lodash.throttle` package (module.exports = throttle), imported as a default export
// by `vue-color` (the text editor's colour picker, reached through FormV2's rich-text field). Vite dev serves that
// package raw (it isn't pre-bundled, because it's resolved from the sibling repo), so the default import fails: the
// same gap as `clamp` (F-036). Aliased in vite.config.mjs. Self-contained so it doesn't depend on how `lodash` itself
// resolves; same semantics as lodash.throttle (leading and trailing calls, cancel, flush).
export default function throttle(func, wait = 0, options = {}) {
  const leading = options.leading !== false;
  const trailing = options.trailing !== false;
  let timer = null;
  let lastArgs = null;
  let lastThis = null;
  let lastCall = 0;
  let result;

  const invoke = (now) => {
    lastCall = now;
    result = func.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
    return result;
  };

  function throttled(...args) {
    const now = Date.now();
    if (!lastCall && !leading) lastCall = now;
    const remaining = wait - (now - lastCall);
    lastArgs = args;
    lastThis = this;
    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      return invoke(now);
    }
    if (!timer && trailing) {
      timer = setTimeout(() => {
        timer = null;
        if (lastArgs) invoke(leading ? Date.now() : 0);
      }, remaining);
    }
    return result;
  }

  throttled.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = lastThis = null;
    lastCall = 0;
  };
  throttled.flush = () => (timer && lastArgs ? invoke(Date.now()) : result);
  return throttled;
}
