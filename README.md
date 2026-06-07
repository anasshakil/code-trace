# Code Trace

Copy workspace-relative file paths with optional line ranges — and jump back to them from pasted references. Built for coding agents, PR comments, and docs.

## Copy Code Reference

With cursor or selection in any editor file:

| Action | Result |
|---|---|
| No selection | `src/utils/parser.ts` |
| Cursor on line 42 (single line selected) | `src/utils/parser.ts:42` |
| Lines 10–25 selected | `src/utils/parser.ts:10-25` |
| Multiple selections (`perSelection` mode) | one reference per line |
| Multiple selections (`span` mode) | single range min→max |

**Triggers**

- **Keybinding:** `Ctrl+Alt+C` / `Cmd+Alt+C`
- **Command Palette:** `Code Trace: Copy Code Reference`
- **Editor context menu:** right-click → `Copy Code Reference`

> **`Ctrl+Alt+C` conflict note:** this binding may overlap with some "Copy Path" bindings in certain environments. It ships enabled by default and is freely rebindable via `keybindings.json`.

## Open Code Reference

Paste or type code references (from clipboard, chat, or a PR) and open the matching file with the right lines selected.

**Supported formats**

- Bare path: `src/utils/parser.ts`
- Single line: `src/utils/parser.ts:42`
- Line range: `src/utils/parser.ts:10-25`
- Multiple references: newline- or whitespace-separated

**Picker behavior**

- Resolves paths across all workspace folders.
- Groups multiple ranges in the same file (configurable).
- Previews the file and reveals the active row as you navigate (configurable).
- Shows warnings for unrecognized tokens or files not found in the workspace.

**Triggers**

- **Keybinding:** `Ctrl+Alt+Shift+O` / `Cmd+Alt+Shift+O`
- **Command Palette:** `Code Trace: Open Code Reference`

## Settings

### Copy

| Setting | Type | Default | Description |
|---|---|---|---|
| `codeTrace.multiSelection` | `"primary"` \| `"perSelection"` \| `"span"` | `"primary"` | How to handle multiple cursors/selections |

- **`primary`** — use the first selection only.
- **`perSelection`** — one reference per non-empty selection, sorted ascending, newline-joined.
- **`span`** — single range from the lowest start to the highest end.

### Open

| Setting | Type | Default | Description |
|---|---|---|---|
| `codeTrace.openSource` | `"auto"` \| `"paste"` | `"auto"` | Where the picker gets its initial input |
| `codeTrace.openGrouping` | `"aggregate"` \| `"aggregateAndRange"` \| `"range"` | `"aggregate"` | How to group multiple references to the same file |
| `codeTrace.openParsing` | `"tolerant"` \| `"tolerantVerbose"` | `"tolerant"` | How to handle lines that don't match the path:line format |
| `codeTrace.openRowAction` | `"preview"` \| `"noAction"` | `"preview"` | What happens when a result row becomes active |
| `codeTrace.openBoxBehavior` | `"smartReparse"` \| `"autoFilterPasteParse"` \| `"alwaysParse"` | `"smartReparse"` | What typing in the picker input does |

- **`openSource`**
  - **`auto`** — read the clipboard when the picker opens.
  - **`paste`** — start with an empty picker; parse as you paste or type.

- **`openGrouping`**
  - **`aggregate`** — collapse multiple ranges of the same file into one multi-cursor result.
  - **`aggregateAndRange`** — show both the collapsed result and each individual range.
  - **`range`** — show every reference as its own row.

- **`openParsing`**
  - **`tolerant`** — silently drop unrecognized lines.
  - **`tolerantVerbose`** — show unrecognized lines as disabled rows.

- **`openRowAction`**
  - **`preview`** — preview the file and reveal the row while navigating.
  - **`noAction`** — open nothing until you accept a result.

- **`openBoxBehavior`**
  - **`smartReparse`** — parse when input looks like references; otherwise fuzzy-filter existing results.
  - **`autoFilterPasteParse`** — fuzzy-filter in `auto` source; parse on change in `paste` source.
  - **`alwaysParse`** — re-parse the input box on every change.

## Install

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=anasshakil.code-trace)
- [Open VSX](https://open-vsx.org/extension/anasshakil/code-trace) (Cursor, Codium, etc.)
