/**
 * Content script that runs on https://riffado.com/* (and any
 * self-hosted origin the user has paired via the extension popup).
 *
 * Two responsibilities:
 *
 *   1. Inject `page-bridge.js` into the page's main world so the Riffado
 *      app can detect the extension via `window.__riffadoConnector`.
 *      Content scripts run in an isolated world by default; properties we
 *      set on `window` aren't visible to the page. The injected script
 *      runs in the page's main world and exposes a tiny RPC surface there.
 *
 *   2. Bridge `window.postMessage` from the page to `chrome.runtime` and
 *      back. The page calls `__riffadoConnector.connect()`, which posts
 *      a message we relay to the background as `bridge:request-connect`.
 *      When the background later sends us `plaud:token-captured`, we relay
 *      it back into the page via postMessage so the awaiting Promise
 *      resolves with the token.
 */

import {
    PAGE_MARKER,
    type PageRequest,
    type PageResponse,
    type RuntimeMessage,
} from "./lib/messages";

(function injectPageBridge(): void {
    try {
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("page-bridge.js");
        script.async = false;
        script.dataset.riffadoInjected = "1";
        (document.head || document.documentElement).appendChild(script);
        script.onload = () => script.remove();
    } catch (err) {
        console.error("[riffado-connector] failed to inject bridge:", err);
    }
})();

window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;
    const data = event.data as Partial<PageRequest> | null;
    if (!data || data[PAGE_MARKER] !== true) return;
    if (data.kind !== "connect") return;
    const requestId = data.requestId;
    if (typeof requestId !== "string") return;

    chrome.runtime
        .sendMessage({
            type: "bridge:request-connect",
        } satisfies RuntimeMessage)
        .then((resp: { ok: boolean; error?: string } | undefined) => {
            if (!resp?.ok) {
                const reply: PageResponse = {
                    [PAGE_MARKER]: true,
                    kind: "connect-result",
                    requestId,
                    ok: false,
                    error: resp?.error ?? "background unreachable",
                };
                window.postMessage(reply, window.location.origin);
            }
            // Success path: nothing to send yet \u2014 the token-captured event
            // below will deliver the actual result.
        })
        .catch((err: unknown) => {
            const reply: PageResponse = {
                [PAGE_MARKER]: true,
                kind: "connect-result",
                requestId,
                ok: false,
                error: err instanceof Error ? err.message : String(err),
            };
            window.postMessage(reply, window.location.origin);
        });
});

// One outstanding connect request at a time \u2014 we just relay whatever the
// background hands us to the page. The page-bridge is responsible for
// matching the result against its in-flight Promise (via requestId).
chrome.runtime.onMessage.addListener((msg: RuntimeMessage, _sender, send) => {
    if (msg.type === "plaud:token-captured") {
        const reply: PageResponse = {
            [PAGE_MARKER]: true,
            kind: "connect-result",
            // The page-bridge keeps "current request id" state; if it sees
            // an unsolicited token (no in-flight request), it ignores it.
            requestId: "*",
            ok: true,
            payload: msg.payload,
        };
        window.postMessage(reply, window.location.origin);
        send({ ok: true });
        return false;
    }
    return false;
});
