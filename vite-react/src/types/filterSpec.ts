export interface FilterParams {
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  sepia: number;
  blur: number;
  vignette: number;
  temperature: number;
  tintHex: string;
  tintOpacity: number;
}

export interface FilterVariant {
  id: string;
  name: string;
  description: string;
  filters: FilterParams;
}

export interface FilterSpecDocument {
  requestSummary: string;
  variants: FilterVariant[];
}

export const DEFAULT_FILTER_PARAMS: FilterParams = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hueRotate: 0,
  sepia: 0,
  blur: 0,
  vignette: 0,
  temperature: 0,
  tintHex: '#000000',
  tintOpacity: 0,
};

export const DEFAULT_VARIANTS: FilterVariant[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'No adjustments — the source frame as-is',
    filters: { ...DEFAULT_FILTER_PARAMS },
  },
  {
    id: 'moody-cyberpunk',
    name: 'Moody Cyberpunk',
    description: 'High contrast cyan/magenta look with a dark vignette',
    filters: {
      brightness: 0.9,
      contrast: 1.4,
      saturation: 1.3,
      hueRotate: 180,
      sepia: 0,
      blur: 0,
      vignette: 0.6,
      temperature: 0,
      tintHex: '#00ffcc',
      tintOpacity: 0.15,
    },
  },
  {
    id: 'warm-film',
    name: 'Warm Film',
    description: 'Soft, warm, slightly desaturated film look',
    filters: {
      brightness: 1.05,
      contrast: 1.05,
      saturation: 0.85,
      hueRotate: 0,
      sepia: 0.25,
      blur: 0,
      vignette: 0.25,
      temperature: 0.2,
      tintHex: '#ff9900',
      tintOpacity: 0.08,
    },
  },
  {
    id: 'high-contrast-bw',
    name: 'High Contrast B&W',
    description: 'Punchy black and white with deep shadows',
    filters: {
      brightness: 1,
      contrast: 1.6,
      saturation: 0,
      hueRotate: 0,
      sepia: 0,
      blur: 0,
      vignette: 0.35,
      temperature: 0,
      tintHex: '#000000',
      tintOpacity: 0,
    },
  },
];

export const DEFAULT_FILTER_SPEC: FilterSpecDocument = {
  requestSummary: 'Built-in fallback presets',
  variants: DEFAULT_VARIANTS,
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

export function validateFilterParams(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return 'filters must be an object';
  const f = value as Record<string, unknown>;
  const numericKeys: (keyof FilterParams)[] = [
    'brightness', 'contrast', 'saturation', 'hueRotate', 'sepia', 'blur', 'vignette', 'temperature', 'tintOpacity',
  ];
  for (const key of numericKeys) {
    if (!isFiniteNumber(f[key])) return `filters.${key} must be a number`;
  }
  if (!isHexColor(f.tintHex)) return 'filters.tintHex must be a hex color string (e.g. "#00ffcc")';
  return null;
}

export function validateFilterSpec(value: unknown): { error: string | null; spec: FilterSpecDocument | null } {
  if (typeof value !== 'object' || value === null) {
    return { error: 'Root JSON value must be an object', spec: null };
  }
  const doc = value as Record<string, unknown>;
  if (typeof doc.requestSummary !== 'string') {
    return { error: '"requestSummary" must be a string', spec: null };
  }
  if (!Array.isArray(doc.variants) || doc.variants.length === 0) {
    return { error: '"variants" must be a non-empty array', spec: null };
  }

  const variants: FilterVariant[] = [];
  for (let i = 0; i < doc.variants.length; i++) {
    const raw = doc.variants[i];
    if (typeof raw !== 'object' || raw === null) {
      return { error: `variants[${i}] must be an object`, spec: null };
    }
    const v = raw as Record<string, unknown>;
    if (typeof v.id !== 'string' || v.id.length === 0) {
      return { error: `variants[${i}].id must be a non-empty string`, spec: null };
    }
    if (typeof v.name !== 'string' || v.name.length === 0) {
      return { error: `variants[${i}].name must be a non-empty string`, spec: null };
    }
    if (typeof v.description !== 'string') {
      return { error: `variants[${i}].description must be a string`, spec: null };
    }
    const filterError = validateFilterParams(v.filters);
    if (filterError) {
      return { error: `variants[${i}].${filterError}`, spec: null };
    }
    variants.push({
      id: v.id,
      name: v.name,
      description: v.description,
      filters: v.filters as FilterParams,
    });
  }

  return {
    error: null,
    spec: { requestSummary: doc.requestSummary, variants },
  };
}
