# Code Trace

Copy a workspace-relative file path with an optional line range to the clipboard — formatted for pasting into coding agents, PR comments, or docs.

## Usage

With cursor or selection in any editor file:

| Action | Result |
|---|---|
| No selection | `src/utils/parser.ts` |
| Cursor on line 42 (single line selected) | `src/utils/parser.ts:42` |
| Lines 10–25 selected | `src/utils/parser.ts:10-25` |
| Multiple selections (`perSelection` mode) | one reference per line |
| Multiple selections (`span` mode) | single range min→max |

## Trigger

- **Keybinding:** `Ctrl+Alt+C` / `Cmd+Alt+C`
- **Command Palette:** `Code Trace: Copy Code Reference`
- **Editor context menu:** right-click → `Copy Code Reference`

> **`Ctrl+Alt+C` conflict note:** this binding may overlap with some "Copy Path" bindings in certain environments. It ships enabled by default and is freely rebindable via `keybindings.json`.

## Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `codeTrace.multiSelection` | `"primary"` \| `"perSelection"` \| `"span"` | `"primary"` | How to handle multiple cursors/selections |

- **`primary`** — use the first selection only.
- **`perSelection`** — one reference per non-empty selection, sorted ascending, newline-joined.
- **`span`** — single range from the lowest start to the highest end.

## Install

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=anasshakil.code-trace)
- [Open VSX](https://open-vsx.org/extension/anasshakil/code-trace) (Cursor, Codium, etc.)
