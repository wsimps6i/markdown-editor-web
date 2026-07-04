# Markdown Editor — Web edition

A clean markdown editor that runs directly in your browser. Delivered as a static site with no install — deployed at [wsimps6i.github.io/markdown-editor-web](https://wsimps6i.github.io/markdown-editor-web/).

## Features

### Writing
- **Multi-tab editing** — open many files, orange dirty-tab pip on the left edge, safe-close prompts.
- **Vertical or horizontal tab strip** — toggle any time via `Ctrl+B`.
- **Inline-rendered editor** — headings grow, bold is bold, code gets a pill, syntax markers fade.
- **Find & Replace** — `Alt+F` / `Alt+R` open CodeMirror's search dialogs.
- **Focus mode** — dims every paragraph but the one under the cursor.
- **Word count & reading time** — live in the status bar; switches to selection stats (`A of B words · A' of B' chars selected`) when text is highlighted.
- **Font zoom** — `Alt++` / `Alt+-` / `Alt+0`, persisted across sessions.
- **Drag-and-drop / clipboard-paste images** — drop a file or `Ctrl+V` an image → embedded as a data URI at the cursor.

### Rendering
- **Live preview** — CommonMark + GFM + extended syntax rendered as you type. Full coverage of the [Markdown Guide cheat sheet](https://www.markdownguide.org/cheat-sheet/): headings, bold/italic, strikethrough, links, images, tables, fenced code, blockquotes, task lists, footnotes, definition lists, heading IDs, emoji shortcodes, highlight, subscript, superscript, and auto-linked bare URLs.
- **Syntax-highlighted code blocks** — [highlight.js](https://highlightjs.org/) colours fenced code in over 190 languages; theme flips with dark mode.
- **Math (KaTeX)** — inline `$E = mc^2$` and block `$$…$$` render as real equations.
- **Mermaid diagrams** — flowcharts, sequence, ER, gantt, and more from ` ```mermaid ` blocks.
- **Scroll sync** — scroll the editor and the preview follows (and vice-versa); toggleable in the menu.
- **Three view modes** — editor only, split, preview only.

### Navigation
- **Command palette** — `Ctrl+Shift+P` opens a searchable list of every command. Type to filter, arrow keys to move, Enter to run. Menus mostly exist as a discovery hint.
- **Outline sidebar** — a pinned right column showing every heading in the current doc; click to jump.
- **Recent files** — the last 5 previously-opened files remembered across sessions.
- **Slide-in menu panel** — a pinned left column (Outlook-style) with the stateful toggles and recent-files list.

### File I/O
- **Real save-to-same-file** via the File System Access API (Chrome / Edge / Chromium).
- **HTML export** — standalone `.html` with inlined styles.
- **Customisable PDF export** — pick page size (A4 / Letter / Legal / A3 / A5), orientation, margins, optional cover page (title / subtitle / author / date), and optional auto-generated table of contents. Prints via a hidden iframe — no popup tab.
- **Auto-save + session restore** — every keystroke goes to IndexedDB; tabs come back on next visit (file handles included, subject to browser re-permission).

### Reference & appearance
- **Cheat sheet modal** — compact three-column reference for every supported syntax.
- **Help panel** — a read-only cheat-sheet tab toggleable from the menu or `Alt+H`.
- **Dark mode** — persisted; switches highlight.js theme and re-inits Mermaid.
- **Themed confirm and file dialogs** — no OS dialog stuck in light mode.
- **Custom app icon and slide-in animations** — Outlook-style pinned panels.

## Browser support

The File System Access API is what makes real file save/open work. Supported in:

- Chrome / Edge / Opera / Brave (any Chromium-based browser)
- **Not** supported in Firefox or Safari — those fall back to upload/download flow (still fully usable, just less convenient).

Clipboard-image paste and drag-and-drop image work everywhere modern.

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

| Action                       | Shortcut                    |
| ---------------------------- | --------------------------- |
| Command palette              | `Ctrl+Shift+P`              |
| New tab                      | `Alt+N`                     |
| Open file                    | `Ctrl+O`                    |
| Save                         | `Ctrl+S`                    |
| Save As                      | `Ctrl+Shift+S`              |
| Close tab                    | `Alt+W`                     |
| Find in editor               | `Alt+F`                     |
| Replace in editor            | `Alt+R`                     |
| Vertical tabs                | `Ctrl+B`                    |
| Help panel                   | `Alt+H`                     |
| Zoom in / out / reset        | `Alt++` / `Alt+-` / `Alt+0` |
| Editor / Split / Preview     | `Ctrl+1` / `2` / `3`        |
| Toggle dark mode             | `Ctrl+D`                    |

`Alt+*` is used for the shortcuts Chrome / Edge reserve at the browser level (`Ctrl+N`, `Ctrl+T`, `Ctrl+W`, `Ctrl+F`) since web pages can't override those.

## Tech stack

- Vanilla HTML / CSS / JS — no build step, no framework.
- [CodeMirror 5](https://codemirror.net/5/) for the editor, loaded from jsDelivr CDN.
- [markdown-it](https://github.com/markdown-it/markdown-it) for preview rendering, with plugins for the extended syntax: `markdown-it-task-lists`, `markdown-it-footnote`, `markdown-it-emoji`, `markdown-it-mark`, `markdown-it-sub`, `markdown-it-sup`, `markdown-it-deflist`, `markdown-it-anchor`, `markdown-it-texmath` (KaTeX).
- [highlight.js](https://highlightjs.org/) for fenced-code syntax colouring.
- [KaTeX](https://katex.org/) for math typesetting.
- [Mermaid](https://mermaid.js.org/) for text-defined diagrams.
- File System Access API + IndexedDB for persistent state (recent files, view mode, sync-scrolling / vertical-tabs / focus-mode / outline preferences, zoom level, open tabs).

## Project layout

```
markdown-editor-web/
├── index.html       # Layout: menu panel, tab bar, editor, preview, outline, dialogs, palette
├── styles.css       # Light + dark themes, inline-rendered token styling, print CSS, modal styles
├── app.js           # Tabs, editor, preview, FSA I/O, IndexedDB, palette, outline, export, dialogs
├── assets/
│   ├── icon.svg
│   └── favicon.png
└── .nojekyll        # GitHub Pages serves the folder verbatim
```
