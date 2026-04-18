# Memory Hub Backend

This is a minimal backend skeleton for Microsoft connector support.

## Run

```bash
cd backend
node server.js
```

Default port:
- `8787`

Override with:
- `MEMORY_HUB_BACKEND_PORT`

## Environment

Create a `.env` file beside `server.js` with:

```env
MEMORY_HUB_BACKEND_PORT=8787
MICROSOFT_TENANT_ID=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_REDIRECT_URI=http://localhost:8787/api/connectors/microsoft/callback
```

## Current endpoints

- `GET /api/connectors/microsoft/status`
- `POST /api/connectors/microsoft/connect`
- `GET /api/connectors/microsoft/callback`
- `POST /api/connectors/microsoft/sync`

## Current state

- status endpoint returns live configured/unconfigured state from `.env`
- connect endpoint now returns a real Microsoft OAuth start URL when config is present
- callback and sync are still intentional stubs for the next implementation step
