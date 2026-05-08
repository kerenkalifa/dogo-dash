import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SOUNDS, SoundId, previewSound } from '@/lib/sounds';
import { useLanguage } from '@/hooks/useLanguage';

interface Props {
  value: SoundId;
  onChange: (id: SoundId) => void;
}

const SoundPicker = ({ value, onChange }: Props) => {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-2">
      {SOUNDS.map((s) => {
        const active = s.id === value;
        return (
          <div
            key={s.id}
            className={cn(
              'flex items-center justify-between rounded-2xl px-3 py-2 border-2 transition-colors',
              active
                ? 'border-primary bg-primary/10'
                : 'border-transparent bg-secondary/40 hover:border-primary/30'
            )}
          >
            <button
              type="button"
              onClick={() => onChange(s.id)}
              className="text-sm font-bold text-foreground flex-1 text-left truncate"
            >
              {t(s.labelKey as any)}
            </button>
            <button
              type="button"
              aria-label="preview"
              onClick={(e) => {
                e.stopPropagation();
                previewSound(s.id);
              }}
              className="w-8 h-8 rounded-full bg-primary/15 hover:bg-primary/30 flex items-center justify-center text-primary"
            >
              <Play size={14} className="ml-0.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SoundPicker;
