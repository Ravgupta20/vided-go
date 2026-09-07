// Stable per-source color coding for the EDL editor — same palette a
// timeline in a real NLE uses so a clip is visually identifiable across the
// source list, segment list, and timeline strip without reading its name.
const CLIP_COLORS = [
  { bg: 'oklch(0.75 0.15 25)', ring: 'oklch(0.55 0.18 25)' }, // red
  { bg: 'oklch(0.78 0.14 145)', ring: 'oklch(0.58 0.16 145)' }, // green
  { bg: 'oklch(0.75 0.14 250)', ring: 'oklch(0.55 0.17 250)' }, // blue
  { bg: 'oklch(0.82 0.15 95)', ring: 'oklch(0.62 0.16 95)' }, // yellow
  { bg: 'oklch(0.78 0.14 320)', ring: 'oklch(0.58 0.17 320)' }, // magenta
  { bg: 'oklch(0.78 0.13 200)', ring: 'oklch(0.58 0.15 200)' }, // cyan
  { bg: 'oklch(0.78 0.14 60)', ring: 'oklch(0.58 0.16 60)' }, // orange
  { bg: 'oklch(0.75 0.16 350)', ring: 'oklch(0.55 0.18 350)' }, // pink
];

export function clipColorFor(sourceId: string, sourceIds: string[]) {
  const idx = sourceIds.indexOf(sourceId);
  return CLIP_COLORS[(idx < 0 ? 0 : idx) % CLIP_COLORS.length];
}
