# Review Guide

Use this guide for quick PR review and local verification.

## Main Runtime

- `app/index.html` loads the classic scripts.
- `app/app.js` owns the local/online mode switch and live-game UI wiring.
- `app/src/features/campus-2d/` owns the 2D campus manifest, realtime adapter,
  and DOM runtime.
- `app/assets/campus-2d/` contains the four room maps and alpaca sprite sheet.

## Online Flow

1. Choose Online from the entry gate.
2. The user lands in the Lobby 2D room.
3. Lobby portals lead to Courtyard, Library, and Debate Lab.
4. The Games popup reuses the existing animated online cards.
5. Selecting a card switches into the existing live-game room UI.

## Verification Commands

Run from `app/`:

```sh
npm run test:classic-scripts
npm run test:campus2d
npm run test:smoke
npm run build:pages
npm run audit:pages
```

For a fuller pass:

```sh
npm run verify
npm run verify:vercel
```

## Review Focus

- The Online entry must not reference removed campus runtimes.
- The `.online-glow-card` card markup and styles should remain intact.
- 2D movement should keep simulation state separate from DOM rendering.
- Campus chat/presence should stay ephemeral; live-game persistence remains in
  the existing Supabase live-game services.
