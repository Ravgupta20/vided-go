import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { FilterParams } from '@/types/filterSpec';

interface SliderDef {
  key: keyof FilterParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderDef[] = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 2, step: 0.01 },
  { key: 'contrast', label: 'Contrast', min: 0, max: 2, step: 0.01 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 2, step: 0.01 },
  { key: 'hueRotate', label: 'Hue Rotate', min: 0, max: 360, step: 1 },
  { key: 'sepia', label: 'Sepia', min: 0, max: 1, step: 0.01 },
  { key: 'blur', label: 'Blur (px)', min: 0, max: 20, step: 0.5 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 1, step: 0.01 },
  { key: 'temperature', label: 'Temperature', min: -1, max: 1, step: 0.01 },
  { key: 'tintOpacity', label: 'Tint Opacity', min: 0, max: 1, step: 0.01 },
];

interface FilterSlidersProps {
  filters: FilterParams;
  onChange: (next: FilterParams) => void;
}

export default function FilterSliders({ filters, onChange }: FilterSlidersProps) {
  const setField = <K extends keyof FilterParams>(key: K, value: FilterParams[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Fine-tune</h3>

      {SLIDERS.map(({ key, label, min, max, step }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-foreground">
            <Label>{label}</Label>
            <span className="font-mono tabular-nums text-muted-foreground">
              {Number(filters[key]).toFixed(2)}
            </span>
          </div>
          <Slider
            min={min}
            max={max}
            step={step}
            value={[Number(filters[key])]}
            onValueChange={([v]) => setField(key, v as FilterParams[typeof key])}
          />
        </div>
      ))}

      <div className="flex items-center justify-between text-xs mt-1">
        <Label>Tint Color</Label>
        <input
          type="color"
          value={filters.tintHex}
          onChange={(e) => setField('tintHex', e.target.value)}
          className="w-10 h-7 rounded-md border border-input bg-transparent cursor-pointer"
        />
      </div>
    </div>
  );
}
