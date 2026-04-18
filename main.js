const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const details = document.getElementById('details');
const hubstats = document.getElementById('hubstats');
const connectorsEl = document.getElementById('connectors');
const memoriesEl = document.getElementById('memories');
const topchips = document.getElementById('topchips');

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

  connectorsEl.innerHTML = hub.connectors.map((connector) => {
    const tone = connector.status === 'active' ? 'ok' : connector.status === 'planned' ? 'planned' : 'warning';
    return `<div class="card"><strong>${connector.label}</strong><div class="muted ${tone}">${connector.status} • ${connector.syncMode}</div><div class="muted">${connector.notes || ''}</div></div>`;
  }).join('');

  memoriesEl.innerHTML = hub.store.memories.slice(0, 6).map((memory) => {
    return `<div class="card"><strong>${memory.title}</strong><div class="muted">${memory.timestamp} • ${memory.platform}</div><div class="muted">${memory.summary}</div></div>`;
  }).join('');
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
  if (hit) details.textContent = `${hit.label} (${hit.group})${hit.file ? ` • ${hit.file}` : ''}`;
});

window.addEventListener('resize', resize);
resize();

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
  })
  .catch((err) => {
    hubstats.textContent = `Could not load hub summary: ${err.message}`;
  });

draw();
