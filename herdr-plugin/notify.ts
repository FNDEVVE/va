import { herdr, isEnabled, parseEvent } from "./lib";
import { stripMarkdown, truncate } from "./markdown";
import { speak } from "./tts";

const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

if (!force && !(await isEnabled())) process.exit(0);

const event = parseEvent();
if (!force && event.status !== "done") process.exit(0);
if (!event.paneId) {
  console.error("agent-tts: no pane_id in event");
  process.exit(0);
}

let raw: string;
try {
  const lines = Number(Bun.env.HERDR_TTS_LINES ?? 200);
  raw = await herdr("pane", "read", event.paneId, "--source", "recent-unwrapped", "--lines", String(lines));
} catch (e: any) {
  console.error(`agent-tts: herdr pane read failed: ${e.message}`);
  process.exit(0);
}

if (!raw.trim()) process.exit(0);

const text = truncate(stripMarkdown(raw), Number(Bun.env.HERDR_TTS_MAX_CHARS ?? 1000));
if (!text) process.exit(0);

if (dryRun) {
  console.log("[agent-tts dry-run] would speak:");
  console.log(text);
  process.exit(0);
}

await speak(text);
