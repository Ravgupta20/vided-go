import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FilterVariant } from '@/types/filterSpec';

interface VariantSelectorProps {
  variants: FilterVariant[];
  activeId: string;
  onSelect: (variant: FilterVariant) => void;
}

export default function VariantSelector({ variants, activeId, onSelect }: VariantSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Variants</h3>
      <div className="flex flex-col gap-2">
        {variants.map((variant) => {
          const active = variant.id === activeId;
          return (
            <Card
              key={variant.id}
              size="sm"
              onClick={() => onSelect(variant)}
              className={cn(
                'cursor-pointer transition-colors',
                active ? 'ring-primary' : 'hover:ring-foreground/30',
              )}
            >
              <CardHeader>
                <CardTitle className="text-sm">{variant.name}</CardTitle>
                <CardDescription>{variant.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
