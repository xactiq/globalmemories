# Wazuh Pilot Scope

## Goal

Deploy Wazuh narrowly enough to improve safety without creating too much operational drag.

## Suggested first monitored scope

### Host / environment
- the primary machine or host running Memory Hub / Mission Control related services

### Paths and concerns
- platform backend config directories
- token and secret storage locations
- connector state files
- app directories for Memory Hub and Mission Control
- suspicious process/network behavior on the host

## Explicit non-goals for pilot

- broad surveillance of all personal content
- huge enterprise-style rollout
- dumping raw telemetry into Memory Hub
- replacing product architecture with security tooling

## Pilot success criteria

- alerts are understandable
- alert noise is manageable
- Mission Control can consume a summary of relevant findings
- privacy boundaries remain clear
- Logan feels safer, not more buried in noise
