import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const memoryDir = join(root, 'memory');
const outDir = join(root, 'memory-globe-app', 'public');

mkdirSync(outDir, { recursive: true });

const files = readdirSync(memoryDir).filter((f) => f.endsWith('.md')).sort();
const nodes = [];
const links = [];
const topics = new Set();

const pushNode = (id, label, group, meta = {}) => {
  if (!nodes.find((n) => n.id === id)) nodes.push({ id, label, group, ...meta });
};

pushNode('assistant', 'loganopenclawbot', 'system');
pushNode('human', 'Mac', 'person');
links.push({ source: 'human', target: 'assistant', kind: 'uses' });

for (const file of files) {
  const content = readFileSync(join(memoryDir, file), 'utf8');
  const id = `memory:${file.replace(/\.md$/, '')}`;
  pushNode(id, file.replace(/\.md$/, ''), 'memory', { file });
  links.push({ source: 'assistant', target: id, kind: 'remembers' });

  const lower = content.toLowerCase();
  for (const topic of ['telegram', 'discord', 'openclaw', 'pairing', 'setup']) {
    if (lower.includes(topic)) {
      topics.add(topic);
      const topicId = `topic:${topic}`;
      pushNode(topicId, topic, 'topic');
      links.push({ source: id, target: topicId, kind: 'about' });
    }
  }
}

for (const topic of topics) {
  links.push({ source: 'human', target: `topic:${topic}`, kind: 'cares-about' });
}

writeFileSync(join(outDir, 'graph.json'), JSON.stringify({ nodes, links }, null, 2));
console.log(`Wrote ${nodes.length} nodes and ${links.length} links to public/graph.json`);
