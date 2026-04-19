const BACKEND_BASE = 'http://localhost:8787';

async function loadOverview() {
  const overviewEl = document.getElementById('overview');
  const jobsEl = document.getElementById('jobs');
  const auditEl = document.getElementById('audit');

  try {
    const res = await fetch(`${BACKEND_BASE}/api/mission-control/overview`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || 'Failed to load overview');

    overviewEl.innerHTML = [
      `<div class="card"><h3>Connectors</h3><div>${data.connectors.total}</div><div class="muted">Healthy: ${data.connectors.healthy}</div></div>`,
      `<div class="card"><h3>Jobs</h3><div>${data.jobs.total}</div><div class="muted">Running: ${data.jobs.running} • Failed: ${data.jobs.failed}</div></div>`,
      `<div class="card"><h3>Audit Events</h3><div>${data.audit.total}</div><div class="muted">Governance visibility layer</div></div>`
    ].join('');

    jobsEl.innerHTML = (data.jobs.jobs || []).length
      ? data.jobs.jobs.map((job) => `<div class="card"><strong>${job.jobType || job.syncJobId}</strong><div class="muted">${job.status} • ${job.startedAt}</div></div>`).join('')
      : '<div class="card"><strong>No jobs yet</strong><div class="muted">Sync and workflow jobs will appear here.</div></div>';

    auditEl.innerHTML = (data.audit.events || []).length
      ? data.audit.events.map((event) => `<div class="card"><strong>${event.action}</strong><div class="muted">${event.targetType} • ${event.targetId}</div></div>`).join('')
      : '<div class="card"><strong>No audit events yet</strong><div class="muted">Audit trail records will appear here.</div></div>';
  } catch (err) {
    overviewEl.innerHTML = `<div class="card"><strong>Load failed</strong><div class="muted">${err.message}</div></div>`;
    jobsEl.innerHTML = '';
    auditEl.innerHTML = '';
  }
}

loadOverview();
