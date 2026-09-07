import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clipColorFor } from '@/lib/clipColors';
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
    return (
      <p className="text-xs text-muted-foreground border border-dashed border-input rounded-lg px-3 py-4 text-center">
        No segments yet — pick a source below and add one.
      </p>
    );
  }

  const sourceIds = sources.map((s) => s.id);

  return (
    <ol className="flex flex-col gap-1.5">
      {segments.map((seg, i) => {
        const source = sources.find((s) => s.id === seg.sourceId);
        const color = clipColorFor(seg.sourceId, sourceIds);
        return (
          <li
            key={seg.id}
            className="flex items-stretch gap-2 bg-card ring-1 ring-foreground/10 rounded-lg overflow-hidden text-xs"
          >
            <div className="w-1 shrink-0" style={{ backgroundColor: color.bg }} />
            <div className="flex items-center gap-2 flex-1 min-w-0 py-2 pr-2">
              <span className="text-muted-foreground w-4 shrink-0 tabular-nums">{i + 1}</span>
              <span className="font-medium truncate flex-1 min-w-0">{source?.name ?? 'Unknown source'}</span>
              <span className="text-muted-foreground font-mono tabular-nums shrink-0">
                {formatTime(seg.inPoint)}–{formatTime(seg.outPoint)}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onMove(i, -1)}
                disabled={i === 0}
                aria-label="Move segment earlier"
              >
                <ChevronUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onMove(i, 1)}
                disabled={i === segments.length - 1}
                aria-label="Move segment later"
              >
                <ChevronDown />
              </Button>
              <Button
                variant="destructive"
                size="icon-xs"
                onClick={() => onRemove(seg.id)}
                aria-label="Remove segment"
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
