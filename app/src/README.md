# WSC App Source Bridge

This folder is the transition layer between the current single-file app and the target reusable engine.

The app still boots through `app/index.html`, with `app/app.js` kept as a tiny compatibility guard. The legacy runtime now lives in `src/app/app-main.js`, and new engine pieces should be extracted here first instead of adding more logic to either bootstrap path.

## Current Files

```text
  src/
  app/
    app-main.js # Temporary legacy runtime bridge while feature areas migrate into smaller modules.
    progress-storage-controller.js # Owns local stats/raw-mastery persistence and blocked-storage fallbacks.
    app-dom-service.js # Owns trusted HTML parsing/writes so legacy renderers use one audited DOM boundary.
    device-presentation-controller.js # Owns touch/desktop viewport classes, landscape gate, and compact keyboard visibility.
    app-settings-controller.js # Owns music settings modal state, storage, and local background playback.
  theme/
    section-ids.js       # Converts future canonical section IDs to the current runtime IDs and back.
  services/
    asset-service.js     # Resolves configured image/audio asset paths for UI, modes, games, and results.
    storage-service.js   # Wraps localStorage JSON reads/writes for progress and future local state.
    progress-service.js  # Owns default stat shape and progress/raw-mastery normalization.
    video-service.js     # Owns YouTube embed/preview URLs, video URL normalization, and channel video extraction.
    game-question-service.js # Owns shared game-question pools, required levels, reusable question patterns, and unavailable-route wording.
    auth-service.js      # Owns low-level Alpaccount helpers: name normalization, redirect URL, config checks, Supabase client creation.
    supabase-profile-service.js # Owns Alpaccount table/RPC names for profile, progress, name availability, and login lookup.
    alpacapardy-live-supabase-service.js # Owns future Supabase table calls for Alpacapardy live rooms, players, events, and snapshots.
    raw-content-service.js # Owns raw-content section lookup, route filtering, entry mapping, payloads, and mastery key counts.
  ui/
    auth-modal-renderer.js # Owns Alpaccount modal HTML while app.js keeps submit/click orchestration.
    wizard-renderer.js # Owns route-builder wizard HTML while app.js keeps selection actions.
  modes/
    learn/
      mindmap/
        mindmap-mode.js # Owns Mind Map rendering, entry popup rendering, and guide popup rendering.
      regular-guide/
        regular-guide-mode.js # Owns regular guide shell, guide document, guide question block, and guide navigation rendering.
      alpacards/
        alpacards-mode.js # Owns Alpacard filtering, rendering, navigation, flip, and shuffle behavior.
      alpaca-channel/
        alpaca-channel-mode.js # Owns Alpaca Channel rendering, channel-domain display, and video navigation.
      raw-content/
        raw-content-entry-renderer.js # Owns the main Raw Content entry-card HTML shell.
        raw-content-visual-assets.js # Owns Raw Content timelines, route maps, image cards, slideshows, and visual placeholders.
        raw-content-media-lightbox.js # Owns Raw Content media lightbox rendering and link-button logic.
        raw-content-quiz-renderer.js # Owns Raw Content quiz pager, question card, option state, and stable shuffle.
        raw-content-transfer-table.js # Owns Raw Content and guide transfer table rendering.
        raw-content-mastery.js # Owns Raw Content mastered toggle, back-to-top, and entry-level channel action rendering.
        raw-content-mode.js # Owns Raw Content shell rendering and multi-section entry grouping.
    play/
      live-session-service.js # Owns transport-neutral live session/player/event snapshots for future realtime play.
      alpaquiz/
        alpaquiz-engine.js # Owns Alpaquiz question pattern, difficulty selection, answer scoring, and result summaries.
        alpaquiz-renderer.js # Owns Alpaquiz setup, question page, result footer, and feedback HTML.
      alpacapardy/
        alpacapardy-engine.js # Owns Alpacapardy teams, board building, tile counts, standings, and score helpers.
        alpacapardy-renderer.js # Owns Alpacapardy setup, board, clue focus, team cards, tiles, and results HTML.
        alpacapardy-live.js # Owns transport-neutral Alpacapardy event reduction for future online multiplayer.
```

## Migration Rule

For now, keep a small compatibility wrapper in `app-main.js` whenever a helper is moved from the legacy runtime. That lets us extract the engine step by step while keeping the published app behavior identical.

## PWA Policy

The web shell keeps standalone/landscape manifest metadata for browser and home-screen compatibility, but the in-app install prompt stays hidden while `pwa.js` retires old service workers and route caches. This avoids mobile users getting stuck on stale cached app shells. Re-enabling install should include a new cache/update strategy plus source and artifact updates to `test:pwa-mobile-shell` and `test:pwa-retirement-runtime`.
