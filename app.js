/* global CodeMirror, markdownit */

/* ============================================================
   Markdown Editor — Web edition
   Same feature set as the Electron version, but file I/O uses
   the File System Access API (Chrome/Edge). Falls back to
   upload / download in other browsers.
   ============================================================ */

const APP_VERSION = '0.5.0';
const HAS_FSA = typeof window.showOpenFilePicker === 'function';

const md = markdownit({ html: false, linkify: true, typographer: true, breaks: false });

const DEFAULT_DOC = `# Help

This is the **web edition** of the markdown editor. Same clean interface as the desktop app, running in your browser.

## Inline formatting

- **Bold** with \`**text**\`
- *Italic* with \`*text*\` or \`_text_\`
- ~~Strikethrough~~ with \`~~text~~\`
- \`inline code\` with backticks
- [Links](https://example.com) with \`[text](url)\`
- Images with \`![alt](url "optional title")\`

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Lists

- Bullet item
  - Nested bullet
1. Numbered
2. Second
- [ ] Task to do
- [x] Task done

## Quote and code

> Quotes look like this — italic body, accent-colored \`>\`.

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Horizontal rule

Put \`---\` or \`***\` on its own line:

---

## Shortcuts

| Action                | Shortcut         |
| --------------------- | ---------------- |
| New tab               | \`Alt+N\`          |
| Open file             | \`Ctrl+O\`         |
| Save / Save As        | \`Ctrl+S\` / \`Ctrl+Shift+S\` |
| Close tab             | \`Alt+W\`          |
| Vertical tabs         | \`Ctrl+B\`         |
| Editor / Split / Preview | \`Ctrl+1\` / \`2\` / \`3\` |
| Dark mode             | \`Ctrl+D\`         |

Export via the menu (**≡ → Export as HTML / PDF**).

> Uses the File System Access API for real save-to-same-file. Works best in **Chrome** or **Edge**.
`;

/* ---------- State ---------- */
let nextId = 1;
const tabs = []; // { id, handle, fileName, doc, dirty, scrollPos, lastSavedDoc }
let activeTabId = null;

/* ---------- DOM refs ---------- */
const tabsEl = document.getElementById('tabs');
const editorEl = document.getElementById('editor');
const previewEl = document.getElementById('preview');
const statusFileEl = document.getElementById('status-file');
const statusStatsEl = document.getElementById('status-stats');
const workspace = document.getElementById('workspace');
const splitter = document.getElementById('splitter');
const menuBtn = document.getElementById('menu-btn');
const menuEl = document.getElementById('app-menu');
const recentMenuEl = document.getElementById('recent-menu');
const vtabsListEl = document.getElementById('vtabs-list');
const toggleVtabsLabel = document.getElementById('toggle-vtabs-label');
const toggleHelpLabel = document.getElementById('toggle-help-label');

/* ---------- Editor ---------- */
const editor = CodeMirror.fromTextArea(editorEl, {
  mode: 'gfm', theme: 'default', lineWrapping: true, lineNumbers: false,
  autofocus: true, indentUnit: 2, tabSize: 2,
  extraKeys: {
    'Enter': 'newlineAndIndentContinueMarkdownList',
    'Tab': (cm) => cm.replaceSelection('  ', 'end')
  }
});

editor.on('change', () => {
  const tab = getActive();
  if (!tab) return;
  tab.doc = editor.getValue();
  const wasDirty = tab.dirty;
  tab.dirty = tab.doc !== (tab.lastSavedDoc ?? '');
  if (wasDirty !== tab.dirty) renderTabs();
  schedulePreview();
  updateStats();
});

editor.on('scroll', () => {
  const tab = getActive();
  if (tab) tab.scrollPos = editor.getScrollInfo();
});

let previewTimer = null;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 80);
}
function renderPreview() {
  const tab = getActive();
  previewEl.innerHTML = tab ? md.render(tab.doc || '') : '';
  previewEl.querySelectorAll('a').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
}
function updateStats() {
  const tab = getActive();
  if (!tab) { statusStatsEl.textContent = ''; return; }
  const text = tab.doc || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  statusStatsEl.textContent = `${words} words · ${text.length} chars · ${text.split('\n').length} lines`;
  statusFileEl.textContent = tab.fileName + (tab.handle ? '' : ' (unsaved)');
  document.title = `Markdown Editor ${APP_VERSION}`;
}

