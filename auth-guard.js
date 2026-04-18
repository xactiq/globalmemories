const expected = window.MEMORY_GLOBE_PASSHASH;
const actual = localStorage.getItem('memory-globe-auth');
if (!expected || expected === '__SET_ME__') {
  console.warn('Memory Globe passphrase hash is not configured.');
} else if (actual !== expected) {
  const next = encodeURIComponent(window.location.pathname || '/');
  window.location.replace(`/login.html?next=${next}`);
}
