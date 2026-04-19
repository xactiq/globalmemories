const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const details = document.getElementById('details');
const hubstats = document.getElementById('hubstats');
const connectorsEl = document.getElementById('connectors');
const sourcesEl = document.getElementById('sources');
const memoriesEl = document.getElementById('memories');
const settingsEl = document.getElementById('settings');
const topchips = document.getElementById('topchips');
const tabs = [...document.querySelectorAll('.tab')];
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const detailContent = document.getElementById('detailContent');
const memoryTitle = document.getElementById('memoryTitle');
const memorySummary = document.getElementById('memorySummary');
const memoryTags = document.getElementById('memoryTags');
const saveMemoryBtn = document.getElementById('saveMemoryBtn');
const memorySaveStatus = document.getElementById('memorySaveStatus');

let width = 0;
let height = 0;
let rotationY = 0.6;
let rotationX = -0.35;
let zoom = 1;
let dragging = false;
let lastX = 0;
let lastY = 0;
let graph = { nodes: [], links: [] };
let projected = [];
let hub = null;
let backendStatus = null;
let googleBackendStatus = null;

const BACKEND_BASE = 'http://localhost:8787';

const colors = {
  memory: '#7dd3fc',
  person: '#f9a8d4',
  assistant: '#fcd34d',
  topic: '#86efac',
  project: '#c4b5fd',
  system: '#fcd34d',
};

function resize() {
  width = canvas.width = window.innerWidth * devicePixelRatio;
  height = canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}

function distributeOnSphere(nodes) {
  return nodes.map((node, i) => {
    const phi = Math.acos(1 - 2 * ((i + 0.5) / nodes.length));
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    return {
      ...node,
      x: Math.cos(theta) * Math.sin(phi),
      y: Math.sin(theta) * Math.sin(phi),
      z: Math.cos(phi),
    };
  });
}

function rotate(point) {
  const cy = Math.cos(rotationY), sy = Math.sin(rotationY);
  const cx = Math.cos(rotationX), sx = Math.sin(rotationX);
  let x = point.x * cy - point.z * sy;
  let z = point.x * sy + point.z * cy;
  let y = point.y * cx - z * sx;
  z = point.y * sx + z * cx;
  return { x, y, z };
}

function project(point) {
  const distance = 3.2 / zoom;
  const scale = 260 / (distance - point.z);
  return {
    x: width / 2 + point.x * scale,
    y: height / 2 + point.y * scale,
    scale,
    depth: point.z,
  };
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  const radius = Math.min(width, height) * 0.22;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  const grd = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 1.4);
  grd.addColorStop(0, 'rgba(71, 122, 255, 0.14)');
  grd.addColorStop(1, 'rgba(71, 122, 255, 0.02)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  projected = graph.nodes.map((node) => {
    const rotated = rotate(node);
    const p = project(rotated);
    return { ...node, ...p, rotated };
  }).sort((a, b) => a.depth - b.depth);

  for (const link of graph.links) {
    const a = projected.find((n) => n.id === link.source);
    const b = projected.find((n) => n.id === link.target);
    if (!a || !b) continue;
    ctx.strokeStyle = 'rgba(191, 208, 238, 0.16)';
    ctx.lineWidth = 1 * devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  for (const node of projected) {
    const r = Math.max(4, 7 * (node.scale / 180));
    ctx.fillStyle = colors[node.group] || '#fff';
    ctx.globalAlpha = Math.max(0.35, 0.95 - ((node.depth + 1) / 4));
    ctx.beginPath();
    ctx.arc(node.x, node.y, r * devicePixelRatio, 0, Math.PI * 2);
    ctx.fill();
    if (node.depth > -0.1) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#dbeafe';
      ctx.font = `${12 * devicePixelRatio}px Inter, sans-serif`;
      ctx.fillText(node.label, node.x + 8 * devicePixelRatio, node.y - 8 * devicePixelRatio);
    }
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(draw);
}

function switchTab(name) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === name));
  ['connectors', 'sources', 'memories', 'search', 'add-memory', 'settings'].forEach((section) => {
    document.getElementById(`tab-${section}`).classList.toggle('hidden', section !== name);
  });
}

