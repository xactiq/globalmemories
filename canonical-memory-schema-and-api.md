# Canonical Memory Schema and Internal API

## Purpose

Define the shared backbone that lets Memory Hub, Mission Control, and future products use the same information without depending on one another's UI or internal runtime.

## Design goals

- one canonical memory layer
- source provenance on every record
- app independence
- tenant/workspace boundaries
- retrieval-friendly structure
- auditability
- product-ready API boundaries

## Top-level domain objects

### Workspace
A tenant or environment boundary.

Fields:
- `workspaceId`
- `name`
- `slug`
- `plan`
- `ownerId`
- `settings`
- `createdAt`
- `updatedAt`

### Source
A raw origin of information.

Examples:
- local memory markdown file
- Google Drive file
- Gmail message
- calendar event
- Discord thread
- Miro board item

Fields:
- `sourceId`
- `workspaceId`
- `provider` (`local`, `google`, `microsoft`, `discord`, `miro`, etc.)
- `kind` (`file`, `email`, `doc`, `message`, `event`, `board-item`)
- `externalId`
- `title`
- `url`
- `path`
- `author`
- `createdAt`
- `updatedAt`
- `syncMetadata`

### MemoryRecord
The normalized durable memory object.

Fields:
- `memoryId`
- `workspaceId`
- `title`
- `summary`
- `content`
- `excerpt`
- `memoryType` (`fact`, `decision`, `task`, `relationship`, `doc-note`, `conversation-summary`)
- `importance`
- `status` (`active`, `archived`, `draft`)
- `tags[]`
- `entityIds[]`
- `sourceRefs[]`
- `createdAt`
- `updatedAt`
- `createdBy`
- `visibility`

### Entity
A person, org, topic, project, system, place, or concept.

Fields:
- `entityId`
- `workspaceId`
- `type`
- `name`
- `aliases[]`
- `summary`
- `attributes`
- `createdAt`
- `updatedAt`

### Relationship
A structured edge between entities or between an entity and a memory.

Fields:
- `relationshipId`
- `workspaceId`
- `fromId`
- `toId`
- `relationshipType`
- `weight`
- `sourceRefs[]`
- `createdAt`
- `updatedAt`

### Connector
Represents an integration capability.

Fields:
- `connectorId`
- `workspaceId`
- `provider`
- `status`
- `authStatus`
- `scopes[]`
- `lastSyncAt`
- `health`
- `configRef`

### SyncJob
Tracks connector and ingestion execution.

Fields:
- `syncJobId`
- `workspaceId`
- `connectorId`
- `jobType`
- `status`
- `startedAt`
- `finishedAt`
- `metrics`
- `errors[]`
- `triggeredBy`

### AuditEvent
Captures meaningful state changes.

Fields:
- `auditEventId`
- `workspaceId`
- `actorId`
- `actorType`
- `action`
- `targetType`
- `targetId`
- `payload`
- `createdAt`

## Provenance model

Every `MemoryRecord` should reference one or more `sourceRefs`, where each ref includes:
- `sourceId`
- `provider`
- `kind`
- `externalId`
- `url`
- `excerpt`
- `confidence`

This is critical for trust, explainability, and enterprise readiness.

## Internal API boundaries

## Memory API
Used by Memory Hub, Mission Control, OpenClaw adapters, and future products.

### Query
- `GET /api/memory/search?q=`
- `GET /api/memory/:id`
- `GET /api/memory?workspaceId=&type=&tag=`
- `GET /api/entities/:id`
- `GET /api/graph?workspaceId=`

### Write
- `POST /api/memory`
- `PATCH /api/memory/:id`
- `POST /api/entities`
- `PATCH /api/entities/:id`
- `POST /api/relationships`

### Explainability
- `GET /api/memory/:id/provenance`
- `GET /api/source/:id`

## Connector API
Used by Mission Control and integration UIs.

- `GET /api/connectors`
- `GET /api/connectors/:id/status`
- `POST /api/connectors/:id/connect`
- `POST /api/connectors/:id/sync`
- `GET /api/connectors/:id/jobs`

## Sync and Job API
Used primarily by Mission Control.

- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs/:id/retry`
- `POST /api/jobs/:id/cancel`

## Audit API
Used for enterprise/admin visibility.

- `GET /api/audit`
- `GET /api/audit?targetType=memory&targetId=...`

## Product-specific use of the canonical API

### Memory Hub should use:
- memory query APIs
- entity/graph APIs
- write/edit APIs for human curation
- provenance APIs for drill-down

### Mission Control should use:
- connector APIs
- sync/job APIs
- audit APIs
- selected memory search APIs when workflows need retrieval

### iBuilders Lab should use:
- setup/config flows
- solution templates against connector and workflow APIs
- packaging against workspace-level configuration

## Independence rule

No product should require another product's frontend to function.

Allowed:
- shared canonical APIs
- shared event streams
- shared storage layer
- shared identity and billing layer

Not allowed:
- scraping Memory Hub UI from Mission Control
- using Mission Control dashboard state as canonical memory
- using Miro as the canonical structured store

## Event model

Useful internal events:
- `memory.created`
- `memory.updated`
- `entity.created`
- `connector.connected`
- `connector.sync.completed`
- `connector.sync.failed`
- `job.failed`
- `workflow.approval.required`

These events let products stay loosely coupled.

## Multi-tenant requirements

If monetization is real, build for tenant separation early.

Minimum requirements:
- every object is scoped to `workspaceId`
- per-workspace connector credentials
- per-workspace API auth boundaries
- per-workspace storage and export support
- per-workspace audit visibility

## Immediate recommendation

Start with:
- canonical ids
- provenance on every memory
- simple internal API contracts
- connector job records
- workspace boundaries

That gives you a product-safe foundation without overbuilding too early.
