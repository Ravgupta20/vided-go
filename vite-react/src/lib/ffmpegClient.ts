import type { FFmpeg } from '@ffmpeg/ffmpeg';

// Lazily loads a single shared ffmpeg.wasm instance for the session — the
// ~25-30MB core is fetched once and reused across exports rather than
// per-call, and stays out of the main bundle via dynamic import.
let ffmpegPromise: Promise<FFmpeg> | null = null;

export function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}
