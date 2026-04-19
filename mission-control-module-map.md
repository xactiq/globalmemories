# Mission Control Module Map

## Core Mission Control modules

### 1. Connector Operations
Uses:
- `GET /api/connectors`
- `GET /api/connectors/:id/status`
- `POST /api/connectors/:id/sync`
- `GET /api/connectors/:id/jobs`

Purpose:
- monitor connector health
- trigger syncs
- inspect connector failures

### 2. Job and Workflow Monitor
Uses:
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs/:id/retry`
- `POST /api/jobs/:id/cancel`

Purpose:
- monitor ingestion and workflow jobs
- manage retries and cancellations
- give operators visibility into system health

### 3. Audit and Governance
Uses:
- `GET /api/audit`
- `GET /api/audit?targetType=&targetId=`

Purpose:
- review critical changes
- inspect approvals and exceptions
- support enterprise trust requirements

### 4. Retrieval-Assisted Operations
Uses:
- `GET /api/memory/search?q=`
- `GET /api/memory/:id`
- `GET /api/memory/:id/provenance`

Purpose:
- support operators during workflow review
- explain why a memory or recommendation exists
- inspect source-linked context during incidents

## Boundary rule

Mission Control should not try to replace Memory Hub's graph, browse, or editing experience.

Mission Control is for:
- supervision
- orchestration
- audits
- operational visibility

Memory Hub is for:
- memory browsing
- retrieval
- editing/curation
- graph exploration
