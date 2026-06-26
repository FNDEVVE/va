import { $ } from "bun";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

export const pluginRoot = import.meta.dir;

const stateDir =
  Bun.env.HERDR_PLUGIN_STATE_DIR ??
  Bun.env.XDG_STATE_HOME ??
  join(Bun.env.HOME!, ".local/state");
export const stateFile = join(stateDir, "herdr-plugin-tts", "enabled");

export async function isEnabled(): Promise<boolean> {
  const file = Bun.file(stateFile);
  if (!(await file.exists())) return true;
  return (await file.text()).trim().toLowerCase() === "enabled";
}

export async function setEnabled(on: boolean): Promise<void> {
  await mkdir(dirname(stateFile), { recursive: true });
  await Bun.write(stateFile, on ? "enabled\n" : "disabled\n");
}

export async function toggleEnabled(): Promise<boolean> {
  const next = !(await isEnabled());
  await setEnabled(next);
  return next;
}

const herdrBin = Bun.env.HERDR_BIN_PATH ?? "herdr";

export async function herdr(...args: string[]): Promise<string> {
  return $`${herdrBin} ${args}`.quiet().text();
}

export interface AgentEvent {
  status?: string;
  paneId?: string;
  agent?: string;
}

/**
 * Herdr passes event + context as JSON env vars.
 * Event:  { event, data: { type, pane_id, agent_status, agent } }
 * Context: { focused_pane_id, focused_pane_agent, ... }
 */
export function parseEvent(): AgentEvent {
  const event = readJsonEnv("HERDR_PLUGIN_EVENT_JSON");
  const context = readJsonEnv("HERDR_PLUGIN_CONTEXT_JSON");
  const d = event.data ?? event;

  return {
    status:
      typeof d?.agent_status === "string"
        ? d.agent_status.toLowerCase()
        : undefined,
    paneId: d?.pane_id ?? context.focused_pane_id,
    agent: d?.agent ?? context.focused_pane_agent,
  };
}

function readJsonEnv(name: string): Record<string, any> {
  const raw = Bun.env[name];
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
