const REFRESH_MS = 15000;

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toLocaleString()} (${relativeTime(date)})`;
}

function relativeTime(date) {
  const diffMs = date.getTime() - Date.now();
  const mins = Math.round(diffMs / 60000);
  if (Math.abs(mins) < 1) return 'just now';
  if (Math.abs(mins) < 60) return mins > 0 ? `in ${mins}m` : `${Math.abs(mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return hours > 0 ? `in ${hours}h` : `${Math.abs(hours)}h ago`;
  const days = Math.round(hours / 24);
  return days > 0 ? `in ${days}d` : `${Math.abs(days)}d ago`;
}

function healthClass(level) {
  if (['healthy', 'active', 'connected', 'good'].includes(level)) return 'good';
  if (['warn', 'warning', 'degraded', 'partial', 'experimental', 'ready-for-auth'].includes(level)) return 'warn';
  if (['error', 'failed', 'offline', 'disconnected', 'unavailable'].includes(level)) return 'bad';
  return 'info';
}

function connectorStatus(connector) {
  return connector.health || connector.status || 'unknown';
}

function metricCard(title, value, detail) {
  return `
    <div class="card">
      <div class="muted">${title}</div>
      <div class="metric">${value}</div>
      <div class="muted">${detail}</div>
    </div>
  `;
}

function empty(message) {
  return `<div class="empty">${message}</div>`;
}

function buildApiUrl() {
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (isLocalHost) return 'http://localhost:8787/api/mission-control/snapshot';
  return `${window.location.origin}/api/mission-control/snapshot`;
}

function buildStaticSnapshot(canonical, hubData) {
  const memories = canonical?.memories || [];
  const sources = canonical?.sources || [];
  const relationships = canonical?.relationships || [];
  const entities = canonical?.entities || [];
  const syncJobs = canonical?.syncJobs || [];
  const auditEvents = canonical?.auditEvents || [];
  const connectors = (canonical?.connectors?.length ? canonical.connectors : (hubData?.connectors || []).map((connector) => ({
    connectorId: connector.id,
    label: connector.label,
    provider: connector.type,
    status: connector.status,
    health: connector.enabled ? 'healthy' : connector.status || 'unknown',
    notes: connector.notes,
    syncMode: connector.syncMode
  })));

  return {
    generatedAt: new Date().toISOString(),
    runtime: {
      serverStartedAt: null,
      port: null,
      host: window.location.host,
      workspaceRoot: 'public-static-build',
      appRoot: window.location.origin
    },
    canonical: {
      counts: {
        workspaces: (canonical?.workspaces || []).length,
        sources: sources.length,
        memories: memories.length,
        entities: entities.length,
        relationships: relationships.length,
        connectors: connectors.length,
        syncJobs: syncJobs.length,
        auditEvents: auditEvents.length
      },
      files: {},
      recentMemories: memories.slice(0, 8).map((memory) => ({
        memoryId: memory.memoryId,
        title: memory.title,
        summary: memory.summary,
        memoryType: memory.memoryType,
        importance: memory.importance,
        updatedAt: memory.updatedAt || memory.createdAt || null,
        tags: memory.tags || [],
        sourceCount: (memory.sourceRefs || []).length
      })),
      recentSources: sources.slice(0, 8),
      recentFiles: []
    },
    connectors: {
      total: connectors.length,
      healthy: connectors.filter((c) => ['healthy', 'active'].includes(c.health || c.status)).length,
      degraded: connectors.filter((c) => ['degraded', 'partial', 'experimental', 'planned', 'ready-for-auth'].includes(c.health || c.status)).length,
      offline: connectors.filter((c) => ['offline', 'failed', 'disconnected'].includes(c.health || c.status)).length,
      items: connectors,
      google: null,
      microsoft: null
    },
    jobs: {
      total: syncJobs.length,
      running: syncJobs.filter((job) => job.status === 'running').length,
      failed: syncJobs.filter((job) => job.status === 'failed').length,
      recent: syncJobs.slice(0, 10)
    },
    audit: {
      total: auditEvents.length,
      recent: auditEvents.slice(0, 10)
    },
    hub: {
      generatedAt: hubData?.generatedAt || null,
      counts: hubData?.counts || null
    },
    alerts: [{
      level: 'info',
      message: 'Showing static hosted snapshot. Attach a live backend to surface real-time local machine state.'
    }]
  };
}

async function loadSnapshot() {
  try {
    const response = await fetch(buildApiUrl(), { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || 'Failed to load Mission Control snapshot.');
    return { snapshot: data.snapshot, mode: 'live' };
  } catch (error) {
    const [canonicalRes, hubRes] = await Promise.all([
      fetch('./canonical-memory.example.json', { cache: 'no-store' }),
      fetch('./hub-data.json', { cache: 'no-store' })
    ]);
    if (!canonicalRes.ok) throw error;
    const canonical = await canonicalRes.json();
    const hubData = hubRes.ok ? await hubRes.json() : null;
    return { snapshot: buildStaticSnapshot(canonical, hubData), mode: 'static' };
  }
}

function render(snapshot) {
  const summaryGrid = document.getElementById('summaryGrid');
  const alertsList = document.getElementById('alertsList');
  const runtimeKvs = document.getElementById('runtimeKvs');
  const connectorsList = document.getElementById('connectorsList');
  const storeList = document.getElementById('storeList');
  const memoriesList = document.getElementById('memoriesList');
  const jobsList = document.getElementById('jobsList');
  const auditList = document.getElementById('auditList');
  const lastUpdatedBadge = document.getElementById('lastUpdatedBadge');

  summaryGrid.innerHTML = [
    metricCard('Canonical memories', snapshot.canonical.counts.memories, `${snapshot.canonical.counts.sources} sources • ${snapshot.canonical.counts.relationships} relationships`),
    metricCard('Connectors', snapshot.connectors.total, `${snapshot.connectors.healthy} healthy • ${snapshot.connectors.degraded} degraded • ${snapshot.connectors.offline} offline`),
    metricCard('Jobs', snapshot.jobs.total, `${snapshot.jobs.running} running • ${snapshot.jobs.failed} failed`),
    metricCard('Audit events', snapshot.audit.total, 'Visibility and governance trail')
  ].join('');

  alertsList.innerHTML = snapshot.alerts.length
    ? snapshot.alerts.map((alert) => `
        <div class="item">
          <strong class="${healthClass(alert.level)}">${String(alert.level).toUpperCase()}</strong>
          <div>${alert.message}</div>
        </div>
      `).join('')
    : empty('No active alerts. That’s the goal.');

  runtimeKvs.innerHTML = [
    ['Generated', formatDate(snapshot.generatedAt)],
    ['Backend started', formatDate(snapshot.runtime.serverStartedAt)],
    ['Host', snapshot.runtime.host || '—'],
    ['Port', snapshot.runtime.port || '—'],
    ['Workspace root', `<code>${snapshot.runtime.workspaceRoot}</code>`],
    ['App root', `<code>${snapshot.runtime.appRoot}</code>`]
  ].map(([label, value]) => `<div class="muted">${label}</div><div>${value}</div>`).join('');

  connectorsList.innerHTML = snapshot.connectors.items.length
    ? snapshot.connectors.items.map((connector) => {
        const status = connectorStatus(connector);
        const cls = healthClass(status);
        const liveBits = connector.liveStatus
          ? Object.entries(connector.liveStatus).map(([key, value]) => `${key}: ${value}`).join(' • ')
          : connector.notes || connector.accountLabel || 'No live detail';
        return `
          <div class="item">
            <div class="metric-row">
              <strong>${connector.label || connector.connectorId || connector.provider}</strong>
              <span class="pill"><span class="health-dot health-${cls}"></span>${status}</span>
            </div>
            <div class="muted">${liveBits}</div>
            <div class="muted">Last sync: ${formatDate(connector.lastSyncAt)}</div>
          </div>
        `;
      }).join('')
    : empty('No connectors are registered yet.');

  const fileCards = Object.entries(snapshot.canonical.files)
    .filter(([, meta]) => meta)
    .map(([key, meta]) => `
      <div class="item">
        <strong>${key}</strong>
        <div class="muted">Updated: ${formatDate(meta.updatedAt)}</div>
        <div class="muted">Size: ${meta.size ?? '—'} bytes</div>
      </div>
    `);
  const countCards = Object.entries(snapshot.canonical.counts)
    .map(([key, value]) => `
      <div class="item">
        <strong>${key}</strong>
        <div class="muted">${value}</div>
      </div>
    `);
  storeList.innerHTML = [...countCards, ...fileCards].join('') || empty('Canonical store data is unavailable.');

  memoriesList.innerHTML = snapshot.canonical.recentMemories.length
    ? snapshot.canonical.recentMemories.map((memory) => `
        <div class="item">
          <strong>${memory.title}</strong>
          <div>${memory.summary || ''}</div>
          <div class="muted">${memory.memoryType || 'memory'} • ${formatDate(memory.updatedAt)}</div>
        </div>
      `).join('')
    : empty('No canonical memories yet.');

  jobsList.innerHTML = snapshot.jobs.recent.length
    ? snapshot.jobs.recent.map((job) => `
        <div class="item">
          <strong>${job.jobType || job.syncJobId}</strong>
          <div class="muted">${job.status || 'unknown'} • ${formatDate(job.startedAt || job.finishedAt)}</div>
        </div>
      `).join('')
    : empty('No jobs have been recorded yet.');

  auditList.innerHTML = snapshot.audit.recent.length
    ? snapshot.audit.recent.map((event) => `
        <div class="item">
          <strong>${event.action}</strong>
          <div class="muted">${event.targetType || 'target'} • ${event.targetId || '—'}</div>
          <div class="muted">${formatDate(event.createdAt)}</div>
        </div>
      `).join('')
    : empty('No audit events yet.');

  lastUpdatedBadge.textContent = `Last refresh: ${formatDate(snapshot.generatedAt)}`;
}

function renderFailure(error) {
  const statusBadge = document.getElementById('statusBadge');
  const lastUpdatedBadge = document.getElementById('lastUpdatedBadge');
  const alertsList = document.getElementById('alertsList');
  const summaryGrid = document.getElementById('summaryGrid');
  statusBadge.innerHTML = '<span class="bad">Backend unreachable</span>';
  lastUpdatedBadge.textContent = 'Mission Control is not receiving live data';
  summaryGrid.innerHTML = metricCard('Status', 'Offline', 'The dashboard shell loaded, but the backend API did not respond.');
  alertsList.innerHTML = `
    <div class="item">
      <strong class="bad">BACKEND DISCONNECTED</strong>
      <div>${error.message}</div>
      <div class="muted">If this page is on mc.xactiq.net, it still needs a live backend attached before it can show local machine state.</div>
    </div>
  `;
  ['runtimeKvs','connectorsList','storeList','memoriesList','jobsList','auditList'].forEach((id) => {
    document.getElementById(id).innerHTML = '';
  });
}

async function refresh() {
  const statusBadge = document.getElementById('statusBadge');
  statusBadge.innerHTML = '<span class="info">Refreshing…</span>';
  try {
    const { snapshot, mode } = await loadSnapshot();
    render(snapshot);
    statusBadge.innerHTML = mode === 'live'
      ? '<span class="good">Live feed connected</span>'
      : '<span class="warn">Static hosted snapshot</span>';
  } catch (error) {
    renderFailure(error);
  }
}

document.getElementById('refreshButton').addEventListener('click', () => refresh());
refresh();
setInterval(refresh, REFRESH_MS);