/* ---------- Tabs ---------- */
function getActive() { return tabs.find(t => t.id === activeTabId) || null; }

function newTab({ handle = null, content = '', fileName = null, savedContent = null, isHelp = false } = {}) {
  const tab = {
    id: nextId++,
    handle,
    fileName: fileName || (handle ? handle.name : 'Untitled'),
    doc: content,
    // Treat the initial content as "already saved" for tabs that have a backing
    // file OR are the built-in Help doc — prevents the dirty flag flipping on
    // the initial setValue() when the tab becomes active.
    lastSavedDoc: savedContent ?? ((handle || isHelp) ? content : null),
    dirty: false,
    scrollPos: null,
    isHelp
  };
  tabs.push(tab);
  setActiveTab(tab.id);
  renderTabs();
  return tab;
}

function setActiveTab(id) {
  const incoming = tabs.find(t => t.id === id);
  if (!incoming) return;
  const current = getActive();
  if (current) {
    current.doc = editor.getValue();
    current.scrollPos = editor.getScrollInfo();
  }
  activeTabId = id;
  editor.setValue(incoming.doc || '');
  // Help tabs are read-only reference material; nocursor hides the caret entirely
  // so it reads as prose rather than "editor with content".
  editor.setOption('readOnly', incoming.isHelp ? 'nocursor' : false);
  requestAnimationFrame(() => {
    if (incoming.scrollPos) editor.scrollTo(incoming.scrollPos.left, incoming.scrollPos.top);
    editor.refresh();
    editor.focus();
  });
  renderTabs();
  renderPreview();
  updateStats();
}

async function closeTab(id) {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;
  if (tab.dirty) {
    const choice = await showConfirm({
      title: 'Unsaved changes',
      message: `Do you want to save changes to ${tab.fileName}?`,
      detail: "Your changes will be lost if you don't save them.",
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultIndex: 0, cancelIndex: 2
    });
    if (choice === 2) return;
    if (choice === 0) { if (!(await saveTab(tab))) return; }
  }
  const idx = tabs.indexOf(tab);
  tabs.splice(idx, 1);
  if (tabs.length === 0) { newTab(); return; }
  if (activeTabId === id) setActiveTab(tabs[Math.max(0, idx - 1)].id);
  else renderTabs();
}

function renderTabs() {
  renderTabsInto(tabsEl, 'tab');
  renderTabsInto(vtabsListEl, 'vtab');
  refreshHelpMenuLabel();
}

function renderTabsInto(container, prefix) {
  container.innerHTML = '';
  for (const tab of tabs) {
    const el = document.createElement('div');
    el.className = prefix + (tab.id === activeTabId ? ' active' : '') + (tab.dirty ? ' dirty' : '');
    el.setAttribute('role', 'tab');
    el.title = tab.fileName;

    const title = document.createElement('span');
    title.className = `${prefix}-title`;
    title.textContent = tab.fileName;
    el.appendChild(title);

    const close = document.createElement('button');
    close.className = `${prefix}-close`;
    close.innerHTML = '&times;';
    close.title = 'Close';
    close.addEventListener('click', (e) => { e.stopPropagation(); closeTab(tab.id); });
    el.appendChild(close);

    el.addEventListener('click', () => setActiveTab(tab.id));
    el.addEventListener('mousedown', (e) => {
      if (e.button === 1) { e.preventDefault(); closeTab(tab.id); }
    });
    container.appendChild(el);
  }
}

/* ---------- File System Access API helpers ---------- */
const MD_TYPES = [{
  description: 'Markdown files',
  accept: { 'text/markdown': ['.md', '.markdown', '.mdown', '.mkd', '.mkdn', '.txt'] }
}];

async function verifyPermission(handle, readWrite) {
  const opts = { mode: readWrite ? 'readwrite' : 'read' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return (await handle.requestPermission(opts)) === 'granted';
}

async function openFilesViaFSA() {
  try {
    const handles = await window.showOpenFilePicker({ multiple: true, types: MD_TYPES });
    let last = null;
    for (const handle of handles) {
      const existing = await findTabByHandle(handle);
      if (existing) { last = existing; continue; }
      const file = await handle.getFile();
      const content = await file.text();
      last = newTab({ handle, content, savedContent: content });
      await recents.add(handle);
    }
    if (last) setActiveTab(last.id);
    refreshRecentMenu();
  } catch (err) {
    if (err.name !== 'AbortError') alert(`Open failed: ${err.message}`);
  }
}

async function openFilesViaUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = '.md,.markdown,.mdown,.mkd,.mkdn,.txt,text/markdown,text/plain';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', async () => {
    let last = null;
    for (const file of input.files) {
      const content = await file.text();
      last = newTab({ handle: null, content, fileName: file.name, savedContent: content });
    }
    if (last) setActiveTab(last.id);
    input.remove();
  });
  input.click();
}

