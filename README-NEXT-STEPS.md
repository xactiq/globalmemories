# Next Steps

## Prototype passphrase

A temporary passphrase gate has been added for the prototype deployment.

Default temporary passphrase:

- `change-me-memory-globe`

Change it before public deployment by running:

```bash
python3 src/set-passhash.py "your-new-passphrase"
```

Then regenerate data if needed and redeploy.

## Important

This is only a temporary front-door gate for the prototype. Real auth should replace it.
