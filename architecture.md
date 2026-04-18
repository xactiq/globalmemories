# Memory Hub Architecture

## Core stack

### 1. OpenClaw

Use OpenClaw as the live assistant runtime and messaging layer.

Responsibilities:
- Discord, Telegram, and other chat surfaces
- direct user interaction
- session memory files and workspace updates
- tool execution and automation inside the workspace

### 2. Mission Control

Use Mission Control as the orchestration and observability layer.

Responsibilities:
- multi-agent workflows
- task routing and monitoring
- operations dashboard
- alerting, review gates, and audit visibility
- optional adapter layer for OpenClaw runtime status

### 3. Memory Hub

Use this app as the long-term memory and source-integration layer.

Responsibilities:
- ingest multi-source history and files
- normalize memory into one schema
- expose graph, timeline, connector, and source views
- become the browse/search layer for assistant memory

## Why separate the layers

These tools solve different problems:

- OpenClaw is where the assistant lives
- Mission Control is how agents are supervised
- Memory Hub is where durable connected memory is organized

Trying to force one tool to do all three creates a mess.

## Data flow

```text
Discord / Telegram / local files / Outlook / OneDrive
                ↓
         Connector ingestion layer
                ↓
        Normalized memory store
                ↓
        Memory Hub UI and graph views
                ↓
   Optional tasks / automations / sync jobs
                ↓
 Mission Control orchestration and OpenClaw actions
```

## Integration points

### OpenClaw → Memory Hub

Potential integrations:
- write session summaries and curated events into the memory store
- sync `memory/*.md` and `MEMORY.md`
- push notable decisions, tasks, and relationship updates

### Memory Hub → OpenClaw

Potential integrations:
- give OpenClaw better retrieval context
- surface related entities and past events
- suggest memory updates or source links during conversations

### Mission Control → OpenClaw

Potential integrations:
- observe OpenClaw tasks and background work
- dispatch structured jobs back to OpenClaw
- show runtime health and operational state

### Mission Control → Memory Hub

Potential integrations:
- trigger ingestion jobs
- run connector sync workflows
- monitor connector failures and stale sources
- audit memory update pipelines

## Suggested build order

1. stabilize Memory Hub as a standalone source and graph system
2. add connector management and source explorer UI
3. add backend support for OAuth connectors like Microsoft Graph
4. integrate OpenClaw memory sync into the normalized store
5. optionally expose Memory Hub status and jobs to Mission Control
6. connect Mission Control only after the memory model is stable

## Immediate next features

- connector management panel
- source explorer panel
- memory detail drawer
- timeline view
- Outlook and OneDrive connector backend stubs
- OpenClaw import adapter

## Guardrails

- do not store secrets in committed generated data
- keep raw source records and normalized memory separate
- make every ingestion path traceable back to a source id
- treat OAuth tokens and provider credentials as backend-only secrets