async function sameHandle(a, b) {
  if (!a || !b) return false;
  if (typeof a.isSameEntry !== 'function') return false;
  try { return await a.isSameEntry(b); } catch { return false; }
}

async function findTabByHandle(handle) {
  for (const t of tabs) {
    if (t.handle && await sameHandle(t.handle, handle)) return t;
  }
  return null;
}

async function saveTab(tab) {
  if (!tab.handle) return await saveTabAs(tab);
  try {
    if (!(await verifyPermission(tab.handle, true))) {
      alert('Permission to save this file was denied.');
      return false;
    }
    const content = tab.id === activeTabId ? editor.getValue() : tab.doc;
    const writable = await tab.handle.createWritable();
    await writable.write(content);
    await writable.close();
    tab.doc = content;
    tab.lastSavedDoc = content;
    tab.dirty = false;
    renderTabs();
    updateStats();
    return true;
  } catch (err) {
    alert(`Save failed: ${err.message}`);
    return false;
  }
}

async function saveTabAs(tab) {
  const suggested = tab.fileName.endsWith('.md') ? tab.fileName : `${tab.fileName || 'Untitled'}.md`;
  if (HAS_FSA) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: suggested, types: MD_TYPES });
      tab.handle = handle;
      tab.fileName = handle.name;
      await recents.add(handle);
      refreshRecentMenu();
      return await saveTab(tab);
    } catch (err) {
      if (err.name === 'AbortError') return false;
      alert(`Save failed: ${err.message}`);
      return false;
    }
  } else {
    // Download fallback
    const content = tab.id === activeTabId ? editor.getValue() : tab.doc;
    downloadBlob(new Blob([content], { type: 'text/markdown' }), suggested);
    tab.lastSavedDoc = content;
    tab.dirty = false;
    tab.fileName = suggested;
    renderTabs();
    updateStats();
    return true;
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- IndexedDB store: recent handles + preferences ---------- */
const DB_NAME = 'markdown-editor';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('recent')) db.createObjectStore('recent', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbSet(store, key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const s = tx.objectStore(store);
    if (key === undefined) s.put(value); else s.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbClear(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const recents = {
  async list() { return (await dbGetAll('recent')).sort((a, b) => b.ts - a.ts).slice(0, 10); },
  async add(handle) {
    const all = await dbGetAll('recent');
    for (const entry of all) {
      if (await sameHandle(entry.handle, handle)) {
        const db = await openDB();
        db.transaction('recent', 'readwrite').objectStore('recent').delete(entry.id);
      }
    }
    await dbSet('recent', undefined, { handle, name: handle.name, ts: Date.now() });
    // Trim to 10
    const trimmed = await this.list();
    const db = await openDB();
    const tx = db.transaction('recent', 'readwrite');
    const store = tx.objectStore('recent');
    (await new Promise((res) => { const r = store.getAll(); r.onsuccess = () => res(r.result); }))
      .filter(e => !trimmed.find(t => t.id === e.id))
      .forEach(e => store.delete(e.id));
  },
  async clear() { await dbClear('recent'); }
};

/* ---------- Recent menu ---------- */
async function refreshRecentMenu() {
  const list = await recents.list();
  recentMenuEl.innerHTML = '';
  if (list.length === 0) {
    const b = document.createElement('button');
    b.className = 'disabled'; b.disabled = true;
    b.innerHTML = '<span>(none)</span>';
    recentMenuEl.appendChild(b);
    return;
  }
  for (const entry of list) {
    const b = document.createElement('button');
    b.setAttribute('role', 'menuitem');
    b.innerHTML = `<span>${escapeHtml(entry.name)}</span>`;
    b.title = entry.name;
    b.addEventListener('click', async () => {
      closeMenu();
      await openRecentEntry(entry);
    });
    recentMenuEl.appendChild(b);
  }
  const sep = document.createElement('div'); sep.className = 'menu-sep';
  recentMenuEl.appendChild(sep);
  const clr = document.createElement('button');
  clr.setAttribute('role', 'menuitem');
  clr.innerHTML = '<span>Clear Recent Files</span>';
  clr.addEventListener('click', async () => { await recents.clear(); await refreshRecentMenu(); });
  recentMenuEl.appendChild(clr);
}

async function openRecentEntry(entry) {
  try {
    const handle = entry.handle;
    if (!(await verifyPermission(handle, false))) {
      alert('Permission to read this file was denied.');
      return;
    }
    const existing = await findTabByHandle(handle);
    if (existing) { setActiveTab(existing.id); return; }
    const file = await handle.getFile();
    const content = await file.text();
    newTab({ handle, content, savedContent: content });
    await recents.add(handle);
    refreshRecentMenu();
  } catch (err) {
    alert(`Open failed: ${err.message}`);
  }
}

async function toggleVerticalTabs() {
  const on = document.body.classList.toggle('tabs-vertical');
  await dbSet('kv', 'tabsVertical', on);
  refreshVtabsMenuLabel();
  workspace.style.gridTemplateColumns = '';
  requestAnimationFrame(() => editor.refresh());
}

function refreshVtabsMenuLabel() {
  const on = document.body.classList.contains('tabs-vertical');
  toggleVtabsLabel.textContent = on ? '✓ Vertical Tabs' : 'Vertical Tabs';
}

function findHelpTab() { return tabs.find(t => t.isHelp); }

function refreshHelpMenuLabel() {
  toggleHelpLabel.textContent = findHelpTab() ? '✓ Help' : 'Help';
}

async function showVersion() {
  await showConfirm({
    title: 'Markdown Editor',
    message: `Version ${APP_VERSION}`,
    detail: 'Web edition · github.com/wsimps6i/markdown-editor-web',
    buttons: ['Close'],
    defaultIndex: 0,
    cancelIndex: 0
  });
}

async function toggleHelp() {
  const existing = findHelpTab();
  if (existing) {
    await closeTab(existing.id);
  } else {
    newTab({ content: DEFAULT_DOC, fileName: 'Help', isHelp: true });
  }
  refreshHelpMenuLabel();
}

document.getElementById('vtabs-new').addEventListener('click', () => newTab());

/* ---------- View modes ---------- */
function setViewMode(mode) {
  document.body.classList.remove('view-editor', 'view-split', 'view-preview');
  document.body.classList.add(`view-${mode}`);
  document.querySelectorAll('#view-toggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === mode);
  });
  if (mode !== 'split') workspace.style.gridTemplateColumns = '';
  requestAnimationFrame(() => editor.refresh());
  dbSet('kv', 'viewMode', mode);
}
document.querySelectorAll('#view-toggle button').forEach(b => {
  b.addEventListener('click', () => setViewMode(b.dataset.view));
});

/* ---------- Theme ---------- */
function toggleTheme() {
  const dark = document.body.classList.toggle('theme-dark');
  document.body.classList.toggle('theme-light', !dark);
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
}
try {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
  }
} catch {}

/* ---------- New tab button ---------- */
document.getElementById('new-tab-btn').addEventListener('click', () => newTab());

/* ---------- Splitter drag ---------- */
let dragging = false;
splitter.addEventListener('mousedown', (e) => {
  if (!document.body.classList.contains('view-split')) return;
  dragging = true; e.preventDefault();
  document.body.style.cursor = 'col-resize';
});
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const rect = workspace.getBoundingClientRect();
  const vtabsOn = document.body.classList.contains('tabs-vertical');
  const vtabsW = vtabsOn
    ? (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vtabs-w')) || 200)
    : 0;
  const usable = rect.width - vtabsW;
  const localX = e.clientX - rect.left - vtabsW;
  const ratio = Math.max(0.15, Math.min(0.85, localX / usable));
  workspace.style.gridTemplateColumns = vtabsOn
    ? `var(--vtabs-w) ${ratio}fr 1px ${1 - ratio}fr`
    : `${ratio}fr 1px ${1 - ratio}fr`;
  editor.refresh();
});
window.addEventListener('mouseup', () => {
  if (dragging) { dragging = false; document.body.style.cursor = ''; }
});

