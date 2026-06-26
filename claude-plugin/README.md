# Claude TTS — Streaming voice for Claude Code

Speaks Claude Code responses aloud as they stream, using Deepgram Aura-2.
~1s to first audio. No waiting for the full response.

## How it works

```
Claude Code MessageDisplay hook (per delta batch)
  → hook.ts: strip markdown, POST to daemon
  → daemon.ts: sentence queue → Deepgram WebSocket → ffmpeg
```

A long-lived daemon holds one `ffmpeg` process and one Deepgram WebSocket
connection, serializing all sentences through a single audio pipe — no overlap,
no race conditions. The hook script (fired per delta) just forwards text to the
daemon over a Unix socket and exits immediately.

## Requirements

- [Bun](https://bun.sh) 1.0+
- macOS
- [`ffmpeg`](https://ffmpeg.org/) (for audio playback via audiotoolbox)
- `DEEPGRAM_API_KEY` env var

## Install

Register the hook in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "MessageDisplay": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bun /path/to/claude-plugin/hook.ts"
          }
        ]
      }
    ]
  }
}
```

Set your API key in `.env` (Bun loads it automatically):

```bash
DEEPGRAM_API_KEY=your-key-here
```

## Options

| Var | Default | Description |
|---|---|---|
| `DEEPGRAM_API_KEY` | — | Deepgram API key (required) |
| `CLAUDE_TTS_MODEL` | `aura-2-apollo-en` | Deepgram Aura-2 voice |
| `CLAUDE_TTS_SAMPLE_RATE` | `24000` | Audio sample rate (Hz) |
| `CLAUDE_TTS_IDLE_TIMEOUT` | `30000` | Daemon exits after this many ms idle |

## Toggle

```bash
bun toggle.ts        # toggle on/off
bun toggle.ts on     # enable
bun toggle.ts off    # disable
```

State persists to `~/.local/state/claude-tts/enabled`.

## Files

| File | Purpose |
|---|---|
| `hook.ts` | MessageDisplay hook: stdin JSON → strip markdown → POST to daemon |
| `daemon.ts` | Long-lived daemon: Unix socket server → Deepgram WS → ffmpeg |
| `lib.ts` | Shared: paths, toggle state, daemon liveness check |
| `markdown.ts` | Markdown → spoken prose via Sätteri MDAST parser |
| `toggle.ts` | On/off toggle |
