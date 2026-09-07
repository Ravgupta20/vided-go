import type { MouseEvent } from 'react';
import type { EDLSegment, EDLSource, TimelineSegment } from '@/types/edl';
import { clipColorFor } from '@/lib/clipColors';

interface TimelineStripProps {
  timeline: TimelineSegment[];
  segments: EDLSegment[];
  sources: EDLSource[];
  duration: number;
  currentTime: number;
  loopRegion: { start: number; end: number } | null;
  onSeek: (time: number) => void;
}

export default function TimelineStrip({
  timeline,
  sources,
  duration,
  currentTime,
  loopRegion,
  onSeek,
}: TimelineStripProps) {
  if (timeline.length === 0 || duration <= 0) return null;
  const sourceIds = sources.map((s) => s.id);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(fraction * duration);
  };

  return (
    <div
      className="relative h-9 w-full rounded-lg overflow-hidden ring-1 ring-foreground/10 cursor-pointer select-none flex"
      onClick={handleClick}
    >
      {timeline.map((seg, i) => {
        const source = sources.find((s) => s.id === seg.sourceId);
        const color = clipColorFor(seg.sourceId, sourceIds);
        const widthPct = ((seg.timelineEnd - seg.timelineStart) / duration) * 100;
        return (
          <div
            key={seg.id}
            className="h-full flex items-center justify-center overflow-hidden text-[10px] font-medium text-black/70 whitespace-nowrap px-1"
            style={{
              width: `${widthPct}%`,
              backgroundColor: color.bg,
              borderRight: i < timeline.length - 1 ? '1px solid rgba(0,0,0,0.25)' : undefined,
            }}
            title={source?.name}
          >
            {source?.name}
          </div>
        );
      })}

      {loopRegion && (
        <div
          className="absolute inset-y-0 bg-black/10 ring-2 ring-inset ring-foreground/60 pointer-events-none"
          style={{
            left: `${(loopRegion.start / duration) * 100}%`,
            width: `${((loopRegion.end - loopRegion.start) / duration) * 100}%`,
          }}
        />
      )}

      <div
        className="absolute inset-y-0 w-0.5 bg-foreground pointer-events-none"
        style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
      />
    </div>
  );
}
