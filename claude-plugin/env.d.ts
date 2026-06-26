declare module "bun" {
  interface Env {
    DEEPGRAM_API_KEY?: string;
    CLAUDE_TTS_MODEL?: string;
    CLAUDE_TTS_VOICE?: string;
    CLAUDE_TTS_SAMPLE_RATE?: string;
    CLAUDE_TTS_IDLE_TIMEOUT?: string;
  }
}
