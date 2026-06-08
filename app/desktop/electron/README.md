# Desktop Wrapper

This folder contains the Electron wrapper for the WSC 2026 Study Routes app.

## Files

- `main.js` creates the desktop window and loads the local `index.html`.
- `preload.js` exposes a minimal `window.WSC_DESKTOP_APP` object so the web app can switch off browser-only install messaging.

## Runtime behavior

- Loads the existing site directly from local project files.
- Keeps the current Learn / Play architecture unchanged.
- Opens external links in the system browser instead of inside the app window.

## Build icons

Electron packaging expects:

- `desktop/icons/app.png` as the default desktop icon source
- `desktop/icons/app.icns` for macOS when available
- `desktop/icons/app.ico` for Windows

They can be regenerated from the existing project artwork by recovering the archived helper script:

```zsh
python3 /Users/francoismo/Documents/Playground/WSC/archive/toreview/2026-05-17-deep-clean/dev-oneoffs-and-legacy/app/scripts/generate_desktop_icons.py
```
