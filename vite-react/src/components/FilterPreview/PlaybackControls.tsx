import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

export default function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onSeek,
  onVolumeChange,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-3 w-full bg-card ring-1 ring-foreground/10 rounded-lg px-4 py-3">
      <Button onClick={onTogglePlay} size="lg" className="min-w-16">
        {isPlaying ? 'Pause' : 'Play'}
      </Button>

      <span className="text-muted-foreground text-xs font-mono tabular-nums shrink-0">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <Slider
        min={0}
        max={Number.isFinite(duration) && duration > 0 ? duration : 0}
        step={0.01}
        value={[Number.isFinite(currentTime) ? currentTime : 0]}
        onValueChange={([v]) => onSeek(v)}
        className="flex-1"
      />

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-muted-foreground text-xs">Vol</span>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[volume]}
          onValueChange={([v]) => onVolumeChange(v)}
          className="w-24"
        />
      </div>
    </div>
  );
}
