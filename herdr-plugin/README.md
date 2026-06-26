# Agent TTS — Herdr plugin

Speaks AI coding-agent responses aloud when they finish, using Deepgram Aura-2.
Works with any agent Herdr tracks (Devin, Claude Code, Codex, Gemini, Cursor,
Copilot CLI, etc.) — Herdr handles agent detection; this plugin reads the pane
text and speaks it.

## Requirements

- [Herdr](https://herdr.dev) 0.7.0+
- [Bun](https://bun.sh) 1.0+
- macOS
- [`dg`](https://cli.deepgram.com/) CLI + [`ffplay`](https://ffmpeg.org/)

## Install

```bash
herdr plugin link /path/to/this-dir
```

## Options

Set these in `.env` (Bun loads it automatically):

| Var | Default | Description |
|---|---|---|
| `HERDR_TTS_DEEPGRAM_MODEL` | `aura-2-apollo-en` | Deepgram Aura-2 voice |
| `HERDR_TTS_DG_BIN` | `dg` | Path to Deepgram CLI |
| `HERDR_TTS_PLAYER_BIN` | `ffplay` | Audio player |
| `HERDR_TTS_LINES` | `200` | Lines of pane output to read |
| `HERDR_TTS_MAX_CHARS` | `1000` | Max chars to speak after stripping |

## Usage

Fires automatically when any tracked agent reaches `done`.

Toggle on/off with a keybind:

```toml
[[keys.command]]
key = "prefix+shift+s"
type = "plugin_action"
command = "fnd.agent-tts.toggle"
description = "toggle TTS"
```

Manual controls:

```bash
herdr plugin action invoke toggle  --plugin fnd.agent-tts
herdr plugin action invoke speak   --plugin fnd.agent-tts   # speak now
```

## How it works

1. Herdr fires `pane.agent_status_changed` → runs `bun notify.ts`
2. Checks status is `done` and toggle is on
3. `herdr pane read <pane_id> --source recent-unwrapped` → response text
4. Strips markdown to spoken prose via Sätteri MDAST parser
5. Speaks via `dg speak` → `ffplay`