/* ---------- Confirm dialog ---------- */
function showConfirm({ title, message, detail, buttons, defaultIndex = 0, cancelIndex = -1, dangerIndex = -1 }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirm-dialog');
    document.getElementById('confirm-title').textContent = title || '';
    document.getElementById('confirm-message').textContent = message || '';
    document.getElementById('confirm-detail').textContent = detail || '';
    const btns = document.getElementById('confirm-buttons');
    btns.innerHTML = '';

    const close = (r) => {
      overlay.hidden = true;
      document.removeEventListener('keydown', onKey, true);
      resolve(r);
    };
    const onKey = (e) => {
      if (e.key === 'Escape' && cancelIndex >= 0) { e.preventDefault(); e.stopPropagation(); close(cancelIndex); }
      else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(defaultIndex); }
    };

    buttons.forEach((label, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      if (i === defaultIndex) b.classList.add('primary');
      if (i === dangerIndex)  b.classList.add('danger');
      b.addEventListener('click', () => close(i));
      btns.appendChild(b);
    });

    document.addEventListener('keydown', onKey, true);
    overlay.hidden = false;
    const defaultBtn = btns.children[defaultIndex];
    if (defaultBtn) defaultBtn.focus();
  });
}

/* ---------- Export ---------- */
const EXPORT_CSS = `
:root { color-scheme: light; }
body { font-family: -apple-system, "Segoe UI", system-ui, sans-serif; font-size: 15px; line-height: 1.7; color: #222; background: #fff; max-width: 760px; margin: 0 auto; padding: 40px 24px; }
h1, h2, h3, h4, h5, h6 { font-weight: 700; line-height: 1.25; margin: 1.6em 0 0.5em; }
h1 { font-size: 2em; border-bottom: 1px solid #e3e1de; padding-bottom: 0.25em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #e3e1de; padding-bottom: 0.2em; }
h3 { font-size: 1.25em; }
p { margin: 0.8em 0; }
a { color: #2868c4; text-decoration: none; border-bottom: 1px solid transparent; }
a:hover { border-bottom-color: #2868c4; }
code { font-family: "JetBrains Mono", "Cascadia Code", Consolas, monospace; font-size: 0.88em; background: #f6f5f3; border: 1px solid #e7e5e1; padding: 0.08em 0.4em; border-radius: 3px; }
pre { background: #f6f5f3; border: 1px solid #e7e5e1; border-radius: 5px; padding: 12px 16px; overflow-x: auto; line-height: 1.5; }
pre code { background: transparent; border: none; padding: 0; }
blockquote { margin: 1em 0; padding: 0.3em 1em; border-left: 3px solid #c9c6c2; color: #555; background: #faf9f7; }
ul, ol { padding-left: 1.6em; }
table { border-collapse: collapse; margin: 1em 0; width: 100%; }
th, td { border: 1px solid #e3e1de; padding: 6px 10px; text-align: left; }
th { background: #f6f5f3; }
hr { border: none; border-top: 1px solid #e3e1de; margin: 1.8em 0; }
img { max-width: 100%; display: block; margin: 1em auto; }
`;

