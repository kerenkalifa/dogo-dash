import { useEffect, useMemo, useRef, useState } from 'react';
import { Square, Clock, Plus, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import CountdownRing from '@/components/CountdownRing';
import WalkOverDialog from '@/components/WalkOverDialog';
import { getSoundSrc, SoundId } from '@/lib/sounds';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface WalkTimerProps {
  startTime: Date;
  plannedDurationSec: number;
  soundId: SoundId;
  dogs: Tables<'dogs'>[];
  onStop: (durationSeconds: number, completedOnTime: boolean) => void;
  onExtend?: (extraSeconds: number) => void;
}

const pad = (n: number) => n.toString().padStart(2, '0');
const fmt = (totalSec: number) => {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

const WalkTimer = ({
  startTime,
  plannedDurationSec,
  soundId,
  dogs,
  onStop,
  onExtend,
}: WalkTimerProps) => {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());
  const [planned, setPlanned] = useState(plannedDurationSec);
  const [completed, setCompleted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => setPlanned(plannedDurationSec), [plannedDurationSec]);

  // Tick
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    const onVis = () => setNow(Date.now());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Wake lock — best-effort
  useEffect(() => {
    const nav: any = navigator;
    const acquire = async () => {
      try {
        if (nav.wakeLock?.request) {
          wakeLockRef.current = await nav.wakeLock.request('screen');
        }
      } catch { /* ignore */ }
    };
    acquire();
    const onVis = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      try { wakeLockRef.current?.release?.(); } catch { /* ignore */ }
      wakeLockRef.current = null;
    };
  }, []);

  const elapsed = Math.max(0, Math.floor((now - startTime.getTime()) / 1000));
  const remaining = Math.max(0, planned - elapsed);
  const progress = planned > 0 ? remaining / planned : 0;
  const warning = remaining <= 5 * 60 && remaining > 0;
  const isOver = remaining === 0;

  // Trigger completion side effects once
  useEffect(() => {
    if (!isOver || completed) return;
    setCompleted(true);

    // Vibrate
    try { navigator.vibrate?.([400, 200, 400, 200, 600]); } catch { /* ignore */ }

    // Sound — loop briefly
    try {
      const a = new Audio(getSoundSrc(soundId));
      a.loop = true;
      a.volume = 1;
      audioRef.current = a;
      void a.play();
      window.setTimeout(() => {
        try { a.pause(); a.currentTime = 0; } catch { /* ignore */ }
      }, 12000);
    } catch { /* ignore */ }

    // Web notification when backgrounded
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(t('walk_over_title'), {
          body: t('walk_over_body'),
          icon: '/icons/icon-192.png',
        });
      }
    } catch { /* ignore */ }
  }, [isOver, completed, soundId, t]);

  const stopAlertSound = () => {
    try { audioRef.current?.pause(); } catch { /* ignore */ }
    audioRef.current = null;
    try { navigator.vibrate?.(0); } catch { /* ignore */ }
  };

  const handleStop = () => {
    stopAlertSound();
    onStop(elapsed, isOver);
  };

  const handleExtend = (sec = 300) => {
    stopAlertSound();
    setCompleted(false);
    setPlanned((p) => p + sec);
    onExtend?.(sec);
  };

  const ringColor = warning ? 'text-warning' : isOver ? 'text-warning' : 'text-primary';

  const dogChips = useMemo(() => dogs, [dogs]);

  return (
    <div
      className={cn(
        'glass rounded-3xl p-6 text-center border-2 transition-colors',
        warning || isOver ? 'border-warning/60' : 'border-primary/40'
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock size={16} className={ringColor} />
        <span className={cn('text-xs font-black uppercase tracking-wider', ringColor)}>
          {t('walk_in_progress')}
        </span>
      </div>

      <div className="flex justify-center mb-4">
        <CountdownRing progress={progress} warning={warning || isOver} size={220} stroke={14}>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {t('remaining')}
            </span>
            <span
              className={cn(
                'text-5xl font-black tabular-nums tracking-tight',
                warning || isOver ? 'text-warning' : 'text-foreground'
              )}
              dir="ltr"
            >
              {fmt(remaining)}
            </span>
            <span className="text-[11px] font-bold text-muted-foreground mt-1" dir="ltr">
              {t('elapsed')} · {fmt(elapsed)}
            </span>
          </div>
        </CountdownRing>
      </div>

      {/* Dog chips */}
      {dogChips.length > 0 && (
        <div className="flex gap-2 justify-center flex-wrap mb-4">
          {dogChips.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/70 border border-secondary"
            >
              <PawPrint size={12} className="text-primary" />
              <span className="text-xs font-black text-secondary-foreground truncate max-w-[100px]">
                {d.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Button
          onClick={handleStop}
          size="lg"
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl h-12 px-6 font-black gap-2"
        >
          <Square size={18} /> {t('stop_walk')}
        </Button>
        <Button
          onClick={() => handleExtend(300)}
          size="lg"
          variant="secondary"
          className="rounded-2xl h-12 px-4 font-black gap-1"
        >
          <Plus size={16} /> {t('add_5_min')}
        </Button>
      </div>

      <WalkOverDialog
        open={isOver && completed}
        onStop={handleStop}
        onExtend={() => handleExtend(300)}
      />
    </div>
  );
};

export default WalkTimer;
