import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const platformStorePath = join(process.cwd(), '..', 'canonical-memory.example.json');
const miroExportPath = join(process.cwd(), '..', 'miro-export.json');

export function loadPlatformStore() {
  if (!existsSync(platformStorePath)) return null;
  return JSON.parse(readFileSync(platformStorePath, 'utf8'));
}

export function savePlatformStore(data) {
  mkdirSync(join(process.cwd(), '..'), { recursive: true });
  writeFileSync(platformStorePath, JSON.stringify(data, null, 2));
}

export function buildMiroExport(store) {
  const memories = (store?.memories || []).map((memory) => ({
    id: memory.memoryId,
    type: 'memory',
    title: memory.title,
    summary: memory.summary,
    tags: memory.tags || [],
    sourceCount: (memory.sourceRefs || []).length
  }));

  const entities = (store?.entities || []).map((entity) => ({
    id: entity.entityId,
    type: entity.type,
    title: entity.name,
    summary: entity.summary || ''
  }));

  const relationships = (store?.relationships || []).map((rel) => ({
    id: rel.relationshipId,
    from: rel.fromId,
    to: rel.toId,
    label: rel.relationshipType
  }));

  return {
    generatedAt: new Date().toISOString(),
    boardHint: 'Strategic Memory Map',
    nodes: [...memories, ...entities],
    edges: relationships
  };
}

export function saveMiroExport(data) {
  writeFileSync(miroExportPath, JSON.stringify(data, null, 2));
}

export function getPlatformPaths() {
  return { platformStorePath, miroExportPath };
}
