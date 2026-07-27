// TEMP verification endpoint — proves Sentry catches Function errors.
// Hit /api/sentry-test → 500 → error appears in Sentry.
// DELETE this file before merging to main (main should never expose it).
export function onRequest() {
  throw new Error("Sentry UAT verification error — safe to ignore");
}
