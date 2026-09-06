import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { FilterParams } from '../types/filterSpec';

function cssFilterString(f: FilterParams): string {
  return [
    `brightness(${f.brightness})`,
    `contrast(${f.contrast})`,
    `saturate(${f.saturation})`,
    `hue-rotate(${f.hueRotate}deg)`,
    `sepia(${f.sepia})`,
    `blur(${f.blur}px)`,
  ].join(' ');
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Draws the given <video> onto the given <canvas> every frame via
 * requestAnimationFrame, applying `filters` as a CSS canvas filter plus
 * a temperature overlay, hex tint, and radial vignette — all non-destructive:
 * the source video element/file is never modified or re-encoded.
 */
export function useCanvasFilterRenderer(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  filters: FilterParams,
) {
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;

    const draw = () => {
      rafId = requestAnimationFrame(draw);

      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const f = filtersRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.filter = cssFilterString(f);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.filter = 'none';

      if (f.temperature !== 0) {
        const [r, g, b] = f.temperature > 0 ? [255, 150, 0] : [0, 150, 255];
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = Math.min(Math.abs(f.temperature), 1) * 0.3;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (f.tintOpacity > 0) {
        const [r, g, b] = hexToRgb(f.tintHex);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = Math.min(Math.max(f.tintOpacity, 0), 1);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (f.vignette > 0) {
        const cx = w / 2;
        const cy = h / 2;
        const outerRadius = Math.sqrt(cx * cx + cy * cy);
        const gradient = ctx.createRadialGradient(cx, cy, outerRadius * 0.4, cx, cy, outerRadius);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${Math.min(Math.max(f.vignette, 0), 1)})`);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [videoRef, canvasRef]);
}