function setDetail(title, lines = [], links = []) {
  detailContent.innerHTML = `<h3>${title}</h3><p>${lines.join('</p><p>')}</p>${links.length ? `<div class="actions">${links.map((link) => `<a class="button" href="${link.href}" target="_blank" rel="noopener noreferrer">${link.label}</a>`).join('')}</div>` : ''}`;
}

function renderSearchResults(query) {
  if (!hub) return;
  const q = query.trim().toLowerCase();
  if (!q) {
    searchResults.innerHTML = '<div class="card"><strong>Search the memory graph</strong><div class="muted">Try names, projects, topics, docs, or files.</div></div>';
    return;
  }

  const results = [];
  for (const memory of hub.store.memories || []) {
    const blob = `${memory.title} ${memory.summary} ${memory.excerpt || ''}`.toLowerCase();
    if (blob.includes(q)) results.push({ type: 'memory', item: memory });
  }
  for (const source of hub.store.sources || []) {
    const blob = `${source.path} ${source.kind} ${source.platform}`.toLowerCase();
    if (blob.includes(q)) results.push({ type: 'source', item: source });
  }
  for (const entity of hub.store.entities || []) {
    const blob = `${entity.label} ${(entity.aliases || []).join(' ')}`.toLowerCase();
    if (blob.includes(q)) results.push({ type: 'entity', item: entity });
  }

  if (!results.length) {
    searchResults.innerHTML = '<div class="card"><strong>No results</strong><div class="muted">Try a broader term.</div></div>';
    return;
  }

  searchResults.innerHTML = results.slice(0, 12).map((result, index) => {
    const label = result.type === 'memory' ? result.item.title : result.type === 'source' ? result.item.path : result.item.label;
    const meta = result.type === 'memory' ? `${result.item.timestamp} • ${result.item.platform}` : result.type === 'source' ? `${result.item.kind} • ${result.item.platform}` : result.item.type;
    return `<button class="card search-result" data-result-index="${index}" style="text-align:left; cursor:pointer"><strong>${label}</strong><div class="muted">${meta}</div></button>`;
  }).join('');

  [...document.querySelectorAll('.search-result')].forEach((btn) => {
    btn.addEventListener('click', () => {
      const result = results[Number(btn.dataset.resultIndex)];
      if (!result) return;
      if (result.type === 'memory') {
        setDetail(result.item.title, [result.item.summary, result.item.excerpt || '', `Source: ${result.item.rawPath}`]);
      } else if (result.type === 'source') {
        setDetail(result.item.path, [`Kind: ${result.item.kind}`, `Platform: ${result.item.platform}`]);
      } else {
        setDetail(result.item.label, [`Type: ${result.item.type}`, `Aliases: ${(result.item.aliases || []).join(', ') || 'none'}`]);
      }
    });
  });
}

function renderSettings(connectors) {
  settingsEl.innerHTML = connectors.map((connector) => {
    const microsoft = backendStatus?.status?.connectors || {};
    const google = googleBackendStatus?.status?.connectors || {};
    const liveState = connector.id === 'outlook' ? microsoft.outlook
      : connector.id === 'onedrive' ? microsoft.onedrive
      : connector.id === 'google-gmail' ? google.gmail
      : connector.id === 'google-calendar' ? google.calendar
      : connector.id === 'google-drive' ? google.drive
      : null;
    const accountLabel = connector.type === 'google-workspace'
      ? (googleBackendStatus?.status?.accountLabel || 'No backend account')
      : (backendStatus?.status?.accountLabel || 'No backend account');
    const lastSyncAt = connector.type === 'google-workspace'
      ? (googleBackendStatus?.status?.lastSyncAt || 'No sync yet')
      : (backendStatus?.status?.lastSyncAt || 'No sync yet');
    const endpoint = connector.type === 'google-workspace'
      ? `${BACKEND_BASE}/api/connectors/google/status`
      : `${BACKEND_BASE}/api/connectors/microsoft/status`;
    const statusLine = liveState ? `${connector.status} • backend: ${liveState}` : `${connector.status} • ${connector.syncMode}`;
    const placeholder = connector.type === 'microsoft-graph' || connector.type === 'google-workspace'
      ? `Account: ${accountLabel}\nLast sync: ${lastSyncAt}\nBackend endpoint: ${endpoint}`
      : 'Local connector, no OAuth required.';
    return `<div class="setting"><label>${connector.label}</label><input value="${statusLine}" readonly /><textarea readonly>${connector.notes || ''}\n\n${placeholder}</textarea><div class="actions"><span class="button">${connector.enabled ? 'Enabled' : 'Disabled'}</span><span class="button">${connector.type}</span></div></div>`;
  }).join('');
}

