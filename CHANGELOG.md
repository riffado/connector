# Changelog

All notable changes to OpenPlaud Connector will be documented here. The
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.1] — 2026-05-08

First sideload-distributable release. Not yet on the Chrome Web Store —
icons and store assets still pending. Install via the GitHub release zip
(see README).

### Added
- First-run welcome page with three-step onboarding, opened automatically
  on install.
- "Open openplaud.com" primary action and "How it works" link in the
  popup.
- `STORE_LISTING.md` with paste-ready Chrome Web Store copy and
  per-permission justifications.
- `PRIVACY.md` as the source of truth for
  <https://openplaud.com/privacy/connector>.
- GitHub Actions release workflow: tag `v*` builds and attaches the
  extension zip to the GitHub release.
- `homepage_url` and `minimum_chrome_version: "114"` in the manifest.

### Changed
- Narrowed `optional_host_permissions` from `https://*/*` + `http://*/*`
  to `https://*/*` only. Self-hosted OpenPlaud over plain HTTP isn't a
  realistic deployment and dropping HTTP shrinks the CWS review surface.
- README rewritten for non-technical users: Chrome Web Store install
  first, sideload from GitHub release second, development last.
- `pnpm zip` script now creates `dist-zip/` if missing.

### Pending before Chrome Web Store submission
- Icons (16/32/48/128) — wire up via `manifest.icons` and
  `action.default_icon`.
- Promo tile (440×280).
- Publish `PRIVACY.md` at <https://openplaud.com/privacy/connector>.

## [0.1.0] — initial

- Bridge flow between `web.plaud.ai` and an OpenPlaud tab.
- Popup for managing self-hosted instances via runtime
  `chrome.permissions` requests.
