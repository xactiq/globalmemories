# Memory Hub Backend

This is a minimal backend skeleton for future Microsoft connector support.

## Run

```bash
cd backend
node server.js
```

Default port:
- `8787`

Override with:
- `MEMORY_HUB_BACKEND_PORT`

## Current endpoints

- `GET /api/connectors/microsoft/status`
- `POST /api/connectors/microsoft/connect`
- `GET /api/connectors/microsoft/callback`
- `POST /api/connectors/microsoft/sync`

## Current state

Only the status endpoint returns a structured placeholder response.
The connect, callback, and sync endpoints are intentional `501 Not Implemented` stubs.
