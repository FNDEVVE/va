/**
 * Pronunciation dictionary for difficult words.
 * Maps word (lowercase) → IPA transcription.
 * Applied before sending text to Deepgram.
 *
 * Deepgram inline syntax: \{"word":"...","pronounce":"IPA"\}
 * IPA stress markers (ˈ) must precede vowels, not consonants.
 */
export const pronunciations: Record<string, string> = {
  sätteri: "sɛtəri",

  adr: "eɪ diː ɑr",
  ssot: "ɛs ɛs oʊ tiː",
  zai: "zaɪ",

  vitest: "vaɪ tɛst",
  tstyche: "tiː ɛs taɪtʃ",
  oxlint: "ɑks lɪnt",
  oxfmt: "ɑks fɔmt",
  codegen: "koʊd dʒɛn",
  clob: "klɑb",
  "ast-grep": "æst ɡrɛp",
};
