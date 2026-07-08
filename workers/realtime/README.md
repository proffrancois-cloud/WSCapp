# WSCapp Realtime Worker

Cloudflare Worker + Durable Objects transport for the WSCapp 2D campus.

## Runtime model

- One `CampusRoom` Durable Object per room id.
- Maximum 50 active WebSocket clients per room.
- Movement messages are accepted at most once every 200ms per client.
- Room snapshots are grouped at 100ms while the room is active.
- Public chat is room-scoped, max 120 characters, max 2 messages per 3 seconds per client.
- Debate Lab uses this Worker only for state/signaling. Audio remains peer-to-peer WebRTC.

## Local commands

```zsh
cd /Users/francoismo/Documents/Playground/WSC/workers/realtime
npm test
npm run deploy:dry-run
npm run dev
```

With the Worker running locally or deployed, run a synthetic load pass:

```zsh
WSC_REALTIME_WS_URL=ws://localhost:8787/room/load-test npm run test:load
WSC_REALTIME_WS_URL=wss://realtime.wscapp.app/room/load-test npm run test:load
```

## Production target

Use the Cloudflare custom domain `https://realtime.wscapp.app` for this Worker and the WebSocket endpoint:

```text
wss://realtime.wscapp.app/room/:roomId
```

The static app reads that endpoint from `app/realtime-config.js` and can fall back to the legacy Supabase transport during rollout.
