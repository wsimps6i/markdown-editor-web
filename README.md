# Markdown Editor — Web edition

A clean markdown editor that runs directly in your browser. Delivered as a static site with no install — deployed at [wsimps6i.github.io/markdown-editor-web](https://wsimps6i.github.io/markdown-editor-web/).

## Features

- **Real save-to-same-file** via the File System Access API (Chrome / Edge).
- **Multi-tab editing** — open many files, orange dirty-tab pip on the left edge, safe-close prompts.
- **Vertical or horizontal tab strip** — toggle any time via **Ctrl+B**.
- **Live preview** — CommonMark + GFM + extended syntax rendered as you type. Full coverage of the [Markdown Guide cheat sheet](https://www.markdownguide.org/cheat-sheet/): headings, bold/italic, strikethrough, links, images, tables, fenced code, blockquotes, task lists, footnotes, definition lists, heading IDs, emoji shortcodes, highlight, subscript, superscript, and auto-linked bare URLs.
- **Syntax-highlighted code blocks** — [highlight.js](https://highlightjs.org/) colours fenced code in over 190 languages; theme flips with dark mode.
- **Math (KaTeX)** — inline `$E = mc^2$` and block `$$…$$` render as real equations.
- **Mermaid diagrams** — flowcharts, sequence, ER, and more from ` ```mermaid ` blocks.
- **Auto-save + session restore** — every keystroke goes to IndexedDB; tabs come back on next visit (file handles included, subject to browser re-permission).
- **Scroll sync** — scroll the editor and the preview follows, and vice-versa.
- **Font zoom** — `Alt++` / `Alt+-` / `Alt+0`, persisted.
- **Drag-and-drop images** — drop a PNG/JPEG onto the editor to embed as a data URI.
- **Inline-rendered editor** — headings grow, bold is bold, code gets a pill, syntax markers fade.
- **Recent files** — the last 5 previously-opened files remembered across sessions.
- **HTML / PDF export** — standalone HTML, or PDF via a hidden print iframe (no popup tab).
- **Help panel** — a read-only cheat-sheet tab toggleable from the menu or **Alt+H**.
- **Three view modes** — editor only, split, preview only.
- **Dark mode** — persisted in `localStorage`.
- **Themed confirm dialogs** — no native OS dialog stuck in light mode.

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
| Find in editor               | `Alt+F`              |
| Replace in editor            | `Alt+R`              |
| Vertical tabs                | `Ctrl+B`             |
| Help panel                   | `Alt+H`              |
| Zoom in / out / reset        | `Alt++` / `Alt+-` / `Alt+0` |
| Editor / Split / Preview     | `Ctrl+1` / `2` / `3` |
| Toggle dark mode             | `Ctrl+D`             |

`Alt+N` and `Alt+W` are used for new / close tab because Chrome and Edge reserve `Ctrl+N`, `Ctrl+T`, and `Ctrl+W` at the browser level and web pages can't override them.

## Tech stack

- Vanilla HTML / CSS / JS — no build step, no framework.
- [CodeMirror 5](https://codemirror.net/5/) for the editor, loaded from jsDelivr CDN.
- [markdown-it](https://github.com/markdown-it/markdown-it) for preview rendering, with plugins for the extended syntax: `markdown-it-task-lists`, `markdown-it-footnote`, `markdown-it-emoji`, `markdown-it-mark`, `markdown-it-sub`, `markdown-it-sup`, `markdown-it-deflist`, `markdown-it-anchor`, `markdown-it-texmath` (KaTeX).
- [highlight.js](https://highlightjs.org/) for fenced-code syntax colouring.
- [KaTeX](https://katex.org/) for math typesetting.
- [Mermaid](https://mermaid.js.org/) for text-defined diagrams.
- File System Access API + IndexedDB for persistent state (recent files, view mode, vertical-tabs preference).

## Project layout

```
markdown-editor-web/
├── index.html       # Layout: top bar, menu, vertical-tabs column, editor, preview, dialog
├── styles.css       # Light + dark themes, inline-rendered token styling, print CSS
├── app.js           # Tabs, editor, preview, FSA I/O, IndexedDB, export
├── assets/
│   ├── icon.svg
│   └── favicon.png
└── .nojekyll        # GitHub Pages serves the folder verbatim
```
