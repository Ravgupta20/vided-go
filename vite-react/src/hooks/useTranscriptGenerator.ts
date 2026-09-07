import { useRef, useState } from 'react';

const VIDED_BASE_URL = 'http://localhost:8000';
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

export type TranscriptStatus =
  | { phase: 'idle' }
  | { phase: 'uploading' }
  | { phase: 'transcribing' }
  | { phase: 'saving' }
  | { phase: 'done'; jsonName: string; assName: string }
  | { phase: 'error'; message: string };

function stemOf(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? filename : filename.slice(0, idx);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// process_queue.py appends "_YYYYMMDD_HHMMSS" before the extension if a
// same-named file already exists in completed/, so match that too.
function matcherFor(stem: string, ext: string): RegExp {
  return new RegExp(`^${escapeRegExp(stem)}(_\\d{8}_\\d{6})?\\.${ext}$`, 'i');
}

async function uploadVideo(file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file, file.name);
  const res = await fetch(`${VIDED_BASE_URL}/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
}

async function listCompletedFiles(): Promise<string[]> {
  const res = await fetch(`${VIDED_BASE_URL}/api/completed`);
  if (!res.ok) throw new Error(`Failed to list completed files: HTTP ${res.status}`);
  const data = await res.json();
  return data.files ?? [];
}

async function fetchCompletedText(filename: string): Promise<string> {
  const res = await fetch(`${VIDED_BASE_URL}/completed-files/${encodeURIComponent(filename)}`);
  if (!res.ok) throw new Error(`Failed to fetch ${filename}: HTTP ${res.status}`);
  return res.text();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Only treats files that appear AFTER upload starts as completion signals —
// otherwise a stale same-named .json/.ass from a previous run would report
// "done" instantly with old content.
async function pollForTranscriptFiles(
  stem: string,
  alreadyCompleted: Set<string>,
): Promise<{ jsonName: string; assName: string }> {
  const jsonPattern = matcherFor(stem, 'json');
  const assPattern = matcherFor(stem, 'ass');
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const files = await listCompletedFiles();
    const newFiles = files.filter((f) => !alreadyCompleted.has(f));
    const jsonName = newFiles.find((f) => jsonPattern.test(f));
    const assName = newFiles.find((f) => assPattern.test(f));
    if (jsonName && assName) return { jsonName, assName };
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error('Timed out waiting for transcription to finish — is Vided running on :8000?');
}

async function writeFile(dirHandle: any, name: string, content: string): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export function useTranscriptGenerator() {
  const [status, setStatus] = useState<TranscriptStatus>({ phase: 'idle' });
  const directoryHandleRef = useRef<any>(null);

  const generate = async (file: File) => {
    try {
      setStatus({ phase: 'uploading' });
      const alreadyCompleted = new Set(await listCompletedFiles());
      await uploadVideo(file);

      setStatus({ phase: 'transcribing' });
      const stem = stemOf(file.name);
      const { jsonName, assName } = await pollForTranscriptFiles(stem, alreadyCompleted);

      setStatus({ phase: 'saving' });
      const [jsonText, assText] = await Promise.all([
        fetchCompletedText(jsonName),
        fetchCompletedText(assName),
      ]);

      if (!directoryHandleRef.current) {
        directoryHandleRef.current = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      }
      const transcriptsDir = await directoryHandleRef.current.getDirectoryHandle('transcripts', {
        create: true,
      });
      await writeFile(transcriptsDir, jsonName, jsonText);
      await writeFile(transcriptsDir, assName, assText);

      setStatus({ phase: 'done', jsonName, assName });
    } catch (err) {
      setStatus({ phase: 'error', message: (err as Error).message });
    }
  };

  return { status, generate };
}
