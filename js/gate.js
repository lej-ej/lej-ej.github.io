// Client-side password gate.
// NOT real security — anyone who views source can see this hash and
// try to brute-force it. Use only to hide content from casual visitors.
//
// To change the password:
//   1. Pick a new password.
//   2. Compute its SHA-256 hash:
//        echo -n "yourpassword" | shasum -a 256
//   3. Paste the hex string below.
//
// Default password: "changeme"
const PASSWORD_HASH = '057ba03d6c44104863dc7361fe4578965d1887360f90a0895882e58a6248fc86';

const STORAGE_KEY = 'lej-ej-unlocked';

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function unlock() {
  document.getElementById('gate').hidden = true;
  document.getElementById('content').hidden = false;
}

function lock() {
  sessionStorage.removeItem(STORAGE_KEY);
  document.getElementById('gate').hidden = false;
  document.getElementById('content').hidden = true;
  document.getElementById('pw').value = '';
}

if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
  unlock();
}

document.getElementById('gate-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('pw').value;
  const err = document.getElementById('gate-error');
  const hash = await sha256(input);
  if (hash === PASSWORD_HASH) {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    err.hidden = true;
    unlock();
  } else {
    err.hidden = false;
    document.getElementById('pw').value = '';
    document.getElementById('pw').focus();
  }
});

document.getElementById('lock-btn').addEventListener('click', lock);
