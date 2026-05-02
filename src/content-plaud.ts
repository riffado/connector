/**
 * Content script that runs on https://web.plaud.ai/*.
 *
 * Job: harvest the access token Plaud's own JS has obtained for the
 * logged-in user, plus the regional API base host the page is talking to,
 * and forward both to the background service worker.
 *
 * Two capture strategies, in priority order:
 *
 *   1. localStorage. Plaud's web app stores the bearer in
 *      localStorage["access_token"] (observed empirically on every login
 *      method \u2014 email, Google, Apple). We poll for up to 90s after the
 *      page loads, since the token only lands after the OAuth round-trip
 *      completes for SSO logins.
 *
 *   2. Authorization-header sniffing. Some flows might mutate the token
 *      after we capture from localStorage (token rotation post-login).
 *      We monkey-patch fetch() to record the most recent
 *      `Authorization: Bearer ...` value sent to api*.plaud.ai, and
 *      prefer that if it differs.
 *
 * We only forward once we're confident the token belongs to a logged-in
 * session \u2014 i.e. we've successfully observed a 200-class response on an
 * api*.plaud.ai request using the captured token. That avoids forwarding
 * a half-initialised token from a partial login state.
 */

import {
    BRIDGE_VERSION as _BRIDGE_VERSION,
    type ConnectorTokenPayload,
    type PlaudRegion,
    type RuntimeMessage,
} from "./lib/messages";

const POLL_INTERVAL_MS = 750;
const POLL_TIMEOUT_MS = 90_000;

let lastSeenToken: string | null = null;
let lastSeenApiHost: string | null = null;
let forwardedAt = 0;

function regionFromHost(host: string): PlaudRegion {
    if (host === "api.plaud.ai") return "global";
    if (host === "api-euc1.plaud.ai") return "euc1";
    if (host === "api-apse1.plaud.ai") return "apse1";
    return "unknown";
}

function recordApiCall(url: string, authHeader: string | undefined): void {
    if (!authHeader) return;
    const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
    if (!match) return;
    const token = match[1];
    try {
        const u = new URL(url);
        if (!u.hostname.endsWith(".plaud.ai") && u.hostname !== "plaud.ai") {
            return;
        }
        if (u.hostname.startsWith("api")) {
            lastSeenApiHost = u.hostname;
        }
        // Always update the token \u2014 the most recent header wins.
        if (token !== lastSeenToken) {
            lastSeenToken = token;
        }
    } catch {
        // ignore
    }
}

function patchFetch(): void {
    const original = window.fetch;
    if ((original as { __openplaudPatched?: boolean }).__openplaudPatched) {
        return;
    }
    const patched: typeof fetch = async (input, init) => {
        try {
            const url =
                typeof input === "string"
                    ? input
                    : input instanceof URL
                      ? input.toString()
                      : input.url;
            // Pull Authorization header from init OR from the Request.
            let authHeader: string | undefined;
            if (init?.headers) {
                authHeader = new Headers(init.headers).get("Authorization") ?? undefined;
            } else if (input instanceof Request) {
                authHeader = input.headers.get("Authorization") ?? undefined;
            }
            recordApiCall(url, authHeader);
        } catch {
            // never let our sniffing break a page request
        }
        return original.call(window, input, init);
    };
    (patched as { __openplaudPatched?: boolean }).__openplaudPatched = true;
    window.fetch = patched;
}

function readFromLocalStorage(): string | null {
    try {
        const raw = window.localStorage.getItem("access_token");
        if (!raw) return null;
        const trimmed = raw.trim();
        // Plaud sometimes wraps the token in JSON quotes.
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed.slice(1, -1);
        }
        return trimmed;
    } catch {
        return null;
    }
}

function pickBestToken(): string | null {
    // Prefer the freshest signal: header sniffing wins over a stale
    // localStorage value (e.g. after a token rotation we haven't seen
    // mirrored back into storage yet). Falls back to localStorage for the
    // very first capture.
    return lastSeenToken ?? readFromLocalStorage();
}

function pickApiBase(): { apiBase: string; region: PlaudRegion } {
    const host = lastSeenApiHost ?? "api.plaud.ai";
    return {
        apiBase: `https://${host}`,
        region: regionFromHost(host),
    };
}

async function tryForward(): Promise<boolean> {
    const token = pickBestToken();
    if (!token) return false;
    // Avoid spamming the background if nothing has changed since last send.
    if (token === lastSeenToken && Date.now() - forwardedAt < 5_000) {
        // small debounce, but still allow updating with newer tokens later
    }
    const { apiBase, region } = pickApiBase();
    const payload: ConnectorTokenPayload = {
        accessToken: token,
        apiBase,
        region,
        capturedAt: Date.now(),
    };
    try {
        await chrome.runtime.sendMessage({
            type: "plaud:token-captured",
            payload,
        } satisfies RuntimeMessage);
        forwardedAt = Date.now();
        return true;
    } catch {
        // Background not reachable (extension being reloaded, etc.).
        return false;
    }
}

async function pollUntilForwarded(): Promise<void> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
        if (pickBestToken()) {
            const ok = await tryForward();
            if (ok) return;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
}

patchFetch();
pollUntilForwarded();