function buildExportHtml() {
  const tab = getActive();
  if (!tab) return null;
  const body = md.render(tab.doc || '');
  const title = (tab.fileName || 'document').replace(/\.[^.]+$/, '');
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>${EXPORT_CSS}</style></head>
<body>${body}</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function exportHtml() {
  const html = buildExportHtml();
  if (!html) return;
  const tab = getActive();
  const suggested = (tab.fileName || 'document').replace(/\.[^.]+$/, '') + '.html';
  if (HAS_FSA) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: suggested,
        types: [{ description: 'HTML', accept: { 'text/html': ['.html'] } }]
      });
      const w = await handle.createWritable();
      await w.write(html); await w.close();
    } catch (err) {
      if (err.name !== 'AbortError') alert(`Export failed: ${err.message}`);
    }
  } else {
    downloadBlob(new Blob([html], { type: 'text/html' }), suggested);
  }
}

function exportPdf() {
  // Browser's native print → "Save as PDF". Uses a hidden iframe so no
  // new browser tab is spawned.
  const html = buildExportHtml();
  if (!html) return;

  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed', right: '0', bottom: '0',
    width: '0', height: '0', border: 'none', visibility: 'hidden'
  });
  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument || iframe.contentWindow.document;
  idoc.open();
  idoc.write(html);
  idoc.close();

  const doPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      alert(`PDF export failed: ${err.message}`);
    }
    // Remove the iframe once the print dialog has closed. print() is synchronous
    // in Chromium — it returns after the user saves or cancels — but leave a
    // small grace window so the browser can finish streaming to disk.
    setTimeout(() => iframe.remove(), 1000);
  };

  // Wait for the iframe's stylesheet/fonts to settle before printing.
  if (iframe.contentDocument.readyState === 'complete') setTimeout(doPrint, 100);
  else iframe.onload = () => setTimeout(doPrint, 100);
}

