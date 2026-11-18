# Riffado Connector — Privacy Policy

**Canonical URL:** <https://riffado.com/privacy/connector>

This file is the source text for that page. The version published on
riffado.com should match the contents of this file at the corresponding
release tag.

_Last updated: see the most recent commit touching this file._

---

## Summary

The Riffado Connector is a browser extension that copies your Plaud sign-in
tokens (an access token and, when Plaud provides one, a refresh token) from
a tab where you are logged in to `web.plaud.ai` to a tab where you are
logged in to Riffado (hosted at `riffado.com`, or self-hosted at a URL you
choose). The tokens never leave your browser except in the final HTTPS
request that your Riffado tab makes to your Riffado server.

There is no backend operated by the connector. The extension does not send
analytics, telemetry, crash reports, or any other data anywhere.

## What data the extension handles

- **Plaud access token.** Read from Plaud's `pld_ut` cookie on `plaud.ai`
  via the browser's `chrome.cookies` API, then checked once against
  Plaud's API (`/team-app/workspaces/list`) to confirm it works. Held in
  extension memory only long enough to forward it to the Riffado tab that
  requested the bridge. Not written to disk by the extension.
- **Plaud refresh token.** Read from Plaud's `pld_urt` cookie on
  `plaud.ai` via `chrome.cookies`, if present, after the access token has
  been confirmed. Plaud's access token expires 24 hours after sign-in;
  the refresh token lets Riffado renew it so your connection keeps
  working until Plaud's 30-day sign-in session ends. It is handled
  exactly like the access token: held in memory only, handed only to the
  Riffado tab you started the connect from, and not written to disk by
  the extension. The extension does not use it to call Plaud itself.
- **List of self-hosted Riffado origins you have paired.** Stored in
  `chrome.storage.local`, which is local to your browser profile.
- **Tab IDs of the in-flight bridge.** In-memory only, cleared when the
  bridge completes or after five minutes.

## What the extension does not collect

- No passwords. The connector never sees your Plaud credentials, your
  Google account, your Apple account, or any Riffado credentials.
- No browsing history.
- No analytics or telemetry of any kind.
- No data is sent to the connector's developers or to any third party.

## Where data goes

The only network destination involving the tokens is the Riffado tab you
initiated the bridge from. That tab POSTs the tokens to its own backend
(`/api/plaud/auth/connect-token`) — i.e. to the Riffado instance you
are already signed in to. If you are using `riffado.com`, that request
goes to riffado.com. If you are self-hosting, it goes to your server.

The connector's only outbound network request is the one check of the
access token against Plaud's own API described above. It sends nothing
anywhere else.

## Permissions, in plain English

- **`storage`** — remembers which self-hosted Riffado origins you paired,
  so you don't have to re-add them.
- **`tabs`** — opens `web.plaud.ai` in a new tab and closes it after
  capturing the tokens.
- **`scripting`** — lets the extension add its bridge to self-hosted
  Riffado URLs you pair.
- **`cookies`** — reads Plaud's `pld_ut` (access token) and `pld_urt`
  (refresh token) cookies. Both are `HttpOnly`, so no web page script
  can read them; this API is the only way. Limited to `plaud.ai` by the
  host access below.
- **Host access to `*.plaud.ai`** — required to read the tokens from
  a tab where you are already signed in to Plaud and to check the access
  token against Plaud.
- **Host access to `riffado.com`** — required to deliver the tokens to
  the hosted Riffado app.
- **Optional host access (`https://*/*`, `http://*/*`)** — used only when
  you explicitly add a self-hosted Riffado URL. Each origin is requested
  separately and prompts you for permission. Removing an origin from the
  popup revokes that permission.

## Data retention and deletion

- The tokens are held in extension memory for the duration of one bridge
  flow (seconds, not minutes) and discarded.
- The list of paired self-hosted origins persists in your browser until
  you remove an origin from the popup or uninstall the extension.
- Uninstalling the extension deletes everything the extension has stored.

## Open source

The connector is open source under AGPL-3.0. Source code:
<https://github.com/riffado/connector>. You can verify every claim above
by reading it.

## Contact

Issues and questions: <https://github.com/riffado/connector/issues>.
