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
    homepage_url: pkg.homepage,
    minimum_chrome_version: "114",
    // BLOCKS CWS SUBMISSION: ship 16/32/48/128 PNGs in src/icons/ and wire
    // them up via `icons` and `action.default_icon` before submitting to
    // the Chrome Web Store. Sideload + GitHub release zips work without
    // them — Chrome falls back to the default puzzle-piece icon.
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
    // HTTPS-only on purpose. Self-hosted OpenPlaud over plain HTTP isn't a
    // realistic deployment and dropping http://*/* materially shrinks the
    // CWS review surface for `optional_host_permissions`.
    optional_host_permissions: ["https://*/*"],
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
