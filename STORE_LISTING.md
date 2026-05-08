# Chrome Web Store — Listing Copy

Paste-ready text for the Chrome Web Store dashboard. Update version and
screenshots per release.

---

## Pre-submission blockers

These must be resolved before clicking Submit on the CWS dashboard. They
do not block sideloading or GitHub release zips.

1. **Icons.** Add `src/icons/icon-16.png`, `icon-32.png`, `icon-48.png`,
   `icon-128.png`, then wire them up in `src/manifest.ts` via `icons: { … }`
   and `action.default_icon`. CWS rejects submissions without at least a
   128×128 icon.
2. **Promo tile.** Add `docs/store/promo-tile-440x280.png` (PNG, 440×280).
   Required for store listing.
3. **Privacy policy page.** Publish `PRIVACY.md` at
   <https://openplaud.com/privacy/connector>. The URL is already linked
   from the welcome page, popup footer (via README), and from the listing
   below.

---

## Listing fields

### Name
OpenPlaud Connector

### Summary (≤132 chars)
Bridges your Plaud login to OpenPlaud. Sign in to Plaud with Google, Apple, or email and use the token in your OpenPlaud instance.

### Category
Productivity

### Language
English

### Single purpose
Forward a Plaud access token from a logged-in `web.plaud.ai` session to a
user-chosen OpenPlaud instance, so the user can use OpenPlaud with the
same Plaud account they sign in to with Google or Apple.

### Detailed description

OpenPlaud Connector is a tiny bridge between your Plaud account and your
OpenPlaud instance — hosted at openplaud.com, or self-hosted at a URL
you control.

**Why this exists.** Plaud's email-OTP login produces a different account
than Plaud's Google or Apple sign-in. A real "Sign in with Google" button
inside OpenPlaud is structurally blocked by Google's authorized-origins
policy on Plaud's OAuth client. The connector solves that by letting you
sign in to web.plaud.ai normally — Google, Apple, or email — and then
forwarding the resulting access token to OpenPlaud.

**How it works.**

1. On the OpenPlaud connect screen, the extension adds a "Continue with
   Plaud" button.
2. Clicking it opens web.plaud.ai in a new tab.
3. You sign in there however you normally do. The extension never sees
   your password and never interacts with Google or Apple.
4. Once Plaud has issued you a token, the extension hands it to your
   OpenPlaud tab. The Plaud tab closes automatically.
5. Your OpenPlaud tab POSTs the token to its own backend over HTTPS.

**What it does not do.**

- No analytics. No telemetry. No crash reporting.
- No data is sent to the connector's developers or to any third party.
- The token never leaves your browser except in the final HTTPS request
  your OpenPlaud tab makes to your OpenPlaud server.

**Open source.** AGPL-3.0. Source at github.com/openplaud/connector.

**Privacy policy.** <https://openplaud.com/privacy/connector>

---

## Permission justifications

CWS requires a one- to two-sentence justification per non-trivial
permission. These are the answers to paste into the dashboard.

### `storage`
Remembers the user's list of paired self-hosted OpenPlaud origins so they
don't have to re-add them. Stored locally via `chrome.storage.local`; not
synced and never transmitted.

### `tabs`
Used to open `web.plaud.ai` in a new tab so the user can sign in, and to
close that tab automatically once the token has been captured. Also used
to open the welcome page on first install.

### Host permission: `https://*.plaud.ai/*`
The extension reads the access token from `localStorage` and from
outgoing `Authorization` headers on a tab where the user is already
signed in to Plaud. This is the only way to obtain the token without
asking the user for their password.

### Host permission: `https://openplaud.com/*`
The extension injects a small bridge into the hosted OpenPlaud app so it
can render the "Continue with Plaud" button and receive the token from
the service worker. No other communication with openplaud.com.

### Optional host permission: `https://*/*`
Self-hosted OpenPlaud users add their instance URL through the popup or
welcome page. Each addition triggers a per-origin `chrome.permissions.request`
prompt, so the user explicitly approves every origin. Removing an origin
from the popup also revokes the corresponding host permission. Broad
optional pattern is required because the extension cannot know in advance
where users self-host. The connector never auto-grants or silently uses
this permission.

### Remote code
The extension does not load or execute remote code. All scripts ship in
the extension package.

### Data usage disclosures (CWS form)

- "Personally identifiable information": **No**, the extension does not
  collect PII. The Plaud access token is held transiently in memory and
  forwarded to the user's own OpenPlaud instance.
- "Health information": No.
- "Financial / payment information": No.
- "Authentication information": **Yes** — Plaud access token is handled
  transiently as described in the privacy policy. Not stored. Not
  transmitted to third parties.
- "Personal communications": No.
- "Location": No.
- "Web history": No.
- "User activity": No.
- "Website content": No.

Affirmations to check:

- ✅ I do not sell or transfer user data to third parties outside of the
  approved use cases.
- ✅ I do not use or transfer user data for purposes unrelated to the
  item's single purpose.
- ✅ I do not use or transfer user data to determine creditworthiness or
  for lending purposes.

---

## Screenshots

Place 1280×800 PNGs under `docs/store/`. Recommended set:

1. `screenshot-1.png` — OpenPlaud connect screen with the "Continue with
   Plaud" button visible.
2. `screenshot-2.png` — The welcome / onboarding page (three steps).
3. `screenshot-3.png` — The popup with a self-hosted instance paired.

See `docs/store/README.md` for capture instructions.
