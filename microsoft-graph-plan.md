# Microsoft Graph Connector Plan

## Goal

Add first-class connectors for:

- Outlook mail
- Outlook calendar
- OneDrive files and folders

## Requirements

- Microsoft app registration in Azure
- OAuth client credentials for delegated access
- secure token storage
- incremental sync cursors
- source mapping into the normalized memory store

## Connector responsibilities

### Outlook

- ingest messages
- ingest calendar events
- map senders, recipients, threads, and attachments
- create conversation, event, and file entities

### OneDrive

- ingest files and folders
- preserve source ids and web URLs
- map file metadata into document/file entities
- optionally extract text from supported file types later

## Suggested phases

1. add connector registry and source metadata
2. add OAuth config model
3. add Microsoft Graph fetch client
4. add Outlook sync
5. add OneDrive sync
6. add in-app connector management UI

## Security note

Do not hardcode Microsoft secrets in the repo or static app files. Real connectors need a backend or secure local service for token exchange and storage.
