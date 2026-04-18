# Backend Status Plan

## Goal

Expose backend connector health and status so the UI can move from placeholders to real state.

## First backend-visible states

- disconnected
- connected
- syncing
- sync-error
- stale

## Minimum status payload

- connector id
- enabled flag
- connection state
- last sync timestamp
- account label
- last error summary

## UI use

The Settings tab can later consume this status payload and show:
- whether Outlook is connected
- whether OneDrive is connected
- last successful sync
- whether re-auth is needed
