# PsyPerspective

PsyPerspective is a browser-based remote viewing practice app. Creators publish hidden targets, viewers submit blind sketches and notes, creators can inspect live predictions, and closed exercises open for public reveal and accuracy scoring.

## Current scope

- Shared backend API for auth, exercises, messages, account settings, and creator drafts
- Password hashing on the host server before user credentials are persisted
- Creator target creation with blind cue, hidden target, reveal summary, and timed closure
- Viewer prediction workspace with freehand drawing pad and written impressions
- Visibility rules so only creators can view live predictions during active sessions
- Closed archive review with target reveal, prediction gallery, and per-user scoring
- One-time migration path from previous browser-only storage into the shared backend store

## LAN development run

```bash
node ./server/server.mjs
node ./node_modules/vite/bin/vite.js --host 0.0.0.0
```

The shared backend data file is created at:

```text
server/data/psy-perspective-db.json
```

The frontend uses relative `/api` paths by default. During local Vite development, `vite.config.ts` proxies `/api`
to `http://127.0.0.1:8787`, which means phones and other LAN devices can open the Vite URL and still hit the same
host-side backend. If you need a direct API origin instead, set `VITE_API_BASE_URL`.

## Production build

```bash
npm run build
```