/* ---------- Menu bar ---------- */
function openMenu() {
  menuEl.hidden = false;
  menuBtn.classList.add('open');
}
function closeMenu() {
  menuEl.hidden = true;
  menuBtn.classList.remove('open');
}
menuBtn.addEventListener('click', () => menuEl.hidden ? openMenu() : closeMenu());
document.addEventListener('click', (e) => {
  if (!menuEl.hidden && !menuEl.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) closeMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !menuEl.hidden) closeMenu();
});

menuEl.querySelectorAll('button[data-cmd]').forEach(b => {
  b.addEventListener('click', () => {
    const cmd = b.dataset.cmd;
    closeMenu();
    dispatchCommand(cmd);
  });
});

/* ---------- Command dispatch ---------- */
async function dispatchCommand(cmd) {
  const tab = getActive();
  switch (cmd) {
    case 'new-tab':        newTab(); break;
    case 'open':           HAS_FSA ? await openFilesViaFSA() : await openFilesViaUpload(); break;
    case 'save':           if (tab) await saveTab(tab); break;
    case 'save-as':        if (tab) await saveTabAs(tab); break;
    case 'export-html':    await exportHtml(); break;
    case 'export-pdf':     exportPdf(); break;
    case 'close-tab':      if (tab) closeTab(tab.id); break;
    case 'toggle-vtabs':   await toggleVerticalTabs(); break;
    case 'toggle-theme':   toggleTheme(); break;
    case 'toggle-help':    await toggleHelp(); break;
    case 'show-version':   await showVersion(); break;
    case 'find':           editor.execCommand('find'); break;
    case 'view-editor':    setViewMode('editor'); break;
    case 'view-split':     setViewMode('split'); break;
    case 'view-preview':   setViewMode('preview'); break;
  }
}

/* ---------- Keyboard shortcuts ---------- */
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  const shift = e.shiftKey;
  const alt = e.altKey;
  const ctrl = e.ctrlKey || e.metaKey;

  // Alt-based fallbacks for the shortcuts the browser reserves at OS level
  // (Ctrl+N / Ctrl+T / Ctrl+W). preventDefault has no effect on those.
  if (alt && !ctrl && !shift) {
    let cmd = null;
    if      (key === 'n') cmd = 'new-tab';
    else if (key === 'w') cmd = 'close-tab';
    else if (key === 'h') cmd = 'toggle-help';
    if (cmd) { e.preventDefault(); dispatchCommand(cmd); return; }
  }

  if (!ctrl) return;
  let cmd = null;
  if      (key === 'o' && !shift) cmd = 'open';
  else if (key === 's' && !shift) cmd = 'save';
  else if (key === 's' && shift)  cmd = 'save-as';
  else if (key === 'b' && !shift) cmd = 'toggle-vtabs';
  else if (key === 'd' && !shift) cmd = 'toggle-theme';
  else if (key === '1') cmd = 'view-editor';
  else if (key === '2') cmd = 'view-split';
  else if (key === '3') cmd = 'view-preview';
  if (cmd) { e.preventDefault(); dispatchCommand(cmd); }
});

/* ---------- Warn before leaving with dirty tabs ---------- */
window.addEventListener('beforeunload', (e) => {
  if (tabs.some(t => t.dirty)) {
    e.preventDefault();
    e.returnValue = '';
  }
});

/* ---------- Bootstrap ---------- */
async function bootstrap() {
  if (!HAS_FSA) {
    document.getElementById('unsupported-banner').hidden = false;
    document.getElementById('unsupported-close').addEventListener('click', () => {
      document.getElementById('unsupported-banner').hidden = true;
    });
  }

  // Restore preferences
  try {
    const tabsVertical = await dbGet('kv', 'tabsVertical');
    if (tabsVertical === true) document.body.classList.add('tabs-vertical');
    refreshVtabsMenuLabel();
    const viewMode = await dbGet('kv', 'viewMode');
    if (viewMode && viewMode !== 'split') setViewMode(viewMode);
  } catch { /* IndexedDB unavailable — private browsing? — proceed without persistence. */ }

  document.getElementById('version-menu-value').textContent = APP_VERSION;

  newTab();
  refreshRecentMenu();
}

bootstrap();
