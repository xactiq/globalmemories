# Mission Control Deployment Plan

## Goal

Deploy Mission Control independently at:

- `https://mc.xactiq.net`

So it can operate as its own product surface and can be linked directly from Miro.

## Why this matters

Mission Control should not feel like a hidden page inside the Memory Hub app.
It should be a first-class destination with its own identity.

## Recommended deployment shape

### Option A: same repo, separate route/domain

Use the current `memory-globe-app` repo but deploy Mission Control as its own routed surface and attach the custom domain `mc.xactiq.net`.

Pros:
- fastest path
- reuses current codebase
- simplest immediate deployment story

Cons:
- still partially coupled in repo structure

### Option B: separate app later

Keep Mission Control in the current repo for now, then split it into its own repo/app if the product grows.

Pros:
- preserves momentum now
- allows cleaner separation later

Cons:
- not fully separate at the codebase level yet

## Recommendation

Use **Option A now**, with a clean path to Option B later.

## Immediate technical needs

1. ensure `mission-control.html` can be served cleanly as a standalone surface
2. ensure the page loads its JS assets correctly under the intended deployment path/domain
3. attach `mc.xactiq.net` in hosting
4. update Miro board links to point to the custom domain

## Hosting direction

If Memory Hub is already on Vercel and working well, the simplest path is likely:
- deploy Mission Control via the same hosting setup
- add `mc.xactiq.net` as another custom domain/route target

## Deployment checklist

- confirm Mission Control page is production-safe enough to expose
- verify routes and asset loading
- deploy route
- bind `mc.xactiq.net`
- verify public access
- link from Miro board

## Future separation goals

Later, Mission Control should likely gain:
- its own branding
- its own deployment config
- its own frontend structure
- deeper job/connector drill-down screens
- tighter integration with canonical APIs
