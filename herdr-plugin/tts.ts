/** Speak text aloud via Deepgram Aura-2 (dg CLI → ffplay). */
export async function speak(text: string): Promise<void> {
  const model = Bun.env.HERDR_TTS_DEEPGRAM_MODEL ?? "aura-2-apollo-en";
  const dg = Bun.env.HERDR_TTS_DG_BIN ?? "dg";
  const player = Bun.env.HERDR_TTS_PLAYER_BIN ?? "ffplay";

  const dgProc = Bun.spawn({
    cmd: [dg, "speak", "-m", model, "--non-interactive"],
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  const playProc = Bun.spawn({
    cmd: [player, "-nodisp", "-autoexit", "-loglevel", "quiet", "-"],
    stdin: dgProc.stdout,
    stdout: "ignore",
    stderr: "pipe",
  });

  dgProc.stdin.write(text);
  dgProc.stdin.end();

  const [dgExit, playExit] = await Promise.all([dgProc.exited, playProc.exited]);

  if (dgExit !== 0) {
    const err = await new Response(dgProc.stderr).text();
    console.error(`agent-tts: dg exited ${dgExit}${err ? `: ${err.trim()}` : ""}`);
  }
  if (playExit !== 0) {
    const err = await new Response(playProc.stderr).text();
    if (err.trim()) console.error(`agent-tts: ffplay exited ${playExit}: ${err.trim()}`);
  }
}
