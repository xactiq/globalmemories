# Memory Globe Deployment

## Recommended first deployment

Use a private subdomain on your existing domain, for example:

- `memory.yourdomain.com`
- `globe.yourdomain.com`

Keep DNS in Squarespace and host the app on Vercel.

## What this version is

This app is currently a static prototype. It is good for:

- private personal access across devices
- visualizing memory graph data
- iterating on the UI and data model

It is not yet a full authenticated backend app.

## Privacy options

### Best short-term option

Protect the deployment with Vercel access controls and the included lightweight front-door passphrase gate.

To enable the prototype gate, replace `__SET_ME__` in `public/config.js` with the SHA-256 hash of your chosen passphrase.

### Better long-term option

Add real authentication and private storage behind the app. The included passphrase gate is only a temporary layer for the prototype.

## Vercel steps

1. Create a new Vercel project from this app directory.
2. Set the project root to `memory-globe-app`.
3. Deploy the app.
4. In Vercel, add your custom domain or subdomain.
5. In Squarespace DNS, add the DNS records Vercel gives you.

## Squarespace DNS

Squarespace should remain the domain registrar/DNS manager. Point only the chosen subdomain to Vercel, not the whole site unless you explicitly want that.

## Build flow

Before deploys, regenerate the graph data:

```bash
node src/build-data.js
```

The deployed app will serve:

- `index.html`
- `src/main.js`
- `public/graph.json`

## Next recommended upgrade

Add login and private storage so the app becomes a real secure memory system instead of a static prototype.

## What I still need from you

I can help with the browser steps, but I still need you present for any login-required Vercel or Squarespace actions.

The minimum remaining user steps are:

1. log into Vercel
2. import or create the project from `memory-globe-app`
3. add `memory.xactiq.net` as the custom domain
4. log into Squarespace DNS and add the Vercel-provided record
