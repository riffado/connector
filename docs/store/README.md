# Chrome Web Store assets

This directory holds the visual assets uploaded alongside the extension
listing. Files here are not bundled into the extension itself.

## Required files

| File | Spec | Status |
| --- | --- | --- |
| `screenshot-1.png` | 1280×800 PNG | TODO — capture from a real build |
| `screenshot-2.png` | 1280×800 PNG | TODO — capture from a real build |
| `screenshot-3.png` | 1280×800 PNG | TODO — capture from a real build |
| `promo-tile-440x280.png` | 440×280 PNG | DEFERRED — needs branding |

The promo tile is deferred along with the extension icons; both depend on
final Riffado branding.

## How to capture screenshots

Each screenshot must be exactly 1280×800. Easiest path:

1. `pnpm build`
2. Chrome → `chrome://extensions` → Developer mode → **Load unpacked** →
   select `dist/`.
3. Open Chrome DevTools → Device toolbar → set a custom device at
   1280×800 (DPR 1), then take a full-viewport screenshot via DevTools
   command palette → "Capture screenshot".

Suggested shots:

1. **`screenshot-1.png` — Riffado connect screen with the bridge
   button.** Open riffado.com, navigate to the connect screen so the
   "Continue with Plaud" button is visible. This is the user-facing
   moment that explains what the extension does.
2. **`screenshot-2.png` — Welcome / onboarding page.** Trigger by
   reinstalling the extension, or by visiting
   `chrome-extension://<id>/src/welcome.html`.
3. **`screenshot-3.png` — Popup with one self-hosted instance paired.**
   Click the toolbar icon. Add `https://my-riffado.example.com` first
   so the list is populated.
