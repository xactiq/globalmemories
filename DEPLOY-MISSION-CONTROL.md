# Deploy Mission Control

## Goal

Expose Mission Control as a stable surface that can be attached to:
- `mc.xactiq.net`

## Current route

Mission Control is available from this static app as:
- `/mission-control`

Backed by:
- `mission-control.html`
- `mission-control.js`

## Recommended deployment path

1. deploy the current app version to hosting
2. verify that `/mission-control` works publicly
3. attach `mc.xactiq.net` to the Mission Control route/project in hosting
4. verify Mission Control loads independently and can be linked from Miro

## Notes

- Memory Hub remains at `memory.xactiq.net`
- Mission Control should become `mc.xactiq.net`
- both should remain separate destinations even if they temporarily share a codebase

## Immediate verification

After deployment, test:
- `https://memory.xactiq.net`
- `https://memory.xactiq.net/mission-control`
- `https://mc.xactiq.net` once the custom domain is attached

## Next separation step later

If Mission Control grows, split it into its own app/repo and preserve `mc.xactiq.net` as the stable public URL.
