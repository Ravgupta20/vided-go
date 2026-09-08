import { useCallback, useEffect, useRef, useState } from 'react';
import { getFFmpeg } from '@/lib/ffmpegClient';
import type { EDLSegment, EDLSource } from '@/types/edl';

// HTMLVideoElement never exposes source fps, so it isn't discoverable
// without ffprobing the file — a fixed output fps sidesteps that.
const TARGET_FPS = 30;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

function evenize(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2);
}

export function useFfmpegExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const stepRef = useRef({ completed: 0, total: 1 });
  const downloadUrlRef = useRef<string | null>(null);

  // Revoke whatever blob URL is currently held — on unmount, or right before
  // a new export replaces it with a fresh one.
  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  const exportConcat = useCallback(async (segments: EDLSegment[], sources: EDLSource[]) => {
    if (segments.length === 0) return;
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setIsExporting(true);
    setError(null);
    setProgress(0);
    setDownloadUrl(null);

    const runId = crypto.randomUUID().replace(/-/g, '');
    const writtenFiles: string[] = [];

    try {
      const ffmpeg = await getFFmpeg();

      const onProgress = ({ progress: p }: { progress: number }) => {
        const clamped = Math.min(1, Math.max(0, p));
        const { completed, total } = stepRef.current;
        setProgress((completed + clamped) / total);
      };
      ffmpeg.on('progress', onProgress);

      try {
        stepRef.current = { completed: 0, total: segments.length + 1 };

        // Write each unique source's bytes once, even if reused across segments.
        setStatusText('Loading source clips…');
        const writtenSourceIds = new Set<string>();
        for (const seg of segments) {
          if (writtenSourceIds.has(seg.sourceId)) continue;
          const source = sources.find((s) => s.id === seg.sourceId);
          if (!source) throw new Error(`Missing source for segment ${seg.id}`);
          const { fetchFile } = await import('@ffmpeg/util');
          const data = await fetchFile(source.url);
          const filename = `src_${seg.sourceId}.mp4`;
          await ffmpeg.writeFile(filename, data);
          writtenFiles.push(filename);
          writtenSourceIds.add(seg.sourceId);
        }

        const firstSource = sources.find((s) => s.id === segments[0].sourceId);
        const width = evenize(firstSource?.width ?? DEFAULT_WIDTH);
        const height = evenize(firstSource?.height ?? DEFAULT_HEIGHT);

        const segFilenames: string[] = [];
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          setStatusText(`Trimming clip ${i + 1} of ${segments.length}…`);
          const segFilename = `${runId}_seg_${i}.mp4`;
          const duration = seg.outPoint - seg.inPoint;
          await ffmpeg.exec([
            '-ss', String(seg.inPoint),
            '-i', `src_${seg.sourceId}.mp4`,
            '-t', String(duration),
            '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=${TARGET_FPS}`,
            '-map', '0:v:0', '-map', '0:a:0',
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-ar', '48000', '-ac', '2',
            segFilename,
          ]);
          segFilenames.push(segFilename);
          writtenFiles.push(segFilename);
          stepRef.current = { completed: i + 1, total: segments.length + 1 };
        }

        setStatusText('Joining clips…');
        const listFilename = `${runId}_concat_list.txt`;
        const listContent = segFilenames.map((f) => `file '${f}'`).join('\n');
        await ffmpeg.writeFile(listFilename, new TextEncoder().encode(listContent));
        writtenFiles.push(listFilename);

        const outputFilename = `${runId}_output.mp4`;
        await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', listFilename, '-c', 'copy', outputFilename]);
        writtenFiles.push(outputFilename);
        stepRef.current = { completed: segments.length + 1, total: segments.length + 1 };
        setProgress(1);

        setStatusText('Preparing download…');
        const data = await ffmpeg.readFile(outputFilename);
        const blob = new Blob([data as unknown as BlobPart], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        downloadUrlRef.current = url;
        setDownloadUrl(url);

        // Best-effort auto-download for convenience — the URL is kept alive
        // (not revoked here) so the persistent link in the UI always works
        // even if the browser silently blocked or redirected this click.
        const a = document.createElement('a');
        a.href = url;
        a.download = 'concat-export.mp4';
        a.click();

        setStatusText('Done');
      } finally {
        ffmpeg.off('progress', onProgress);
        for (const filename of writtenFiles) {
          try {
            await ffmpeg.deleteFile(filename);
          } catch {
            // best-effort cleanup — a missing file here doesn't affect correctness
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, progress, statusText, error, downloadUrl, exportConcat };
}
