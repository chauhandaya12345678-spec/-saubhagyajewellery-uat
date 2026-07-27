import * as Sentry from "@sentry/cloudflare";

// Sentry must be the FIRST middleware so it wraps every Pages Function.
// Error tracking only — no business data required. tracesSampleRate can be
// lowered on live if volume grows. DSN is a public identifier (safe to commit).
export const onRequest = [
  Sentry.sentryPagesPlugin((context) => ({
    dsn: "https://f042d9e2f8b6c423413925773fa370fc@o4511805941940224.ingest.us.sentry.io/4511805950525440",
    tracesSampleRate: 1.0,
    enableLogs: true,
    environment: context.env.UAT_MODE === "true" ? "uat" : "production",
  })),
];
