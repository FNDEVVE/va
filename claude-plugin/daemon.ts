import { clearPid, socketPath, writePid } from "./lib";
import { pronunciations } from "./pronunciations";

const pronRules = Object.entries(pronunciations).map(([word, ipa]) => ({
  re: new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"),
  ipa,
}));

function applyPronunciations(text: string): string {
  return pronRules.reduce(
    (s, { re, ipa }) =>
      s.replace(re, (m) => `\\{"word":"${m}","pronounce":"${ipa}"\\}`),
    text,
  );
}

const IDLE_TIMEOUT_MS = Number(Bun.env.CLAUDE_TTS_IDLE_TIMEOUT ?? 30000);
const model = Bun.env.CLAUDE_TTS_MODEL ?? "aura-2-apollo-en";
const sampleRate = Number(Bun.env.CLAUDE_TTS_SAMPLE_RATE ?? 24000);
const apiKey = Bun.env.DEEPGRAM_API_KEY;

if (!apiKey) {
  console.error("claude-tts: DEEPGRAM_API_KEY not set");
  process.exit(1);
}

const wsUrl = `wss://api.deepgram.com/v1/speak?model=${model}&encoding=linear16&sample_rate=${sampleRate}`;

let ffmpeg: ReturnType<typeof Bun.spawn> | null = null;
let ws: WebSocket | null = null;
let wsReady = false;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

const queue: { text?: string; flush?: boolean }[] = [];
let flushInFlight = false;

function resetIdle() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(shutdown, IDLE_TIMEOUT_MS);
}

function startPipeline() {
  if (ffmpeg) return;

  ffmpeg = Bun.spawn({
    cmd: [
      "ffmpeg",
      "-f",
      "s16le",
      "-ar",
      String(sampleRate),
      "-ac",
      "1",
      "-i",
      "-",
      "-f",
      "audiotoolbox",
      "-",
    ],
    stdin: "pipe",
    stdout: "ignore",
    stderr: "ignore",
  });

  connectWs();
  resetIdle();
}

function connectWs() {
  ws = new WebSocket(wsUrl, { headers: { Authorization: `Token ${apiKey}` } });

  ws.addEventListener("open", () => {
    wsReady = true;
    drain();
  });

  ws.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer || event.data instanceof Uint8Array) {
      const bytes =
        event.data instanceof ArrayBuffer
          ? new Uint8Array(event.data)
          : event.data;
      // oxlint-disable-next-line no-unused-expressions
      ffmpeg?.stdin &&
        typeof ffmpeg.stdin !== "number" &&
        ffmpeg.stdin.write(bytes);
      return;
    }
    try {
      const msg = JSON.parse(event.data as string);
      if (msg.type === "Flushed") flushInFlight = false;
    } catch {}
  });

  ws.addEventListener("error", (e) =>
    console.error("claude-tts: ws error", String(e)),
  );
  ws.addEventListener("close", () => {
    wsReady = false;
    ws = null;
    // Reconnect if we still have work or ffmpeg is alive
    if (ffmpeg && (queue.length || flushInFlight)) connectWs();
  });
}

function drain() {
  if (!wsReady || !ws) return;
  while (queue.length) {
    const item = queue.shift()!;
    if (item.text) ws.send(JSON.stringify({ type: "Speak", text: item.text }));
    if (item.flush && !flushInFlight) {
      flushInFlight = true;
      ws.send(JSON.stringify({ type: "Flush" }));
    }
  }
}

function sendSentence(text: string) {
  if (!text.trim()) return;
  startPipeline();
  queue.push({ text: applyPronunciations(text) });
  drain();
  resetIdle();
}

function sendFlush() {
  queue.push({ flush: true });
  drain();
  resetIdle();
}

async function shutdown() {
  if (ws) {
    if (wsReady) ws.send(JSON.stringify({ type: "Close" }));
    ws.close();
    ws = null;
  }
  if (ffmpeg) {
    if (ffmpeg.stdin && typeof ffmpeg.stdin !== "number") ffmpeg.stdin.end();
    try {
      await ffmpeg.exited;
    } catch {}
    ffmpeg = null;
  }
  await clearPid();
  server.stop();
  process.exit(0);
}

const server = Bun.serve({
  unix: socketPath,
  async fetch(req) {
    if (req.method !== "POST")
      return new Response("Method Not Allowed", { status: 405 });
    const body = (await req.json()) as { text?: string; flush?: boolean };
    if (body.text) sendSentence(body.text);
    if (body.flush) sendFlush();
    return new Response("ok");
  },
});

await writePid(process.pid);
resetIdle();
console.error(`claude-tts: daemon listening on ${socketPath}`);
