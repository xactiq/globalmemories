import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const workspace = root;
const memoryDir = join(workspace, 'memory');
const vaultDir = join(workspace, 'obsidian-vault');
const appDir = join(workspace, 'memory-globe-app');

const entityMap = new Map();
const sourceList = [];
const conversationMap = new Map();
const memories = [];
const relationships = [];

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function redactSecrets(text) {
  return text
    .replace(/\b\d{8,}:[A-Za-z0-9_-]{20,}\b/g, '[REDACTED_TOKEN]')
    .replace(/\bghp_[A-Za-z0-9]{20,}\b/g, '[REDACTED_GITHUB_TOKEN]')
    .replace(/\bMTQ[\w.-]{20,}\b/g, '[REDACTED_DISCORD_TOKEN]');
}

function ensureEntity(id, type, label, meta = {}, aliases = []) {
  if (!entityMap.has(id)) entityMap.set(id, { id, type, label, aliases, meta });
}

function addRelationship(source, target, kind, weight = 1) {
  relationships.push({ source, target, kind, weight });
}

function addSource(id, path, kind, platform = 'workspace') {
  sourceList.push({ id, path, kind, platform });
}

function ensureConversation(id, label, platform = 'workspace', participantIds = []) {
  if (!conversationMap.has(id)) conversationMap.set(id, { id, label, platform, participantIds });
}

ensureEntity('person:mac', 'person', 'Mac', {}, ['loganmac10']);
ensureEntity('assistant:loganopenclawbot', 'assistant', 'loganopenclawbot');
ensureEntity('topic:openclaw', 'topic', 'OpenClaw');
ensureEntity('topic:telegram', 'topic', 'Telegram');
ensureEntity('topic:discord', 'topic', 'Discord');
ensureEntity('topic:pairing', 'topic', 'Pairing');
ensureEntity('project:telegram-setup', 'project', 'Telegram setup');
ensureEntity('project:openclaw-identity-bootstrap', 'project', 'OpenClaw identity bootstrap');
ensureEntity('person:botfather', 'person', 'BotFather');

if (existsSync(memoryDir)) {
  for (const file of readdirSync(memoryDir).filter((f) => f.endsWith('.md')).sort()) {
    const path = join(memoryDir, file);
    const content = readFileSync(path, 'utf8');
    const sourceId = `source:${file}`;
    addSource(sourceId, `memory/${file}`, 'memory-file', 'workspace');

    const convoId = `conversation:${slug(file.replace(/\.md$/, ''))}`;
    ensureConversation(convoId, file.replace(/\.md$/, ''), 'workspace', ['person:mac', 'assistant:loganopenclawbot']);

    const safeContent = redactSecrets(content);
    const summaryLines = safeContent.split('\n').filter((line) => line.startsWith('assistant:') || line.startsWith('user:')).slice(0, 4);
    const summary = summaryLines.length ? summaryLines.join(' ').slice(0, 500) : 'Imported workspace memory.';
    const memoryId = `memory:${slug(file.replace(/\.md$/, ''))}`;

    const entityIds = ['person:mac', 'assistant:loganopenclawbot'];
    const topicIds = [];
    const lower = safeContent.toLowerCase();
    if (lower.includes('telegram')) {
      entityIds.push('project:telegram-setup');
      topicIds.push('topic:telegram');
      addRelationship(memoryId, 'project:telegram-setup', 'about');
    }
    if (lower.includes('openclaw')) {
      topicIds.push('topic:openclaw');
      addRelationship(memoryId, 'topic:openclaw', 'about');
    }
    if (lower.includes('pairing')) {
      topicIds.push('topic:pairing');
      addRelationship(memoryId, 'topic:pairing', 'about');
    }
    if (lower.includes('botfather')) {
      entityIds.push('person:botfather');
      addRelationship('person:botfather', memoryId, 'appears-in');
    }

    memories.push({
      id: memoryId,
      title: file.replace(/\.md$/, ''),
      sourceId,
      timestamp: file.slice(0, 10),
      platform: 'workspace',
      summary,
      excerpt: safeContent.slice(0, 1200),
      entityIds: [...new Set(entityIds)],
      topicIds: [...new Set(topicIds)],
      conversationId: convoId,
      rawPath: `memory/${file}`
    });

    addRelationship('assistant:loganopenclawbot', memoryId, 'remembers');
    addRelationship('person:mac', memoryId, 'participated-in');
  }
}

if (existsSync(vaultDir)) {
  const topDirs = ['people', 'projects', 'topics', 'timeline', 'decisions'];
  for (const dir of topDirs) {
    const full = join(vaultDir, dir);
    if (!existsSync(full)) continue;
    for (const file of readdirSync(full).filter((f) => f.endsWith('.md'))) {
      const sourceId = `vault:${dir}/${file}`;
      addSource(sourceId, `obsidian-vault/${dir}/${file}`, 'obsidian-note', 'obsidian');
    }
  }
}

const store = {
  entities: [...entityMap.values()],
  memories,
  relationships,
  sources: sourceList,
  conversations: [...conversationMap.values()]
};

writeFileSync(join(appDir, 'memory-store.json'), JSON.stringify(store, null, 2));

const graphNodes = [];
const graphLinks = [];
for (const entity of store.entities) {
  graphNodes.push({ id: entity.id, label: entity.label, group: entity.type });
}
for (const memory of store.memories) {
  graphNodes.push({ id: memory.id, label: memory.title, group: 'memory', file: memory.rawPath });
  for (const entityId of memory.entityIds || []) graphLinks.push({ source: entityId, target: memory.id, kind: 'mentioned-in' });
  for (const topicId of memory.topicIds || []) graphLinks.push({ source: memory.id, target: topicId, kind: 'about' });
}
for (const rel of store.relationships) graphLinks.push(rel);

writeFileSync(join(appDir, 'graph.json'), JSON.stringify({ nodes: graphNodes, links: graphLinks }, null, 2));
console.log(`Wrote memory-store.json with ${store.memories.length} memories and ${store.entities.length} entities.`);
