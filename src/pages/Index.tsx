import { useState, useEffect, useMemo } from 'react';
import { Play, Plus, PawPrint, Clock, Trash2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DogSelector from '@/components/DogSelector';
import WalkTimer from '@/components/WalkTimer';
import SoundPicker from '@/components/SoundPicker';
import type { Tables } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useLanguage } from '@/hooks/useLanguage';
import { enUS, he } from 'date-fns/locale';
import { SoundId } from '@/lib/sounds';
import { cn } from '@/lib/utils';
import {
  ensureNotifPermission,
  scheduleWalkOverNotification,
  cancelWalkOverNotification,
} from '@/lib/nativeNotifications';

const DURATION_PRESETS = [15, 30, 45, 60];
const ACTIVE_KEY = 'dogo:active-walk';
const SOUND_KEY = 'dogo:sound-id';

type ActiveWalk = {
  startTime: string;
  dogIds: string[];
  plannedDurationSec: number;
  soundId: SoundId;
};

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const locale = lang === 'he' ? he : enUS;
  const [dogs, setDogs] = useState<Tables<'dogs'>[]>([]);
  const [recentWalks, setRecentWalks] = useState<(Tables<'walks'> & { dogs?: Tables<'dogs'> })[]>([]);
  const [showDogPicker, setShowDogPicker] = useState(false);
  const [selectedDogs, setSelectedDogs] = useState<string[]>([]);
  const [activeWalk, setActiveWalk] = useState<ActiveWalk | null>(null);
  const [walkToDelete, setWalkToDelete] = useState<string | null>(null);

  const [durationMin, setDurationMin] = useState<number>(30);
  const [customMin, setCustomMin] = useState<string>('');
  const [soundId, setSoundId] = useState<SoundId>(() => {
    const stored = localStorage.getItem(SOUND_KEY) as SoundId | null;
    return stored ?? 'chime';
  });

  // Restore active walk from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ActiveWalk;
      if (parsed?.startTime && parsed?.plannedDurationSec) {
        setActiveWalk(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchDogs();
    fetchRecentWalks();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, soundId);
  }, [soundId]);

  const fetchDogs = async () => {
    const { data } = await supabase.from('dogs').select('*').order('name');
    if (data) setDogs(data);
  };

  const fetchRecentWalks = async () => {
    const { data } = await supabase
      .from('walks')
      .select('*, dogs(*)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setRecentWalks(data as any);
  };

  const handleStartWalk = () => {
    if (dogs.length === 0) {
      toast({ title: t('add_dog_first'), description: t('add_dog_first_desc'), variant: 'destructive' });
      return;
    }
    setSelectedDogs([]);
    setShowDogPicker(true);
  };

  const requestNotifPermission = async () => {
    await ensureNotifPermission();
  };

  const effectiveDurationMin = useMemo(() => {
    const c = parseInt(customMin, 10);
    if (!Number.isNaN(c) && c > 0) return c;
    return durationMin;
  }, [customMin, durationMin]);

  const confirmStartWalk = async () => {
    if (selectedDogs.length === 0) {
      toast({ title: t('pick_dog'), variant: 'destructive' });
      return;
    }
    if (effectiveDurationMin <= 0) return;
    await requestNotifPermission();
    setShowDogPicker(false);
    const next: ActiveWalk = {
      startTime: new Date().toISOString(),
      dogIds: selectedDogs,
      plannedDurationSec: effectiveDurationMin * 60,
      soundId,
    };
    setActiveWalk(next);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(next));
    await scheduleWalkOverNotification({
      fireAt: new Date(Date.now() + next.plannedDurationSec * 1000),
      title: t('walk_over_title'),
      body: t('walk_over_body'),
      soundId: next.soundId,
    });
  };

  const handleStopWalk = async (durationSeconds: number, completedOnTime: boolean) => {
    if (!activeWalk || !user) return;
    const startISO = activeWalk.startTime;
    const now = new Date();

    for (const dogId of activeWalk.dogIds) {
      await supabase.from('walks').insert({
        user_id: user.id,
        dog_id: dogId,
        start_time: startISO,
        end_time: now.toISOString(),
        duration: durationSeconds,
        date: format(now, 'yyyy-MM-dd'),
        planned_duration: activeWalk.plannedDurationSec,
        completed_on_time: completedOnTime,
        dogs_count: activeWalk.dogIds.length,
      });
    }

    setActiveWalk(null);
    localStorage.removeItem(ACTIVE_KEY);
    toast({ title: t('walk_saved'), description: `${Math.floor(durationSeconds / 60)} ${t('min_walk_logged')}` });
    fetchRecentWalks();
  };

  const handleExtendWalk = (extraSec: number) => {
    if (!activeWalk) return;
    const next: ActiveWalk = {
      ...activeWalk,
      plannedDurationSec: activeWalk.plannedDurationSec + extraSec,
    };
    setActiveWalk(next);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(next));
  };

  const confirmDeleteWalk = async () => {
    if (!walkToDelete) return;
    await supabase.from('walks').delete().eq('id', walkToDelete);
    setWalkToDelete(null);
    toast({ title: t('walk_deleted') });
    fetchRecentWalks();
  };

  const toggleDog = (dogId: string) => {
    setSelectedDogs((prev) =>
      prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const activeDogs = useMemo(
    () => (activeWalk ? dogs.filter((d) => activeWalk.dogIds.includes(d.id)) : []),
    [activeWalk, dogs]
  );

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t('home_title')}</h1>
          <p className="text-sm font-bold text-muted-foreground">{t('home_subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/manual-entry')}
          className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <Plus size={20} className="text-secondary-foreground" />
        </button>
      </div>

      {/* Active Walk or Start Button */}
      {activeWalk ? (
        <WalkTimer
          startTime={new Date(activeWalk.startTime)}
          plannedDurationSec={activeWalk.plannedDurationSec}
          soundId={activeWalk.soundId}
          dogs={activeDogs}
          onStop={handleStopWalk}
          onExtend={handleExtendWalk}
        />
      ) : (
        <button
          onClick={handleStartWalk}
          className="w-full glass rounded-2xl p-8 flex flex-col items-center gap-3 border-2 border-primary/30 hover:border-primary/60 active:scale-[0.98] transition-all duration-200 group mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 group-hover:scale-110 transition-transform">
            <Play size={36} className="text-primary-foreground ml-1" />
          </div>
          <span className="text-xl font-black text-foreground">{t('start_walk')}</span>
          <span className="text-sm text-muted-foreground font-bold">{t('start_walk_hint')}</span>
        </button>
      )}

      {/* Recent Walks */}
      <div className="mt-6">
        <h2 className="text-lg font-black text-foreground mb-3">{t('recent_walks')}</h2>
        {recentWalks.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
            <Clock size={30} className="mx-auto mb-2 opacity-50" />
            <p className="font-bold">{t('no_walks')}</p>
            <p className="text-sm">{t('no_walks_hint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentWalks.map((walk) => (
              <div key={walk.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PawPrint size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{(walk as any).dogs?.name || t('unknown')}</p>
                  <p className="text-xs text-muted-foreground font-semibold">{format(new Date(walk.date), 'MMM d, yyyy', { locale })}</p>
                </div>
                <span className="text-sm font-black text-primary">{formatDuration(walk.duration)}</span>
                <button
                  onClick={() => setWalkToDelete(walk.id)}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors"
                  aria-label={t('delete')}
                >
                  <Trash2 size={14} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dog Picker Dialog */}
      <Dialog open={showDogPicker} onOpenChange={setShowDogPicker}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{t('whos_walking')}</DialogTitle>
            <DialogDescription>{t('pick_dogs_desc')}</DialogDescription>
          </DialogHeader>
          <DogSelector dogs={dogs} selected={selectedDogs} onToggle={toggleDog} />

          {/* Duration */}
          <div className="mt-1">
            <h3 className="text-sm font-black text-foreground mb-2">{t('pick_duration')}</h3>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((m) => {
                const active = !customMin && durationMin === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setDurationMin(m); setCustomMin(''); }}
                    className={cn(
                      'px-4 h-10 rounded-full font-black text-sm border-2 transition-all',
                      active
                        ? 'bg-primary text-primary-foreground border-primary scale-[1.02]'
                        : 'bg-secondary/50 border-transparent text-foreground hover:border-primary/40'
                    )}
                  >
                    {m} {t('minutes_short')}
                  </button>
                );
              })}
              <div
                className={cn(
                  'flex items-center gap-1 px-2 h-10 rounded-full border-2',
                  customMin
                    ? 'bg-primary/10 border-primary'
                    : 'bg-secondary/50 border-transparent'
                )}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={300}
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={t('custom_min')}
                  className="h-7 w-16 px-2 text-sm font-bold border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span className="text-xs font-bold text-muted-foreground pr-1">{t('minutes_short')}</span>
              </div>
            </div>
          </div>

          {/* Sound */}
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={14} className="text-primary" />
              <h3 className="text-sm font-black text-foreground">{t('notification_sound')}</h3>
            </div>
            <SoundPicker value={soundId} onChange={setSoundId} />
            <p className="text-[11px] text-muted-foreground font-semibold mt-2 leading-snug">
              {t('keep_app_open_hint')}
            </p>
          </div>

          <Button
            onClick={confirmStartWalk}
            disabled={selectedDogs.length === 0 || effectiveDurationMin <= 0}
            className="w-full h-12 rounded-2xl font-black text-base mt-2"
          >
            {t('lets_go')} · {effectiveDurationMin} {t('minutes_short')} ({selectedDogs.length} {t('selected')})
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!walkToDelete} onOpenChange={(open) => !open && setWalkToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">{t('delete_walk_q')}</AlertDialogTitle>
            <AlertDialogDescription>{t('delete_walk_desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWalk}
              className="rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
