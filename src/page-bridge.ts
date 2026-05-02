/**
 * Page-world bridge.
 *
 * Injected by content-bridge.ts into the page's main JS world. Exposes
 * `window.__openplaudConnector` so the OpenPlaud app can detect the
 * extension and trigger a connect flow without ever directly handling the
 * Plaud access token \u2014 the token arrives back in the page only after the
 * user has signed in to web.plaud.ai in a separate tab.
 *
 * Public API (semver-pinned via `version`):
 *
 *   window.__openplaudConnector = {
 *     version: 1,
 *     connect(): Promise<{ accessToken, apiBase, region, capturedAt }>
 *   }
 *
 * Callers should:
 *   - feature-detect by checking `window.__openplaudConnector?.version`.
 *   - call connect() in response to a user gesture (Chrome blocks new-tab
 *     opens otherwise; the background opens web.plaud.ai via chrome.tabs).
 *   - POST the resolved payload to their own
 *     /api/plaud/auth/connect-token endpoint with credentials: 'include'.
 *
 * The connector itself never talks to OpenPlaud's API \u2014 the page does.
 * That keeps the auth model simple: only the user's existing OpenPlaud
 * session cookie can persist a connection.
 */

import {
    BRIDGE_VERSION,
    PAGE_MARKER,
    type ConnectorTokenPayload,
    type PageRequest,
    type PageResponse,
} from "./lib/messages";

interface PendingConnect {
    requestId: string;
    resolve: (payload: ConnectorTokenPayload) => void;
    reject: (err: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
}

let current: PendingConnect | null = null;

function rid(): string {
    // Random enough; we only ever have one at a time.
    return `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clearCurrent(): void {
    if (current) clearTimeout(current.timeout);
    current = null;
}

window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;
    const raw = event.data as { [PAGE_MARKER]?: unknown } | null;
    if (!raw || raw[PAGE_MARKER] !== true) return;
    const data = raw as PageResponse;
    if (data.kind !== "connect-result") return;
    if (!current) return;

    // Match by requestId, OR accept the wildcard "*" the content-bridge
    // forwards on unsolicited token-captured events (the background only
    // ever delivers tokens for the in-flight request).
    if (data.requestId !== current.requestId && data.requestId !== "*") return;

    const c = current;
    clearCurrent();

    if (data.ok) {
        c.resolve(data.payload);
    } else {
        c.reject(new Error(data.error || "connect failed"));
    }
});

const api = {
    version: BRIDGE_VERSION,
    connect(): Promise<ConnectorTokenPayload> {
        return new Promise((resolve, reject) => {
            if (current) {
                reject(new Error("a connect request is already in flight"));
                return;
            }
            const requestId = rid();
            const timeout = setTimeout(
                () => {
                    if (current && current.requestId === requestId) {
                        clearCurrent();
                        reject(
                            new Error(
                                "timed out waiting for plaud.ai sign-in",
                            ),
                        );
                    }
                },
                5 * 60 * 1000,
            );
            current = { requestId, resolve, reject, timeout };

            const req: PageRequest = {
                [PAGE_MARKER]: true,
                kind: "connect",
                requestId,
            };
            window.postMessage(req, window.location.origin);
        });
    },
} as const;

// Define on window. Use `defineProperty` so the page can't trivially
// overwrite the API and confuse callers.
try {
    Object.defineProperty(window, "__openplaudConnector", {
        value: api,
        writable: false,
        configurable: true,
        enumerable: false,
    });
} catch {
    // If defineProperty fails for any reason, fall back to plain assignment
    // so feature-detection still works.
    (window as unknown as { __openplaudConnector?: typeof api }).__openplaudConnector =
        api;
}
