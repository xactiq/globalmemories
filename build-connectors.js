import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const appDir = new URL('./', import.meta.url).pathname;
const connectorsPath = join(appDir, 'connectors.json');
const storePath = join(appDir, 'memory-store.json');
const outputPath = join(appDir, 'hub-data.json');
const googleSyncPath = join(appDir, 'backend', '.google-sync.json');
const microsoftSyncPath = join(appDir, 'backend', '.microsoft-sync.json');

const connectors = JSON.parse(readFileSync(connectorsPath, 'utf8'));
const store = JSON.parse(readFileSync(storePath, 'utf8'));
const googleSync = existsSync(googleSyncPath) ? JSON.parse(readFileSync(googleSyncPath, 'utf8')) : null;
const microsoftSync = existsSync(microsoftSyncPath) ? JSON.parse(readFileSync(microsoftSyncPath, 'utf8')) : null;

const connectorSnapshots = {
  google: googleSync,
  microsoft: microsoftSync
};

const hub = {
  generatedAt: new Date().toISOString(),
  connectors: connectors.connectors,
  counts: {
    connectors: connectors.connectors.length,
    entities: store.entities.length,
    memories: store.memories.length,
    relationships: store.relationships.length,
    conversations: store.conversations.length,
    sources: store.sources.length,
  },
  connectorSnapshots,
  store
};

writeFileSync(outputPath, JSON.stringify(hub, null, 2));
console.log(`Wrote hub-data.json with ${hub.counts.connectors} connectors.`);
