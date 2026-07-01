# Markdown Editor — Web edition

A clean, Typora-inspired markdown editor that runs directly in your browser. Same feature set as the [Electron desktop version](https://github.com/wsimps6i/markdown-editor), but delivered as a static site with no install.

## Features

- **Real save-to-same-file** via the File System Access API (Chrome / Edge).
- **Multi-tab editing** — open many files, live dirty indicators, safe-close prompts.
- **Live preview** — GFM markdown rendered as you type.
- **Inline-rendered editor** — headings grow, bold is bold, code gets a pill, markers fade.
- **Recent files** — up to 10 previously-opened files, remembered across sessions.
- **HTML / PDF export** — standalone HTML or print-to-PDF via browser's native print dialog.
- **Three view modes** — editor only, split, preview only.
- **Dark mode** — theme-follow persisted in `localStorage`.
- **All keyboard shortcuts** work identically to the desktop version.

## Browser support

The File System Access API is what makes real file save/open work. Supported in:

- Chrome / Edge / Opera / Brave (any Chromium-based browser)
- **Not** supported in Firefox or Safari — those fall back to upload/download flow (still fully usable, just less convenient).

## Run locally

```powershell
cd markdown-editor-web
npx serve -l 5173
# then open http://localhost:5173
```

Serving via HTTP or HTTPS is required — the File System Access API refuses to work over `file://` for security reasons.

## Deploy

Push to `main`, enable GitHub Pages with source = "Deploy from a branch" pointing at `main / (root)`. The `.nojekyll` file ships as-is (no Jekyll transformation).

## Keyboard shortcuts

| Action                       | Shortcut             |
| ---------------------------- | -------------------- |
| New tab                      | `Alt+N`              |
| Open file                    | `Ctrl+O`             |
| Save                         | `Ctrl+S`             |
| Save As                      | `Ctrl+Shift+S`       |
| Close tab                    | `Alt+W`              |
| Find in editor               | `Ctrl+F`             |
| Vertical tabs                | `Ctrl+B`             |
| Editor / Split / Preview     | `Ctrl+1` / `2` / `3` |
| Toggle dark mode             | `Ctrl+D`             |

## Tech stack

- Vanilla HTML / CSS / JS — no build step, no framework.
- [CodeMirror 5](https://codemirror.net/5/) for the editor, loaded from jsDelivr CDN.
- [markdown-it](https://github.com/markdown-it/markdown-it) for preview rendering.
- File System Access API + IndexedDB for persistent state (recent files, last folder, sidebar visibility).

## Project layout

```
markdown-editor-web/
├── index.html       # Layout: tab bar, menu, sidebar, editor, preview, dialog
├── styles.css       # Light + dark themes, inline-rendered token styling, print CSS
├── app.js           # Tabs, editor, preview, sidebar, FSA I/O, IndexedDB, export
├── assets/
│   ├── icon.svg
│   └── favicon.png
└── .nojekyll        # GitHub Pages serves the folder verbatim
```
