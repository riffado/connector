# OpenPlaud Connector — Privacy Policy

**Canonical URL:** <https://openplaud.com/privacy/connector>

This file is the source text for that page. The version published on
openplaud.com should match the contents of this file at the corresponding
release tag.

_Last updated: see the most recent commit touching this file._

---

## Summary

The OpenPlaud Connector is a browser extension that copies a single value —
your Plaud access token — from a tab where you are logged in to
`web.plaud.ai` to a tab where you are logged in to OpenPlaud (hosted at
`openplaud.com`, or self-hosted at a URL you choose). The token never
leaves your browser except in the final HTTPS request that your OpenPlaud
tab makes to your OpenPlaud server.

There is no backend operated by the connector. The extension does not send
analytics, telemetry, crash reports, or any other data anywhere.

## What data the extension handles

- **Plaud access token.** Read from `localStorage` and from outgoing
  `Authorization: Bearer …` headers on requests your browser is already
  making to `api*.plaud.ai`. Held in extension memory only long enough to
  forward it to the OpenPlaud tab that requested the bridge. Not written
  to disk by the extension.
- **List of self-hosted OpenPlaud origins you have paired.** Stored in
  `chrome.storage.local`, which is local to your browser profile.
- **Tab IDs of the in-flight bridge.** In-memory only, cleared when the
  bridge completes or after five minutes.

## What the extension does not collect

- No passwords. The connector never sees your Plaud credentials, your
  Google account, your Apple account, or any OpenPlaud credentials.
- No browsing history.
- No analytics or telemetry of any kind.
- No data is sent to the connector's developers or to any third party.

## Where data goes

The only network destination involving the token is the OpenPlaud tab you
initiated the bridge from. That tab POSTs the token to its own backend
(`/api/plaud/auth/connect-token`) — i.e. to the OpenPlaud instance you
are already signed in to. If you are using `openplaud.com`, that request
goes to openplaud.com. If you are self-hosting, it goes to your server.

The connector itself makes no outbound network requests.

## Permissions, in plain English

- **`storage`** — remembers which self-hosted OpenPlaud origins you paired,
  so you don't have to re-add them.
- **`tabs`** — opens `web.plaud.ai` in a new tab and closes it after
  capturing the token.
- **Host access to `*.plaud.ai`** — required to read the access token from
  a tab where you are already signed in to Plaud.
- **Host access to `openplaud.com`** — required to deliver the token to
  the hosted OpenPlaud app.
- **Optional host access (`https://*/*`)** — used only when you explicitly
  add a self-hosted OpenPlaud URL. Each origin is requested separately and
  prompts you for permission. Removing an origin from the popup revokes
  that permission.

## Data retention and deletion

- The token is held in extension memory for the duration of one bridge
  flow (seconds, not minutes) and discarded.
- The list of paired self-hosted origins persists in your browser until
  you remove an origin from the popup or uninstall the extension.
- Uninstalling the extension deletes everything the extension has stored.

## Open source

The connector is open source under AGPL-3.0. Source code:
<https://github.com/openplaud/connector>. You can verify every claim above
by reading it.

## Contact

Issues and questions: <https://github.com/openplaud/connector/issues>.
