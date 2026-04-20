# Platform System Map Spec

## Primary destinations

### 1. Memory Hub
- URL: `https://memory.xactiq.net`
- Role: human-facing memory product
- Board label: **Memory Hub**
- Description: searchable memory, graph, retrieval, source-linked context

### 2. Mission Control
- URL: `https://mc.xactiq.net`
- Role: independent operational control layer
- Board label: **Mission Control**
- Description: connector status, sync jobs, audit events, workflow oversight, system health

## Shared backbone

### 3. Canonical Memory Layer
- URL: internal architecture / docs reference
- Role: shared source of truth for memories, entities, relationships, sources, sync jobs, and audit events
- Board label: **Canonical Memory Layer**
- Description: shared context backbone used by both products without coupling the UIs together

## Input/source nodes

### 4. Google Workspace
- Role: primary connected source
- Includes: Gmail, Drive, Calendar

### 5. Local Memory Files
- Role: assistant-native durable memory input
- Includes: `memory/*.md`, curated notes, workspace memory flow

### 6. OpenClaw
- Role: live assistant runtime and action layer
- Description: conversations, tools, memory writes, automations

### 7. Microsoft 365 (experimental)
- Role: optional/secondary connector path
- Description: not primary for now due to real-world auth/licensing issues

## Visual/strategy layer

### 8. Miro Mirror
- Role: visual mirror and planning layer
- Description: system map, strategic memory map, monetization map, demo board

## Business layer

### 9. iBuilders Lab
- Role: implementation and services layer
- Description: onboarding, workflow setup, vertical customization, client delivery

### 10. Business Outcomes
- Role: commercial result layer
- Description: faster retrieval, better context, operational trust, sellable SaaS, sellable services

## Recommended arrows

- Google Workspace -> Canonical Memory Layer
- Local Memory Files -> Canonical Memory Layer
- OpenClaw -> Canonical Memory Layer
- Microsoft 365 (experimental) -> Canonical Memory Layer
- Canonical Memory Layer -> Memory Hub
- Canonical Memory Layer -> Mission Control
- Canonical Memory Layer -> Miro Mirror
- iBuilders Lab -> Memory Hub
- iBuilders Lab -> Mission Control
- Memory Hub -> Business Outcomes
- Mission Control -> Business Outcomes
- Miro Mirror -> Business Outcomes

## Key note for board

**Memory Hub and Mission Control should each have their own stable destination and should share context through the canonical layer, not through each other's frontend.**