function renderHub() {
  if (!hub) return;
  const active = hub.connectors.filter((c) => c.enabled).length;
  const planned = hub.connectors.filter((c) => c.status === 'planned').length;
  hubstats.textContent = `Hub: ${hub.counts.memories} memories, ${hub.counts.entities} entities, ${active} active connectors, ${planned} planned connectors.`;

  topchips.innerHTML = [
    `<span class="chip">${hub.counts.sources} sources</span>`,
    `<span class="chip">${hub.counts.conversations} conversations</span>`,
    `<span class="chip">${hub.counts.relationships} relationships</span>`
  ].join('');

  const googleSnapshot = hub.connectorSnapshots?.google;
  const microsoftSnapshot = hub.connectorSnapshots?.microsoft;
  connectorsEl.innerHTML = hub.connectors.map((connector) => {
    const tone = connector.status === 'active' ? 'ok' : connector.status === 'planned' ? 'planned' : 'warning';
    const action = connector.enabled ? 'Connected' : 'Planned';
    const snapshotText = connector.type === 'google-workspace' && googleSnapshot
      ? `Last sync: ${googleSnapshot.synced_at || 'n/a'} • Gmail ${googleSnapshot.summary?.gmailMessages ?? 0}, Calendar ${googleSnapshot.summary?.upcomingEvents ?? 0}, Drive ${googleSnapshot.summary?.driveItems ?? 0}`
      : connector.type === 'microsoft-graph' && microsoftSnapshot
        ? `Last sync: ${microsoftSnapshot.synced_at || 'n/a'} • Mail ${microsoftSnapshot.summary?.recentMessages ?? 0}, Calendar ${microsoftSnapshot.summary?.upcomingEvents ?? 0}, Drive ${microsoftSnapshot.summary?.driveItems ?? 0}`
        : connector.notes || '';
    return `<div class="card"><strong>${connector.label}</strong><div class="muted ${tone}">${connector.status} • ${connector.syncMode}</div><div class="muted">${snapshotText}</div><div class="actions"><span class="button">${action}</span><span class="button">${connector.type}</span></div></div>`;
  }).join('');

  const sourceCards = hub.store.sources.slice(0, 12).map((source) => {
    return `<div class="card"><strong>${source.path}</strong><div class="muted">${source.kind} • ${source.platform}</div><div class="actions"><span class="button">${source.id}</span></div></div>`;
  });
  if (googleSnapshot?.profile) {
    sourceCards.unshift(`<div class="card"><strong>Google Workspace</strong><div class="muted">oauth-sync • google</div><div class="muted">${googleSnapshot.profile.email || 'unknown account'} • ${googleSnapshot.synced_at || 'no sync time'}</div><div class="actions"><span class="button">gmail</span><span class="button">calendar</span><span class="button">drive</span></div></div>`);
  }
  sourcesEl.innerHTML = sourceCards.join('');

  const memoryCards = hub.store.memories.slice(0, 8).map((memory) => {
    return `<div class="card"><strong>${memory.title}</strong><div class="muted">${memory.timestamp} • ${memory.platform}</div><div class="muted">${memory.summary}</div><div class="actions"><span class="button">${memory.sourceId}</span></div></div>`;
  });
  if (googleSnapshot) {
    memoryCards.unshift(`<div class="card"><strong>Google Workspace Snapshot</strong><div class="muted">${googleSnapshot.synced_at || 'unknown'} • google</div><div class="muted">Profile: ${googleSnapshot.profile?.email || 'unknown'} • Gmail ${googleSnapshot.summary?.gmailMessages ?? 0} • Calendar ${googleSnapshot.summary?.upcomingEvents ?? 0} • Drive ${googleSnapshot.summary?.driveItems ?? 0}</div><div class="actions"><span class="button">google-sync</span></div></div>`);
  }
  memoriesEl.innerHTML = memoryCards.join('');

  renderSettings(hub.connectors);
}

