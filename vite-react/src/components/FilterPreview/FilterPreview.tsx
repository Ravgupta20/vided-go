import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useCanvasFilterRenderer } from '@/hooks/useCanvasFilterRenderer';
import { useTranscriptGenerator } from '@/hooks/useTranscriptGenerator';
import {
  DEFAULT_FILTER_SPEC,
  type FilterParams,
  type FilterSpecDocument,
  type FilterVariant,
} from '@/types/filterSpec';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import VariantSelector from './VariantSelector';
import PlaybackControls from './PlaybackControls';

const TRANSCRIPT_STATUS_LABEL: Record<string, string> = {
  uploading: 'Uploading to Vided…',
  transcribing: 'Transcribing (WhisperX)… this can take a few minutes',
  saving: 'Saving .json/.ass into vided-go/transcripts…',
};

export default function FilterPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const { status: transcriptStatus, generate: generateTranscript } = useTranscriptGenerator();

  const [spec] = useState<FilterSpecDocument>(DEFAULT_FILTER_SPEC);
  const [activeVariantId, setActiveVariantId] = useState<string>(DEFAULT_FILTER_SPEC.variants[0].id);
  const [activeFilters, setActiveFilters] = useState<FilterParams>(DEFAULT_FILTER_SPEC.variants[0].filters);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useCanvasFilterRenderer(videoRef, canvasRef, activeFilters);

  // useEffect(() => {
  //   return () => {
  //     if (videoUrl) URL.revokeObjectURL(videoUrl);
  //   };
  // }, [videoUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setVideoName(file.name);
    setVideoFile(file);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleSelectVariant = (variant: FilterVariant) => {
    setActiveVariantId(variant.id);
    setActiveFilters({ ...variant.filters });
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold font-heading">Real-Time Canvas Filter Preview</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={!videoFile || (transcriptStatus.phase !== 'idle' && transcriptStatus.phase !== 'done' && transcriptStatus.phase !== 'error')}
            onClick={() => videoFile && generateTranscript(videoFile)}
          >
            Generate Transcript + Captions
          </Button>
          <label className="inline-flex items-center h-8 px-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] text-sm font-medium cursor-pointer transition-all">
            {videoName ?? 'Choose MP4 file'}
            <input type="file" accept="video/mp4" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </header>

      {transcriptStatus.phase !== 'idle' && (
        <p className="text-xs -mt-2">
          {transcriptStatus.phase === 'error' && (
            <span className="text-destructive">Transcript generation failed: {transcriptStatus.message}</span>
          )}
          {transcriptStatus.phase === 'done' && (
            <span className="text-emerald-500">
              Saved {transcriptStatus.jsonName} and {transcriptStatus.assName} to vided-go/transcripts/
            </span>
          )}
          {transcriptStatus.phase in TRANSCRIPT_STATUS_LABEL && (
            <span className="text-muted-foreground">{TRANSCRIPT_STATUS_LABEL[transcriptStatus.phase]}</span>
          )}
        </p>
      )}

      <div className="flex flex-1 gap-4 min-h-0">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="relative flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden min-h-0 ring-1 ring-foreground/10">
            {/* Real on-screen size (opacity 0, stacked under canvas) — a near-zero-size video gets its decode suspended by the browser same as display:none */}
            <video
              ref={videoRef}
              src={videoUrl ?? undefined}
              className="absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none"
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <canvas ref={canvasRef} className="relative max-w-full max-h-full h-auto w-auto" />
            {!videoUrl && (
              <p className="absolute text-muted-foreground text-sm">Choose an MP4 file to begin</p>
            )}
          </div>

          {videoUrl && (
            <PlaybackControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              onTogglePlay={togglePlay}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
            />
          )}
        </div>

        <aside className="w-80 shrink-0 flex flex-col">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 pr-3">
              <p className="text-xs text-muted-foreground">{spec.requestSummary}</p>
              <VariantSelector
                variants={spec.variants}
                activeId={activeVariantId}
                onSelect={handleSelectVariant}
              />
              <Separator />
              {/* <FilterSliders filters={activeFilters} onChange={setActiveFilters} /> */}
              <Separator />
              {/* <JsonInjector onApply={handleApplyJson} /> */}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
