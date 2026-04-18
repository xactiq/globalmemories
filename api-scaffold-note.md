# API Scaffold Note

The repository now includes a small backend skeleton under `backend/`.

Current backend shape:
- simple Node HTTP server
- placeholder Microsoft connector status/connect/callback/sync endpoints
- no real OAuth or token persistence yet

Alternative backend approaches later:

1. Vercel serverless routes
2. a fuller Node service beside the app
3. a local OpenClaw-adjacent service for private sync and token storage

Recommended path:
- start with the included small backend service for connector auth and sync
- keep the static app as the user-facing shell
