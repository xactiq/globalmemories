# Implementation Roadmap - Next

## Immediate build sequence

### 1. Canonical backbone
- implement workspace-aware canonical ids
- add provenance refs to normalized memory records
- define internal APIs for memory, connectors, jobs, and audit

### 2. Product separation
- keep Memory Hub focused on browse/search/edit/retrieval
- keep Mission Control focused on orchestration, jobs, and oversight
- define shared auth and tenant model

### 3. Monetization readiness
- define plans and usage limits
- identify billing events and metering points
- define per-plan connector access
- define services vs SaaS packaging

### 4. Miro mirror
- define export shape for visual entities/relationships
- decide board taxonomy
- add source links back into product records

## Recommended execution order

1. schema and API contracts
2. Mission Control boundary doc
3. pricing and packaging
4. Miro sync spec
5. implementation tickets

## Practical outcome

If you do the sequence above, you will have:
- a buildable architecture
- a sellable product story
- a services layer that can fund the product
- a path to keep Mission Control and Memory Hub independent but aligned
