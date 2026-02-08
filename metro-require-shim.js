/**
 * Shim for Expo SDK 53 / RN 0.79: set require on all global refs so Hermes
 * and any scope (global, globalThis, self) sees it. Metro passes require as the first argument.
 */
(function (r) {
  if (typeof r !== 'function') return;
  if (typeof global !== 'undefined') global.require = r;
  if (typeof globalThis !== 'undefined') globalThis.require = r;
  if (typeof self !== 'undefined') self.require = r;
})(typeof require !== 'undefined' ? require : undefined);
