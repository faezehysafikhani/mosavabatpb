// Central, single source of truth for the background list-refresh cadence.
// List pages re-fetch by reacting to AppContext's refreshTrigger (see
// AppContext's own interval below) — no page should hard-code its own
// polling interval or setInterval call.
export const AUTO_REFRESH_INTERVAL_MS = 180000; // 3 minutes
