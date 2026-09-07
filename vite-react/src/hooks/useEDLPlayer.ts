import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { buildTimeline, type EDLSegment, type TimelineSegment } from '../types/edl';

// How far ahead of a cut we start seeking the next clip's decoder, so the
// seek-and-decode-to-keyframe latency is hidden behind the tail of the
// current clip instead of stalling the frame right at the cut.
const PRESEEK_LEAD_SECONDS = 0.5;
const SEGMENT_END_EPSILON = 0.03;
const SEEK_EPSILON = 0.05;

// currentTime can't be set reliably before metadata is loaded, so queue the
// seek for 'loadedmetadata' when the element isn't ready yet.
function seekVideo(video: HTMLVideoElement, time: number) {
  const apply = () => {
    try {
      video.currentTime = time;
    } catch {
      // element not ready for this seek yet — nothing to recover from here
    }
  };
  if (video.readyState >= 1) {
    apply();
  } else {
    video.addEventListener('loadedmetadata', apply, { once: true });
  }
}

export function useEDLPlayer(
  segments: EDLSegment[],
  getVideo: (sourceId: string) => HTMLVideoElement | null,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);

  const timelineRef = useRef<TimelineSegment[]>([]);
  const activeIndexRef = useRef(0);
  const preSeekedIndexRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(1);
  const lastReportedRef = useRef(0);
  const rafRef = useRef(0);

  const timeline = buildTimeline(segments);
  const duration = timeline.length > 0 ? timeline[timeline.length - 1].timelineEnd : 0;
  timelineRef.current = timeline;

  const drawFrame = useCallback(
    (video: HTMLVideoElement | null) => {
      const canvas = canvasRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    },
    [canvasRef],
  );

  // Makes `idx` the active segment and lands its video at `targetTime`. The
  // outgoing video is paused (unless it's the same element, e.g. the same
  // source reused later in the EDL) and only the incoming one carries audio.
  const activateSegment = useCallback(
    (idx: number, targetTime: number, opts: { resume: boolean }) => {
      const tl = timelineRef.current;
      if (idx < 0 || idx >= tl.length) return;
      const prevSeg = tl[activeIndexRef.current];
      const seg = tl[idx];
      const prevVideo = prevSeg ? getVideo(prevSeg.sourceId) : null;
      const video = getVideo(seg.sourceId);
      if (prevVideo && prevVideo !== video) prevVideo.pause();

      activeIndexRef.current = idx;
      preSeekedIndexRef.current = null;

      if (!video) return;
      video.muted = false;
      video.volume = volumeRef.current;
      if (Math.abs(video.currentTime - targetTime) > SEEK_EPSILON) {
        seekVideo(video, targetTime);
      }
      if (opts.resume && isPlayingRef.current) {
        video.play().catch(() => {});
      }
    },
    [getVideo],
  );

  // A structurally different EDL (clip added/removed/reordered) invalidates
  // where we were, so drop back to the start rather than guess.
  useEffect(() => {
    preSeekedIndexRef.current = null;
    lastReportedRef.current = 0;
    setCurrentTime(0);
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
    const tl = timelineRef.current;
    activeIndexRef.current = 0;
    const first = tl[0];
    if (first) {
      const video = getVideo(first.sourceId);
      if (video) {
        video.muted = false;
        video.volume = volumeRef.current;
        seekVideo(video, first.inPoint);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  useEffect(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const tl = timelineRef.current;
      if (tl.length === 0) return;

      const idx = activeIndexRef.current;
      const seg = tl[idx];
      const video = getVideo(seg.sourceId);
      if (!video) return;

      if (isPlayingRef.current) {
        const globalTime = seg.timelineStart + Math.max(0, video.currentTime - seg.inPoint);
        if (Math.abs(globalTime - lastReportedRef.current) > 0.03) {
          lastReportedRef.current = globalTime;
          setCurrentTime(globalTime);
        }

        const nextIdx = idx + 1;
        if (nextIdx < tl.length) {
          const remaining = seg.outPoint - video.currentTime;
          if (remaining <= PRESEEK_LEAD_SECONDS && preSeekedIndexRef.current !== nextIdx) {
            preSeekedIndexRef.current = nextIdx;
            const nextSeg = tl[nextIdx];
            const nextVideo = getVideo(nextSeg.sourceId);
            if (nextVideo && nextVideo !== video) {
              nextVideo.pause();
              nextVideo.muted = true;
              seekVideo(nextVideo, nextSeg.inPoint);
            }
          }
        }

        if (video.currentTime >= seg.outPoint - SEGMENT_END_EPSILON) {
          if (nextIdx < tl.length) {
            activateSegment(nextIdx, tl[nextIdx].inPoint, { resume: true });
          } else {
            video.pause();
            isPlayingRef.current = false;
            setIsPlaying(false);
          }
        }
      }

      drawFrame(video);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [getVideo, activateSegment, drawFrame]);

  const togglePlay = useCallback(() => {
    const tl = timelineRef.current;
    if (tl.length === 0) return;
    const seg = tl[activeIndexRef.current];
    const video = getVideo(seg.sourceId);
    if (!video) return;
    if (isPlayingRef.current) {
      video.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      video.play().catch(() => {});
    }
  }, [getVideo]);

  const seek = useCallback(
    (time: number) => {
      const tl = timelineRef.current;
      if (tl.length === 0) return;
      const clamped = Math.min(Math.max(time, 0), tl[tl.length - 1].timelineEnd);
      let idx = tl.findIndex((s) => clamped >= s.timelineStart && clamped < s.timelineEnd);
      if (idx === -1) idx = tl.length - 1;
      const seg = tl[idx];
      const offset = clamped - seg.timelineStart;

      activateSegment(idx, seg.inPoint + offset, { resume: false });

      lastReportedRef.current = clamped;
      setCurrentTime(clamped);

      if (isPlayingRef.current) {
        const video = getVideo(seg.sourceId);
        video?.play().catch(() => {});
      }
    },
    [activateSegment, getVideo],
  );

  const setVolume = useCallback(
    (v: number) => {
      volumeRef.current = v;
      setVolumeState(v);
      const seg = timelineRef.current[activeIndexRef.current];
      const video = seg ? getVideo(seg.sourceId) : null;
      if (video) video.volume = v;
    },
    [getVideo],
  );

  return { isPlaying, currentTime, duration, volume, togglePlay, seek, setVolume };
}