async function loadBackendStatus() {
  try {
    const [microsoftRes, googleRes] = await Promise.all([
      fetch(`${BACKEND_BASE}/api/connectors/microsoft/status`).catch(() => null),
      fetch(`${BACKEND_BASE}/api/connectors/google/status`).catch(() => null)
    ]);

    if (microsoftRes?.ok) {
      backendStatus = await microsoftRes.json();
    } else {
      backendStatus = null;
    }

    if (googleRes?.ok) {
      googleBackendStatus = await googleRes.json();
    } else {
      googleBackendStatus = null;
    }

    if (hub) {
      renderHub();
    }
  } catch {
    backendStatus = null;
    googleBackendStatus = null;
    if (hub) renderHub();
  }
}

canvas.addEventListener('mousedown', (e) => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
});
window.addEventListener('mouseup', () => dragging = false);
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  rotationY += (e.clientX - lastX) * 0.005;
  rotationX += (e.clientY - lastY) * 0.005;
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom = Math.min(2.5, Math.max(0.7, zoom + e.deltaY * -0.001));
}, { passive: false });
canvas.addEventListener('click', (e) => {
  const x = e.clientX * devicePixelRatio;
  const y = e.clientY * devicePixelRatio;
  let hit = null;
  let best = Infinity;
  for (const node of projected) {
    const d = Math.hypot(node.x - x, node.y - y);
    if (d < 20 * devicePixelRatio && d < best) { best = d; hit = node; }
  }
  if (hit) {
    details.textContent = `${hit.label} (${hit.group})${hit.file ? ` • ${hit.file}` : ''}`;
    const memory = hub?.store?.memories?.find((m) => m.id === hit.id);
    const entity = hub?.store?.entities?.find((e) => e.id === hit.id);
    if (memory) {
      setDetail(memory.title, [memory.summary, memory.excerpt || '', `Source: ${memory.rawPath}`]);
    } else if (entity) {
      setDetail(entity.label, [`Type: ${entity.type}`, `Aliases: ${(entity.aliases || []).join(', ') || 'none'}`]);
    } else {
      setDetail(hit.label, [`Group: ${hit.group}`, hit.file ? `File: ${hit.file}` : '']);
    }
  }
});

tabs.forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
searchInput?.addEventListener('input', (e) => renderSearchResults(e.target.value));
saveMemoryBtn?.addEventListener('click', () => {
  const title = memoryTitle.value.trim();
  const summary = memorySummary.value.trim();
  const tags = memoryTags.value.trim();
  if (!title || !summary) {
    memorySaveStatus.textContent = 'Need at least a title and summary.';
    return;
  }
  const note = `Title: ${title}\nSummary: ${summary}\nTags: ${tags || 'none'}`;
  memorySaveStatus.textContent = `Memory draft captured. Next wiring step is persisting this automatically.\n\n${note}`;
  setDetail(title, [summary, `Tags: ${tags || 'none'}`, 'Persistence hook is the next build step.']);
});

window.addEventListener('resize', resize);
resize();
switchTab('connectors');

fetch('./graph.json')
  .then((r) => r.json())
  .then((data) => {
    graph = {
      nodes: distributeOnSphere(data.nodes),
      links: data.links,
    };
    details.textContent = `Loaded ${graph.nodes.length} nodes and ${graph.links.length} links.`;
  })
  .catch((err) => {
    details.textContent = `Could not load graph: ${err.message}`;
  });

fetch('./hub-data.json')
  .then((r) => r.json())
  .then((data) => {
    hub = data;
    renderHub();
    renderSearchResults('');
    loadBackendStatus();
  })
  .catch((err) => {
    hubstats.textContent = `Could not load hub summary: ${err.message}`;
  });

draw();
