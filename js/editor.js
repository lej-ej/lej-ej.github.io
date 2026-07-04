// Draft editor for the private area.
//
// Drafts are stored in this browser's localStorage under the key
// `lej-ej-drafts`. Every draft has:
//   { id, title, body, updated (ISO date), created (ISO date) }
//
// Autosaves on every keystroke, debounced 500ms.
// Export .md downloads a Markdown copy.
// Export .html downloads a ready-to-drop-in blog post file.
//
// Nothing here syncs across devices. This is intentional — the whole
// site is static, hosted on GitHub Pages, with no server.

(function () {
  const STORAGE_KEY = 'lej-ej-drafts';
  const SAVE_DEBOUNCE_MS = 500;

  // ── DOM refs ──────────────────────────────────────────
  const el = {
    select:        document.getElementById('draft-select'),
    title:         document.getElementById('draft-title'),
    body:          document.getElementById('draft-body'),
    newBtn:        document.getElementById('new-draft'),
    delBtn:        document.getElementById('delete-draft'),
    exportMdBtn:   document.getElementById('export-md'),
    exportHtmlBtn: document.getElementById('export-html'),
    status:        document.getElementById('save-status'),
  };

  // If we're not on the private page, bail out silently.
  if (!el.select || !el.title || !el.body) return;

  // ── State ─────────────────────────────────────────────
  const state = {
    drafts: {},
    currentId: null,
    saveTimer: null,
    statusTimer: null,
  };

  // ── Storage ───────────────────────────────────────────
  function loadStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state.drafts = raw ? JSON.parse(raw) : {};
    } catch (e) {
      state.drafts = {};
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.drafts));
  }

  // ── Draft ops ─────────────────────────────────────────
  function currentDraft() {
    return state.drafts[state.currentId] || null;
  }

  function newId() {
    return 'd_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function newDraft(focusTitle) {
    const id = newId();
    const now = new Date().toISOString();
    state.drafts[id] = { id, title: '', body: '', updated: now, created: now };
    state.currentId = id;
    persist();
    render();
    if (focusTitle) el.title.focus();
  }

  function selectDraft(id) {
    if (!state.drafts[id]) return;
    clearTimeout(state.saveTimer);
    state.currentId = id;
    render();
  }

  function deleteCurrent() {
    if (!state.currentId) return;
    const d = currentDraft();
    const label = d && d.title ? `“${d.title}”` : 'this draft';
    if (!window.confirm(`Delete ${label}? This can't be undone.`)) return;
    clearTimeout(state.saveTimer);
    delete state.drafts[state.currentId];
    persist();
    const remaining = sortedIds();
    if (remaining.length) {
      state.currentId = remaining[0];
      render();
    } else {
      newDraft(false);
    }
  }

  function commitEdit(patch) {
    const d = currentDraft();
    if (!d) return;
    Object.assign(d, patch);
    d.updated = new Date().toISOString();
    persist();
    renderList();
    setSaveStatus('saved just now');
    scheduleStatusRefresh();
  }

  function scheduleEdit(patch) {
    clearTimeout(state.saveTimer);
    setSaveStatus('typing…');
    state.saveTimer = setTimeout(() => commitEdit(patch), SAVE_DEBOUNCE_MS);
  }

  // ── Helpers ───────────────────────────────────────────
  function sortedIds() {
    return Object.keys(state.drafts).sort((a, b) =>
      (state.drafts[b].updated || '').localeCompare(state.drafts[a].updated || '')
    );
  }

  function shortDate(iso) {
    if (!iso) return '';
    return new Date(iso).toISOString().slice(0, 10);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function slugify(s) {
    return (
      String(s || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60) || 'untitled'
    );
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────
  function renderList() {
    const ids = sortedIds();
    const opts = ids.map((id) => {
      const d = state.drafts[id];
      const title = d.title.trim() || 'untitled';
      const label = `${title} — ${shortDate(d.updated)}`;
      const selected = id === state.currentId ? ' selected' : '';
      return `<option value="${escapeHtml(id)}"${selected}>${escapeHtml(label)}</option>`;
    });
    el.select.innerHTML = opts.join('');
  }

  function renderEditor() {
    const d = currentDraft();
    if (!d) return;
    // Only update if the value differs — preserves cursor position.
    if (el.title.value !== d.title) el.title.value = d.title;
    if (el.body.value !== d.body)   el.body.value = d.body;
    setSaveStatus(savedAgoText(d));
  }

  function render() {
    renderList();
    renderEditor();
  }

  function savedAgoText(d) {
    if (!d || !d.updated) return '—';
    const diffMs = Date.now() - new Date(d.updated).getTime();
    const s = Math.floor(diffMs / 1000);
    if (s < 5)     return 'saved just now';
    if (s < 60)   return `saved ${s}s ago`;
    if (s < 3600) return `saved ${Math.floor(s / 60)}m ago`;
    return `saved ${Math.floor(s / 3600)}h ago`;
  }

  function setSaveStatus(text) {
    el.status.textContent = text;
  }

  function scheduleStatusRefresh() {
    clearTimeout(state.statusTimer);
    state.statusTimer = setTimeout(function tick() {
      const d = currentDraft();
      if (d) setSaveStatus(savedAgoText(d));
      state.statusTimer = setTimeout(tick, 10000);
    }, 10000);
  }

  // ── Export ────────────────────────────────────────────
  function exportMarkdown() {
    const d = currentDraft();
    if (!d) return;
    const title = d.title.trim() || 'untitled';
    const md = `# ${title}\n\n${d.body}\n`;
    download(slugify(title) + '.md', md, 'text/markdown;charset=utf-8');
  }

  function exportHtml() {
    const d = currentDraft();
    if (!d) return;
    const title = (d.title.trim() || 'untitled');
    const date = shortDate(d.updated);
    const paragraphs = d.body
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => '      <p>' + escapeHtml(p).replace(/\n/g, '<br/>\n        ') + '</p>')
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — notes</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400;1,9..144,700&family=Lekton:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/style.css" />
</head>
<body>
  <header class="site-header">
    <a href="../index.html" class="logo">notes</a>
    <nav>
      <a href="../index.html">home</a>
      <a href="../blog.html" class="active">writing</a>
      <a href="../private.html">private</a>
    </nav>
  </header>

  <main class="container post">
    <p class="back"><a href="../blog.html">&larr; all writing</a></p>
    <article>
      <header class="post-header">
        <h1>${escapeHtml(title)}</h1>
        <p class="post-meta">${date}</p>
      </header>
${paragraphs}
    </article>
  </main>

  <footer class="site-footer">
    <p>&copy; <span id="year"></span></p>
  </footer>

  <script src="../js/main.js"></script>
</body>
</html>
`;
    download(slugify(title) + '.html', html, 'text/html;charset=utf-8');
  }

  // ── Wire up ──────────────────────────────────────────
  el.title.addEventListener('input', () => scheduleEdit({ title: el.title.value }));
  el.body.addEventListener('input',  () => scheduleEdit({ body: el.body.value }));
  el.select.addEventListener('change', () => selectDraft(el.select.value));
  el.newBtn.addEventListener('click', () => newDraft(true));
  el.delBtn.addEventListener('click', deleteCurrent);
  el.exportMdBtn.addEventListener('click', exportMarkdown);
  el.exportHtmlBtn.addEventListener('click', exportHtml);

  // Save any pending edit before the page unloads.
  window.addEventListener('beforeunload', () => {
    if (state.saveTimer) {
      clearTimeout(state.saveTimer);
      commitEdit({ title: el.title.value, body: el.body.value });
    }
  });

  // ── Boot ─────────────────────────────────────────────
  loadStorage();
  const ids = sortedIds();
  if (ids.length) {
    state.currentId = ids[0];
    render();
    scheduleStatusRefresh();
  } else {
    newDraft(false);
    scheduleStatusRefresh();
  }
})();
