# Miro Role and Sync Guidance

## Recommended role for Miro

Miro should be a **visual mirror and planning surface**, not the canonical source of truth.

Good fits:
- system maps
- customer journey maps
- knowledge architecture maps
- relationship maps
- product planning boards
- forever board for high-level concepts and linked assets

## What should sync into Miro

Selective, summarized, visual-friendly items only:
- key entities
- major projects
- high-level relationships
- strategic workflows
- important documents as linked references
- milestone decisions
- system topology views

## What should not rely on Miro as the source of truth

- OAuth tokens
- connector config secrets
- raw email/document payloads
- sync job state
- compliance audit logs
- canonical memory records
- permission boundaries

## Safe sync model

Use a one-way or controlled two-way sync model:

### Preferred initial model
- canonical layer -> Miro mirror

That means:
- Memory Hub / Mission Control maintain truth
- Miro receives curated, visual-safe summaries
- Miro cards link back to source records in your apps

### Optional later model
- controlled Miro annotations -> canonical layer

Only if you want it later, and only with explicit mapping rules.

## Suggested board structure

### Board 1: Platform map
- Memory Hub
- Mission Control
- iBuilders Lab
- connector ecosystem
- shared canonical layer

### Board 2: Strategic memory map
- people
- projects
- systems
- documents
- decisions
- relationships

### Board 3: Monetization map
- product tiers
- service offers
- customer segments
- upgrade paths

## Security guidance

Miro is not your security model.

Treat it as:
- a planning layer
- a communication layer
- a visual recall layer

Security should remain in:
- backend services
- structured storage
- access controls
- audit logs
- backups
- per-workspace permissions

## Product value of Miro integration

Miro integration can still be commercially useful because it gives:
- a more visual demo story
- executive-friendly views
- collaborative planning space
- a memorable differentiator

That makes it valuable, just not canonical.
