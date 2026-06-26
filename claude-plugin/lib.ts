import { mkdirSync } from "node:fs";
import { join } from "node:path";

const appDir = join(Bun.env.XDG_STATE_HOME ?? `${Bun.env.HOME}/.local/state`, "claude-tts");

export const stateFile = `${appDir}/enabled`;
export const socketPath = `${appDir}/daemon.sock`;
export const pidFile = `${appDir}/daemon.pid`;

mkdirSync(appDir, { recursive: true });

export async function isEnabled(): Promise<boolean> {
  const file = Bun.file(stateFile);
  if (!(await file.exists())) return true;
  return (await file.text()).trim().toLowerCase() === "enabled";
}

export async function setEnabled(on: boolean): Promise<void> {
  await Bun.write(stateFile, on ? "enabled\n" : "disabled\n");
}

export async function toggleEnabled(): Promise<boolean> {
  const next = !(await isEnabled());
  await setEnabled(next);
  return next;
}

export async function writePid(pid: number): Promise<void> {
  await Bun.write(pidFile, `${pid}\n`);
}

export async function clearPid(): Promise<void> {
  const file = Bun.file(pidFile);
  if (await file.exists()) await file.delete();
}
