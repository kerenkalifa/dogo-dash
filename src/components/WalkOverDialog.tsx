import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { PartyPopper } from 'lucide-react';

interface Props {
  open: boolean;
  onStop: () => void;
  onExtend: () => void;
}

const WalkOverDialog = ({ open, onStop, onExtend }: Props) => {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={() => { /* must be dismissed via buttons */ }}>
      <DialogContent
        className="rounded-3xl max-w-sm mx-auto border-2 border-warning/60 [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center animate-ring-pulse">
            <PartyPopper size={40} className="text-warning" />
          </div>
          <DialogTitle className="text-2xl font-black">{t('walk_over_title')}</DialogTitle>
          <DialogDescription className="text-base font-semibold text-foreground/80">
            {t('walk_over_body')}
          </DialogDescription>
          <div className="flex flex-col gap-2 w-full mt-2">
            <Button onClick={onStop} className="w-full h-12 rounded-2xl font-black text-base">
              {t('stop_walk')}
            </Button>
            <Button
              onClick={onExtend}
              variant="secondary"
              className="w-full h-11 rounded-2xl font-bold"
            >
              {t('add_5_min')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalkOverDialog;
