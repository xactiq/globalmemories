# API Scaffold Note

The current repository is still a static frontend-first prototype. These API contracts are scaffolding only.

Before implementation, choose one of these backend approaches:

1. Vercel serverless routes
2. a small Node service beside the app
3. a local OpenClaw-adjacent service for private sync and token storage

Recommended path:
- start with a small backend service for connector auth and sync
- keep the static app as the user-facing shell
