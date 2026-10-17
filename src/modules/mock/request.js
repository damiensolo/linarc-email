// Simulated backend for reviewing loading states (docs/5-ui-patterns.md §6). Prototype data is static, so a real
// screen answers instantly; `?latency=` (or the sandbox header's Latency select) delays or fails the mock request so
// the skeleton, slow and error states can be seen and tested. Default `instant`: no delay, nothing extra on screen.

/** Configurable mock latencies (ms). `fail` rejects after its delay; `fail-once` fails the first request, then answers. */
export const LATENCY = Object.freeze({
  instant: 0,
  fast: 120,
  medium: 900,
  slow: 6500,
  fail: 1200,
  'fail-once': 1200,
});

// Short labels so the sandbox select stays narrow; the delays are above.
const LATENCY_LABELS = { instant: 'Instant', fast: 'Fast', medium: 'Medium', slow: 'Slow', fail: 'Fail', 'fail-once': 'Fail once' };
export const LATENCY_OPTIONS = Object.keys(LATENCY).map((value) => ({ value, label: LATENCY_LABELS[value] }));

export function latencyScenario() {
  const v = new URLSearchParams(window.location.search).get('latency');
  return v && v in LATENCY ? v : 'instant';
}

let failedOnce = false;

/**
 * Resolve `produce()` after the scenario's delay, or reject. Honours an AbortSignal.
 * @param {() => any} produce builds the response (the static mock data)
 */
export function mockRequest(produce, { signal, scenario = latencyScenario() } = {}) {
  return new Promise((resolve, reject) => {
    const fails = scenario === 'fail' || (scenario === 'fail-once' && !failedOnce);
    const settle = () => {
      if (fails) {
        failedOnce = true;
        reject(new Error('Simulated request failure'));
      } else resolve(produce());
    };
    if (!LATENCY[scenario] && !fails) {
      settle();
      return;
    }
    const timer = setTimeout(settle, LATENCY[scenario]);
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    }
  });
}
