# Next Steps

## Prototype passphrase

A temporary passphrase gate has been added for the prototype deployment.

Current passphrase:

- `151cr394`

Change it before wider use by updating `config.js` with a new SHA-256 hash.

## Generated hub data

The app currently ships generated files:

- `graph.json`
- `memory-store.json`
- `hub-data.json`

These are generated from workspace memory using:

```bash
node build-memory-store.js
node build-connectors.js
```

## Important

This is only a temporary front-door gate for the prototype. Real auth should replace it.
