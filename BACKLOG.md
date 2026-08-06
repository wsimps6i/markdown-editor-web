# Backlog

Loose ideas for future work. Not prioritised — pick whatever looks fun.

## Editing

- **Inline WYSIWYG** *(Typora-style)* — markdown syntax hides as you type. Needs a ProseMirror-based rewrite (Milkdown / Crepe). Big change; would replace CodeMirror.
- **Multiple cursors** — CodeMirror 5 has an `Alt+click` extension; wire it up plus `Ctrl+D` for "add next occurrence".
- **Templates / snippets** — type a trigger (`/task`, `/meeting`) and expand a scaffold. Small dictionary + a snippet-picker in the palette.
- **Typewriter mode** — keep the active line vertically centred as the user types.
- **Autocomplete** — as the user types `[[` suggest existing tab filenames; `:` suggest emoji; `#` inside a heading suggest custom IDs.

## Rendering

- **PlantUML / GraphViz diagrams** — sibling code-fences to `mermaid`. Both have browser-loadable renderers.
- **Diagrams.net (drawio) embed** — paste a shared drawio URL, render inline.
- **Chart.js / Vega-lite from fenced blocks** — `` ```chart `` renders a JSON spec.
- **Frontmatter rendering** — parse YAML frontmatter and show a small metadata card at the top of the preview.

## Navigation & organisation

- **Wiki-links** — `[[Note title]]` opens another tab (or creates it if it doesn't exist). Needs a store of file handles keyed by name.
- **Tags** — `#tag` classification; a tag pane that lists all documents by tag and lets you filter.
- **Backlinks pane** — for the active doc, show every other doc that links to it.
- **Palette: include recent files and open tabs** — right now the palette only holds commands.

## Presentation & sharing

- **Presentation / slides mode** — treat `---` as slide breaks; reveal.js overlay for the current doc. Ship / print as a deck.
- **Publish as gist** — GitHub OAuth flow, then Save to Gist / Update Gist. Adds a real network dependency.
- **Copy rendered as rich text** — puts formatted HTML on the clipboard so pasting into Word / Outlook keeps formatting.

## Polish

- **Word-count goals & progress ring** — set a target (500 / 1500 / etc.); show a subtle progress ring in the status bar.
- **Custom themes** — a `theme.css` slot the user can edit, or an in-app theme picker with more than dark/light.
- **Per-document `<style>`** — recognise a `<style>` block at the top of the source and apply it to the preview only.
- **Improved PDF headers/footers** — page numbers, filename, date. Currently these are left to Chrome's print dialog because CSS Paged Media at-rules (`@top-center`) aren't reliably supported.
- **Live outline highlight** — sync the outline's active heading with the cursor position.
- **Session-scoped Undo tab** — like browser "reopen closed tab": bring back the last closed tab with its content.

## Known limitations

- Auto-save restores content from IndexedDB, but browsers won't auto-grant read/write on stored `FileSystemFileHandle` — the user has to click Save once to re-authorise per session.
- Mermaid v11 bundle is ~2.5 MB; noticeable on first load. Could switch to lazy-loading only when a `mermaid` block is encountered.
- Session storage grows unbounded (only tab contents, but still). No cap or cleanup UI.
- Firefox and Safari fall back to upload/download rather than real file save; the whole app still works, just less pleasant.
