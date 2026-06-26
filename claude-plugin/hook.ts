import { readFileSync } from "node:fs";
import { isEnabled, pidFile, socketPath } from "./lib";
import { stripMarkdown } from "./markdown";

const input = JSON.parse(await Bun.stdin.text()) as {
  delta?: string;
  final?: boolean;
};

if (!(await isEnabled())) process.exit(0);
if (!input.delta && !input.final) process.exit(0);

if (!daemonAliveSync()) startDaemon();

const text = stripMarkdown(input.delta ?? "");
const body = { ...(text && { text }), ...(input.final && { flush: true }) };

if (Object.keys(body).length) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await fetch("http://localhost/", { unix: socketPath, method: "POST", body: JSON.stringify(body) });
      break;
    } catch {
      // Daemon just started — socket not ready yet
      await Bun.sleep(50);
    }
  }
}

process.exit(0);

function daemonAliveSync(): boolean {
  try {
    const pid = Number(readFileSync(pidFile, "utf8").trim());
    return pid > 0 && (process.kill(pid, 0), true);
  } catch {
    return false;
  }
}

function startDaemon(): void {
  Bun.spawn({
    cmd: ["bun", `${import.meta.dir}/daemon.ts`],
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    detached: true,
  }).unref();
}
