import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "../package.json";

/**
 * MV3 manifest.
 *
 * Permission posture (kept minimal on purpose; the README's security section
 * explains each entry):
 *
 *   - `host_permissions`:
 *       - https://*.plaud.ai/*  — read the access token a logged-in user's
 *         browser has already obtained from Plaud's own site.
 *       - https://openplaud.com/*  — talk to OpenPlaud's hosted instance.
 *     Self-hosted users grant their own origin via `optional_host_permissions`
 *     through the popup ("Add my OpenPlaud URL").
 *
 *   - `permissions`:
 *       - storage  — remember the user's self-hosted origins between sessions.
 *       - tabs     — open web.plaud.ai in a new tab and watch for it to load
 *                    (see `tabs.onUpdated` listener in background.ts).
 *
 *   - No `cookies`, no `webRequest`, no `<all_urls>`.
 */
export default defineManifest({
    manifest_version: 3,
    name: "OpenPlaud Connector",
    short_name: "OpenPlaud",
    description: pkg.description,
    version: pkg.version,
    // TODO(icons): ship 16/32/48/128 PNGs before submitting to the Chrome
    // Web Store. For development the browser uses its default puzzle-piece
    // icon which is fine.
    action: {
        default_popup: "src/popup.html",
        default_title: "OpenPlaud Connector",
    },
    background: {
        service_worker: "src/background.ts",
        type: "module",
    },
    permissions: ["storage", "tabs"],
    host_permissions: [
        "https://api.plaud.ai/*",
        "https://api-euc1.plaud.ai/*",
        "https://api-apse1.plaud.ai/*",
        "https://web.plaud.ai/*",
        "https://openplaud.com/*",
    ],
    optional_host_permissions: ["https://*/*", "http://*/*"],
    content_scripts: [
        {
            matches: ["https://web.plaud.ai/*"],
            js: ["src/content-plaud.ts"],
            run_at: "document_idle",
        },
        {
            matches: ["https://openplaud.com/*"],
            js: ["src/content-bridge.ts"],
            run_at: "document_start",
            all_frames: false,
        },
    ],
    web_accessible_resources: [
        {
            resources: ["page-bridge.js"],
            matches: ["<all_urls>"],
        },
    ],
});
