# Backend Endpoints

## Microsoft connector endpoints

These are the first backend endpoints the Memory Hub should expose when Microsoft Graph support is implemented.

### Status

`GET /api/connectors/microsoft/status`

Returns connector connection state, account label, last sync time, and per-connector readiness.

### Connect

`POST /api/connectors/microsoft/connect`

Starts the Microsoft OAuth flow.

### Callback

`GET /api/connectors/microsoft/callback`

Handles the Microsoft OAuth callback, exchanges the auth code, and stores tokens securely.

### Sync

`POST /api/connectors/microsoft/sync`

Runs ingestion for enabled Microsoft connectors, such as Outlook and OneDrive.

## Future endpoints

- `GET /api/connectors`
- `POST /api/connectors/:id/enable`
- `POST /api/connectors/:id/disable`
- `GET /api/sources`
- `GET /api/memories`
- `GET /api/entities/:id`
