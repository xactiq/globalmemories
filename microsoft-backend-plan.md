# Microsoft Backend Plan

## Goal

Support secure Outlook and OneDrive ingestion through Microsoft Graph.

## Why backend support is required

The current app is a static frontend. Microsoft Graph connectors need backend support for:

- OAuth authorization code flow
- refresh token storage
- secure secret handling
- scheduled sync jobs
- source checkpoint persistence

## Minimum backend responsibilities

1. store connector configuration securely
2. handle Microsoft login and callback
3. exchange auth code for tokens
4. refresh tokens when needed
5. fetch Outlook and OneDrive data from Microsoft Graph
6. map results into the normalized memory store
7. emit sanitized graph and hub datasets for the UI

## First practical implementation

Create a lightweight service or server routes that expose:

- `GET /api/connectors/microsoft/status`
- `POST /api/connectors/microsoft/connect`
- `GET /api/connectors/microsoft/callback`
- `POST /api/connectors/microsoft/sync`

## Security rules

- never store client secrets in frontend files
- never commit tokens to git
- keep connector credentials in environment variables or secure local secrets storage
- sanitize imported content before publishing derived datasets
