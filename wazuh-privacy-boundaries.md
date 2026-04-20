# Wazuh Privacy Boundaries

## Principle

The system should improve security without becoming indiscriminate surveillance.

## Rules

1. Monitor platform integrity first, personal content second.
2. Keep raw Wazuh telemetry in the security layer.
3. Send only summarized or approved events into Mission Control.
4. Send only curated durable security knowledge into Memory Hub.
5. Define monitored file paths explicitly before deployment.
6. Avoid collecting more than is needed to protect the platform and its data.

## Safe default posture

- watch platform files, services, and suspicious behavior
- avoid unnecessary ingestion of private content
- require review before widening scope
