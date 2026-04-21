# mc.xactiq.net Domain Hookup Checklist

## Goal

Point `mc.xactiq.net` at the live Mission Control surface.

Current live route:
- `https://memory.xactiq.net/mission-control`

Target route:
- `https://mc.xactiq.net`

## Step 1: Add the domain in hosting

In Vercel (or the current hosting provider for the app):
- open the project for `memory-globe-app`
- go to **Settings -> Domains**
- add: `mc.xactiq.net`

## Step 2: Point DNS

In Squarespace DNS for `xactiq.net`:
- create the DNS record Vercel asks for when adding `mc.xactiq.net`
- this is often a CNAME for the subdomain, but use exactly what hosting tells you

## Step 3: Verify domain status

In hosting, wait until:
- domain shows as valid / configured
- certificate provisioning finishes

## Step 4: Confirm the live URL

Test:
- `https://mc.xactiq.net`
- `https://memory.xactiq.net/mission-control`

## Step 5: Use it in Miro

Once live, use these as the two primary product destinations:
- `https://memory.xactiq.net`
- `https://mc.xactiq.net`

## Important note

Mission Control currently shares the same codebase/project as Memory Hub, but it now has a clean routed surface.
That is fine for now. Later it can be split into a separate app while keeping the same public domain.
