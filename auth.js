const params = new URLSearchParams(window.location.search);
const next = params.get('next') || '/';
const error = document.getElementById('error');
const input = document.getElementById('passphrase');
const submit = document.getElementById('submit');

async function digest(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function attempt() {
  const value = input.value.trim();
  if (!value) {
    error.textContent = 'Enter your passphrase.';
    return;
  }
  const hash = await digest(value);
  const expected = window.MEMORY_GLOBE_PASSHASH;
  if (hash !== expected) {
    error.textContent = 'Wrong passphrase.';
    return;
  }
  localStorage.setItem('memory-globe-auth', hash);
  window.location.href = next;
}

submit.addEventListener('click', attempt);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') attempt();
});
