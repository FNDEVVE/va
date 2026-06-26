import { setEnabled, stateFile, toggleEnabled } from "./lib";

const arg = process.argv[2]?.trim().toLowerCase();

const on =
  arg === "on" || arg === "enable" ? true :
  arg === "off" || arg === "disable" ? false :
  await toggleEnabled();

if (arg !== undefined) await setEnabled(on);

console.log(`TTS ${on ? "enabled" : "disabled"}.`);
console.log(`State: ${stateFile}`);
