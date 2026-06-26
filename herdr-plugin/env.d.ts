declare module "bun" {
  interface Env {
    HERDR_TTS_DEEPGRAM_MODEL?: string;
    HERDR_TTS_DG_BIN?: string;
    HERDR_TTS_PLAYER_BIN?: string;
    HERDR_TTS_LINES?: string;
    HERDR_TTS_MAX_CHARS?: string;
    HERDR_BIN_PATH?: string;
    HERDR_PLUGIN_STATE_DIR?: string;
    HERDR_PLUGIN_EVENT_JSON?: string;
    HERDR_PLUGIN_CONTEXT_JSON?: string;
  }
}
