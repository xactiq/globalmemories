import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const appDir = new URL('./', import.meta.url).pathname;
const canonicalPath = join(appDir, 'canonical-memory.example.json');
const outputPath = join(appDir, 'miro-export.json');

const store = JSON.parse(readFileSync(canonicalPath, 'utf8'));

const exportPayload = {
  generatedAt: new Date().toISOString(),
  boardHint: 'Strategic Memory Map',
  nodes: [
    ...(store.memories || []).map((memory) => ({
      id: memory.memoryId,
      type: 'memory',
      title: memory.title,
      summary: memory.summary,
      tags: memory.tags || []
    })),
    ...(store.entities || []).map((entity) => ({
      id: entity.entityId,
      type: entity.type,
      title: entity.name,
      summary: entity.summary || ''
    }))
  ],
  edges: (store.relationships || []).map((rel) => ({
    id: rel.relationshipId,
    from: rel.fromId,
    to: rel.toId,
    label: rel.relationshipType
  }))
};

writeFileSync(outputPath, JSON.stringify(exportPayload, null, 2));
console.log(`Wrote miro-export.json with ${exportPayload.nodes.length} nodes.`);
