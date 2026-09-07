import { Button } from '@/components/ui/button';
import type { EDLSegment, EDLSource } from '@/types/edl';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface SegmentListProps {
  segments: EDLSegment[];
  sources: EDLSource[];
  onRemove: (id: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}

export default function SegmentList({ segments, sources, onRemove, onMove }: SegmentListProps) {
  if (segments.length === 0) {
    return <p className="text-xs text-muted-foreground">No segments yet — pick a source below and add one.</p>;
  }

  return (
    <ol className="flex flex-col gap-1.5">
      {segments.map((seg, i) => {
        const source = sources.find((s) => s.id === seg.sourceId);
        return (
          <li
            key={seg.id}
            className="flex items-center gap-2 bg-card ring-1 ring-foreground/10 rounded-lg px-3 py-2 text-xs"
          >
            <span className="text-muted-foreground w-5 shrink-0 tabular-nums">{i + 1}</span>
            <span className="font-medium truncate flex-1 min-w-0">{source?.name ?? 'Unknown source'}</span>
            <span className="text-muted-foreground font-mono tabular-nums shrink-0">
              {formatTime(seg.inPoint)}–{formatTime(seg.outPoint)}
            </span>
            <Button variant="ghost" size="icon-xs" onClick={() => onMove(i, -1)} disabled={i === 0}>
              ↑
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onMove(i, 1)}
              disabled={i === segments.length - 1}
            >
              ↓
            </Button>
            <Button variant="destructive" size="icon-xs" onClick={() => onRemove(seg.id)}>
              ×
            </Button>
          </li>
        );
      })}
    </ol>
  );
}
