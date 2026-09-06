import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { validateFilterSpec, type FilterSpecDocument } from '@/types/filterSpec';

interface JsonInjectorProps {
  onApply: (spec: FilterSpecDocument) => void;
}

const PLACEHOLDER = `{
  "requestSummary": "String describing the style",
  "variants": [
    {
      "id": "variant-1",
      "name": "Moody Cyberpunk",
      "description": "High contrast cyan/magenta look with a dark vignette",
      "filters": {
        "brightness": 1.0,
        "contrast": 1.4,
        "saturation": 0.8,
        "hueRotate": 180,
        "sepia": 0.0,
        "blur": 0,
        "vignette": 0.6,
        "temperature": 0.0,
        "tintHex": "#00ffcc",
        "tintOpacity": 0.15
      }
    }
  ]
}`;

export default function JsonInjector({ onApply }: JsonInjectorProps) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleApply = () => {
    setSuccess(false);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`);
      return;
    }

    const { error: validationError, spec } = validateFilterSpec(parsed);
    if (validationError || !spec) {
      setError(validationError ?? 'Unknown validation error');
      return;
    }

    setError(null);
    setSuccess(true);
    onApply(spec);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {open ? '▾' : '▸'} AI JSON Injector
      </button>

      {open && (
        <div className="flex flex-col gap-2 bg-card ring-1 ring-foreground/10 rounded-lg p-3">
          <Textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setSuccess(false);
            }}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            rows={10}
            className="font-mono text-xs resize-y"
          />
          <Button
            onClick={handleApply}
            disabled={raw.trim().length === 0}
            variant="secondary"
            className="self-start"
          >
            Apply Custom AI JSON
          </Button>
          {error && <p className="text-xs text-destructive whitespace-pre-wrap">{error}</p>}
          {success && <p className="text-xs text-emerald-500">Applied — variants updated below.</p>}
        </div>
      )}
    </div>
  );
}
