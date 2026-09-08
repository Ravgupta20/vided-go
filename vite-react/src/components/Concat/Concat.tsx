import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Clapperboard, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PlaybackControls from '@/components/FilterPreview/PlaybackControls';
import { useEDLPlayer } from '@/hooks/useEDLPlayer';
import { useFfmpegExport } from '@/hooks/useFfmpegExport';
import { buildTimeline, type EDLSegment, type EDLSource } from '@/types/edl';
import { clipColorFor } from '@/lib/clipColors';
import SegmentList from './SegmentList';
import TimelineStrip from './TimelineStrip';

const DEFAULT_TRANSITION_PAD_SECONDS = 5;

export default function Concat() {
  const [sources, setSources] = useState<EDLSource[]>([]);
  const [segments, setSegments] = useState<EDLSegment[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(0);

  const [transitionMode, setTransitionMode] = useState(false);
  const [transitionIndex, setTransitionIndex] = useState(0);
  const [transitionPad, setTransitionPad] = useState(DEFAULT_TRANSITION_PAD_SECONDS);

  const builderVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  const getVideo = useCallback((sourceId: string) => videoElsRef.current.get(sourceId) ?? null, []);
  const { isPlaying, currentTime, duration, volume, loopRegion, togglePlay, seek, setVolume, setLoopRegion } =
    useEDLPlayer(segments, getVideo, canvasRef);
  const {
    isExporting,
    progress: exportProgress,
    statusText: exportStatus,
    error: exportError,
    downloadUrl: exportDownloadUrl,
    exportConcat,
  } = useFfmpegExport();

  const selectedSource = sources.find((s) => s.id === selectedSourceId) ?? null;

  const timelineForUi = buildTimeline(segments);
  const transitionCount = Math.max(0, timelineForUi.length - 1);
  const clampedTransitionIndex = transitionCount > 0 ? Math.min(transitionIndex, transitionCount - 1) : 0;
  const transitionFromSource = sources.find((s) => s.id === timelineForUi[clampedTransitionIndex]?.sourceId);
  const transitionToSource = sources.find((s) => s.id === timelineForUi[clampedTransitionIndex + 1]?.sourceId);

  // Recompute the loop window whenever transition mode, the chosen cut, the
  // pad width, or the EDL itself changes — passing null hands playback back
  // to the whole timeline from wherever the playhead currently sits.
  useEffect(() => {
    if (!transitionMode) {
      setLoopRegion(null);
      return;
    }
    const tl = buildTimeline(segments);
    if (tl.length < 2) {
      setLoopRegion(null);
      return;
    }
    const idx = Math.min(transitionIndex, tl.length - 2);
    const fromSeg = tl[idx];
    const toSeg = tl[idx + 1];
    const cut = fromSeg.timelineEnd; // === toSeg.timelineStart
    // Clamp each side to its own clip's bounds — a clip shorter than the pad
    // shows in full rather than letting the window spill into its neighbor.
    setLoopRegion({
      start: Math.max(fromSeg.timelineStart, cut - transitionPad),
      end: Math.min(toSeg.timelineEnd, cut + transitionPad),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionMode, transitionIndex, transitionPad, segments]);

  // Picking a new source resets the in/out range to its full length once
  // its duration is known (loadedmetadata fires async on the hidden element).
  useEffect(() => {
    setInPoint(0);
    setOutPoint(selectedSource?.duration ?? 0);
  }, [selectedSourceId]);

  useEffect(() => {
    if (selectedSource && outPoint === 0 && selectedSource.duration > 0) {
      setOutPoint(selectedSource.duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource?.duration]);

  const handleFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const newSources: EDLSource[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      url: URL.createObjectURL(file),
      duration: 0,
    }));
    setSources((prev) => [...prev, ...newSources]);
    setSelectedSourceId((prev) => prev || newSources[0].id);
    e.target.value = '';
  };

  const handleSourceMetadata = (sourceId: string, dur: number, width: number, height: number) => {
    if (!Number.isFinite(dur)) return;
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, duration: dur, width, height } : s)),
    );
  };

  const setInFromPreview = () => {
    const v = builderVideoRef.current;
    if (v) setInPoint(v.currentTime);
  };
  const setOutFromPreview = () => {
    const v = builderVideoRef.current;
    if (v) setOutPoint(v.currentTime);
  };

  const addSegment = () => {
    if (!selectedSource || outPoint <= inPoint) return;
    setSegments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sourceId: selectedSource.id, inPoint, outPoint },
    ]);
  };

  const removeSegment = (id: string) => setSegments((prev) => prev.filter((s) => s.id !== id));

  const moveSegment = (index: number, dir: -1 | 1) => {
    setSegments((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          All tools
        </Link>
        <h1 className="text-lg font-bold font-heading flex items-center gap-2">
          <Clapperboard className="size-5" />
          Multi-Clip Preview
          <span className="text-muted-foreground font-normal text-sm">(no render)</span>
        </h1>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Builds an edit decision list across your source files and plays it back live in the browser —
          the sources are never concatenated into an actual file.
        </p>
      </header>

      <div className="flex flex-1 gap-4 min-h-0">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="relative flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden min-h-0 ring-1 ring-foreground/10">
            <canvas ref={canvasRef} className="max-w-full max-h-full h-auto w-auto" />
            {segments.length === 0 && (
              <div className="absolute flex flex-col items-center gap-2 text-muted-foreground">
                <Clapperboard className="size-8 opacity-50" />
                <p className="text-sm">Add segments to preview the sequence</p>
              </div>
            )}
          </div>

          {segments.length > 0 && (
            <TimelineStrip
              timeline={timelineForUi}
              segments={segments}
              sources={sources}
              duration={duration}
              currentTime={currentTime}
              loopRegion={loopRegion}
              onSeek={seek}
            />
          )}

          {transitionCount > 0 && (
            <div className="flex items-center gap-2 bg-card ring-1 ring-foreground/10 rounded-lg px-3 py-2 text-xs flex-wrap">
              <Button
                variant={transitionMode ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setTransitionMode((v) => !v)}
              >
                {transitionMode ? 'Viewing: transition' : 'Viewing: whole video'}
              </Button>

              {transitionMode && (
                <>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => setTransitionIndex((i) => Math.max(0, i - 1))}
                    disabled={clampedTransitionIndex === 0}
                    aria-label="Previous cut"
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="text-muted-foreground">
                    Cut {clampedTransitionIndex + 1} of {transitionCount}: {transitionFromSource?.name ?? '?'} →{' '}
                    {transitionToSource?.name ?? '?'}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => setTransitionIndex((i) => Math.min(transitionCount - 1, i + 1))}
                    disabled={clampedTransitionIndex === transitionCount - 1}
                    aria-label="Next cut"
                  >
                    <ChevronRight />
                  </Button>
                  <span className="text-muted-foreground ml-2">± pad (s)</span>
                  <Input
                    type="number"
                    step={0.5}
                    min={0.5}
                    value={transitionPad}
                    onChange={(e) => setTransitionPad(Math.max(0.1, Number(e.target.value)))}
                    className="w-16"
                  />
                </>
              )}
            </div>
          )}

          {segments.length > 0 && (
            <PlaybackControls
              isPlaying={isPlaying}
              currentTime={loopRegion ? currentTime - loopRegion.start : currentTime}
              duration={loopRegion ? loopRegion.end - loopRegion.start : duration}
              volume={volume}
              onTogglePlay={togglePlay}
              onSeek={(v) => seek(loopRegion ? loopRegion.start + v : v)}
              onVolumeChange={setVolume}
            />
          )}

          {/* One hidden video per source — the EDL player drives these directly, seeking
              the upcoming segment's element ahead of the cut so switching is gapless. */}
          <div className="hidden">
            {sources.map((s) => (
              <video
                key={s.id}
                ref={(el) => {
                  if (el) videoElsRef.current.set(s.id, el);
                  else videoElsRef.current.delete(s.id);
                }}
                src={s.url}
                muted
                playsInline
                preload="auto"
                onLoadedMetadata={(e) =>
                  handleSourceMetadata(
                    s.id,
                    e.currentTarget.duration,
                    e.currentTarget.videoWidth,
                    e.currentTarget.videoHeight,
                  )
                }
              />
            ))}
          </div>
        </div>

        <aside className="w-96 shrink-0 flex flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Sources</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] text-sm font-medium cursor-pointer transition-all w-fit">
                <Upload className="size-3.5" />
                Add MP4 file(s)
                <input
                  type="file"
                  accept="video/mp4"
                  multiple
                  onChange={handleFilesChange}
                  className="hidden"
                />
              </label>
              {sources.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sources loaded yet.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {sources.map((s) => {
                    const color = clipColorFor(
                      s.id,
                      sources.map((x) => x.id),
                    );
                    return (
                      <li key={s.id} className="text-xs flex items-center gap-2">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: color.bg }}
                        />
                        <span className="truncate flex-1">{s.name}</span>
                        <span className="text-muted-foreground shrink-0 tabular-nums">
                          {s.duration > 0 ? `${s.duration.toFixed(1)}s` : '…'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add segment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                disabled={sources.length === 0}
              >
                <option value="" disabled>
                  Choose a source…
                </option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {selectedSource && (
                <video
                  key={selectedSource.id}
                  ref={builderVideoRef}
                  src={selectedSource.url}
                  controls
                  className="w-full rounded-lg bg-black"
                />
              )}

              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">In (s)</span>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={inPoint}
                      onChange={(e) => setInPoint(Number(e.target.value))}
                    />
                    <Button variant="outline" size="sm" onClick={setInFromPreview} disabled={!selectedSource}>
                      Set
                    </Button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Out (s)</span>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={outPoint}
                      onChange={(e) => setOutPoint(Number(e.target.value))}
                    />
                    <Button variant="outline" size="sm" onClick={setOutFromPreview} disabled={!selectedSource}>
                      Set
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={addSegment} disabled={!selectedSource || outPoint <= inPoint}>
                Add to timeline
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>
                {segments.length} segment{segments.length === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SegmentList segments={segments} sources={sources} onRemove={removeSegment} onMove={moveSegment} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export</CardTitle>
              <CardDescription>Real MP4 render via ffmpeg.wasm — runs entirely in the browser</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                onClick={() => exportConcat(segments, sources)}
                disabled={segments.length === 0 || isExporting}
              >
                <Download />
                {isExporting ? 'Exporting…' : 'Export MP4'}
              </Button>

              {isExporting && (
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-[width]"
                      style={{ width: `${Math.round(exportProgress * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{exportStatus}</span>
                </div>
              )}

              {exportError && <p className="text-xs text-destructive">{exportError}</p>}

              {!isExporting && exportDownloadUrl && (
                <div className="flex flex-col gap-1 bg-secondary/50 rounded-lg px-2.5 py-2">
                  <p className="text-xs font-medium">Export complete</p>
                  <a
                    href={exportDownloadUrl}
                    download="concat-export.mp4"
                    className="text-xs text-primary underline underline-offset-2 w-fit"
                  >
                    Download concat-export.mp4
                  </a>
                  <p className="text-[11px] text-muted-foreground">
                    A download should have started automatically — if you don't see it, use the link above
                    (it stays valid until your next export or you leave the page).
                  </p>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
                First export downloads the ffmpeg engine (~30MB, once per session).
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
