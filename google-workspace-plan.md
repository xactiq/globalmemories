# Google Workspace Connector Plan

Google Workspace is now the preferred cloud connector path for Memory Hub.

## Goals

- Connect a real Google Workspace identity used frequently by the user
- Pull Gmail, Google Calendar, and Google Drive data into the Memory Hub backend
- Avoid Microsoft guest-account and licensing friction for the primary memory pipeline

## Initial OAuth scope set

- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/drive.metadata.readonly`

## Backend endpoints to add

- `GET /api/connectors/google/status`
- `POST /api/connectors/google/connect`
- `GET /api/connectors/google/callback`
- `POST /api/connectors/google/sync`

## Local prototype storage

- `backend/.google-tokens.json`
- `backend/.google-sync.json`

These files must remain local and uncommitted.

## Google Cloud setup

Use Google Cloud Console to:

1. create or select a project for Memory Hub
2. configure the OAuth consent screen
3. create an OAuth 2.0 Client ID for a Desktop/Web app
4. add redirect URI:
   - `http://localhost:8787/api/connectors/google/callback`
5. copy client ID and client secret into backend `.env`

## First sync targets

- Gmail, recent message list
- Calendar, upcoming events
- Drive, root file/folder metadata

## Notes

Google Workspace is the primary connector direction. Microsoft remains optional and experimental.
