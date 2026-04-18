import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const appDir = new URL('./', import.meta.url).pathname;
const connectorsPath = join(appDir, 'connectors.json');
const storePath = join(appDir, 'memory-store.json');
const outputPath = join(appDir, 'hub-data.json');

const connectors = JSON.parse(readFileSync(connectorsPath, 'utf8'));
const store = JSON.parse(readFileSync(storePath, 'utf8'));

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
  store
};

writeFileSync(outputPath, JSON.stringify(hub, null, 2));
console.log(`Wrote hub-data.json with ${hub.counts.connectors} connectors.`);
