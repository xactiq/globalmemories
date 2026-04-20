# Wazuh -> Mission Control -> Memory Hub Map

## Wazuh
Produces:
- raw security telemetry
- file integrity alerts
- vulnerability findings
- configuration drift findings
- suspicious activity alerts

## Mission Control
Consumes from Wazuh:
- summarized security status
- high-priority alerts
- host health state
- incident candidates
- changed-file alerts for important platform paths

Mission Control should decide:
- what needs attention now
- what needs escalation
- what is just noise

## Memory Hub
Receives only curated durable items such as:
- notable incident summaries
- security decisions
- confirmed configuration changes worth remembering
- lessons learned

## Rule

Raw security telemetry should stay out of Memory Hub unless explicitly curated.
