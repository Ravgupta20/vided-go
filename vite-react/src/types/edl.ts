export interface EDLSource {
  id: string;
  name: string;
  url: string;
  duration: number;
}

export interface EDLSegment {
  id: string;
  sourceId: string;
  inPoint: number;
  outPoint: number;
}

export interface TimelineSegment extends EDLSegment {
  timelineStart: number;
  timelineEnd: number;
}

// Lays segments end-to-end on a single virtual playhead — this mapping is
// all a scrub/seek needs to find "which segment, and where in it".
export function buildTimeline(segments: EDLSegment[]): TimelineSegment[] {
  let t = 0;
  return segments.map((seg) => {
    const duration = Math.max(0, seg.outPoint - seg.inPoint);
    const item: TimelineSegment = { ...seg, timelineStart: t, timelineEnd: t + duration };
    t += duration;
    return item;
  });
}
