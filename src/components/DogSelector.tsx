import { PawPrint, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import { useLanguage } from '@/hooks/useLanguage';

interface DogSelectorProps {
  dogs: Tables<'dogs'>[];
  selected: string[];
  onToggle: (dogId: string) => void;
}

const DogSelector = ({ dogs, selected, onToggle }: DogSelectorProps) => {
  const { t } = useLanguage();
  if (dogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <PawPrint size={40} className="mx-auto mb-2 opacity-50" />
        <p className="font-bold">{t('no_dogs')}</p>
        <p className="text-sm">{t('add_dog_first_desc')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {dogs.map((dog) => {
        const isSelected = selected.includes(dog.id);
        return (
          <button
            key={dog.id}
            onClick={() => onToggle(dog.id)}
            className={cn(
              "glass rounded-2xl p-4 text-left transition-all duration-200 border-2",
              isSelected
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-transparent hover:border-primary/30"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}>
                {isSelected ? <Check size={20} /> : '🐕'}
              </div>
              <div>
                <p className="font-bold text-sm">{dog.name}</p>
                {dog.breed && <p className="text-xs text-muted-foreground">{dog.breed}</p>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default DogSelector;
