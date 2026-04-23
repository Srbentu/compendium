import OpenAI from "openai";

const openai = new OpenAI();

export interface TTSOptions {
  text: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed?: number; // 0.25 to 4.0
  model?: "tts-1" | "tts-1-hd";
}

export interface TTSResult {
  audioBuffer: Buffer;
  durationSeconds: number;
}

/**
 * Convert text to speech using OpenAI TTS.
 * Returns audio buffer and estimated duration.
 */
export async function textToSpeech(options: TTSOptions): Promise<TTSResult> {
  const {
    text,
    voice = "nova",
    speed = 1.0,
    model = "tts-1",
  } = options;

  const response = await openai.audio.speech.create({
    model,
    voice,
    speed,
    input: text,
    response_format: "mp3",
  });

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  // Estimate duration: average speech rate ~150 words/min
  // MP3 at 128kbps, so duration ≈ buffer size / (128000 / 8)
  const durationSeconds = Math.ceil(
    (audioBuffer.length / (128000 / 8))
  );

  return {
    audioBuffer,
    durationSeconds,
  };
}

/**
 * Estimate audio duration from text length.
 * Useful for planning before calling TTS.
 */
export function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  // ~150 words per minute = 2.5 words per second
  return Math.ceil(wordCount / 2.5);
}