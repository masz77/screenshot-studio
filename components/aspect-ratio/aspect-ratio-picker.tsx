import { aspectRatios } from '@/lib/constants/aspect-ratios';
import { useImageStore } from '@/lib/store';

interface AspectRatioPickerProps {
  onSelect?: () => void;
}

export const AspectRatioPicker = ({ onSelect }: AspectRatioPickerProps = {} as AspectRatioPickerProps) => {
  const { selectedAspectRatio, setAspectRatio } = useImageStore();

  const handleSelect = (id: string) => {
    setAspectRatio(id);
    onSelect?.();
  };

  // Calculate visual shape dimensions for preview
  const getShapeDimensions = (width: number, height: number) => {
    const maxW = 50;
    const maxH = 50;
    const ratio = width / height;

    let w: number, h: number;
    if (ratio >= 1) {
      w = maxW;
      h = maxW / ratio;
    } else {
      h = maxH;
      w = maxH * ratio;
    }
    return { w: Math.max(w, 14), h: Math.max(h, 14) };
  };

  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold text-foreground mb-3">Aspect ratios</h3>
      <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {aspectRatios.map((ar) => {
          const isSelected = selectedAspectRatio === ar.id;
          const { w, h } = getShapeDimensions(ar.width, ar.height);

          return (
            <button
              key={ar.id}
              onClick={() => handleSelect(ar.id)}
              className={`flex flex-col items-center justify-between rounded-lg p-2 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-primary/10 ring-2 ring-primary ring-offset-0'
                  : 'hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center justify-center h-[54px]">
                <div
                  className={`border-2 transition-colors ${
                    isSelected ? 'border-primary' : 'border-muted-foreground/40'
                  }`}
                  style={{ width: `${w}px`, height: `${h}px` }}
                />
              </div>
              <span className="text-xs text-muted-foreground leading-tight text-center mt-1 line-clamp-2">
                {ar.width}:{ar.height} {ar.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
