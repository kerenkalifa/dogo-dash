import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Share2, Clock, Calendar, Droplets, PawPrint, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import ShareableSummary from '@/components/ShareableSummary';
import type { Tables } from '@/integrations/supabase/types';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useLanguage } from '@/hooks/useLanguage';

const Stats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [dogs, setDogs] = useState<Tables<'dogs'>[]>([]);
  const [walks, setWalks] = useState<Tables<'walks'>[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [walkToDelete, setWalkToDelete] = useState<string | null>(null);

  const fetchAll = () => {
    if (!user) return;
    supabase.from('dogs').select('*').order('name').then(({ data }) => { if (data) setDogs(data); });
    supabase.from('walks').select('*').gte('date', format(startOfMonth(new Date()), 'yyyy-MM-dd')).lte('date', format(endOfMonth(new Date()), 'yyyy-MM-dd')).order('date', { ascending: false }).then(({ data }) => { if (data) setWalks(data); });
  };

  useEffect(() => {
    fetchAll();
  }, [user]);

  // Weekly chart data (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayWalks = walks.filter(w => w.date === dateStr);
    const totalMin = dayWalks.reduce((s, w) => s + (w.duration || 0), 0) / 60;
    return { day: format(day, 'EEE'), minutes: Math.round(totalMin) };
  });

  const totalMonthMinutes = Math.round(walks.reduce((s, w) => s + (w.duration || 0), 0) / 60);
  const totalMonthWalks = walks.length;
  const totalBathroom = walks.filter(w => w.bathroom_break).length;

  const getEngagementLabel = (notes: string[]) => {
    const text = notes.join(' ').toLowerCase();
    if (/energetic|hyper|excited|running|fast|אנרגטי|מתרוצץ/.test(text)) return t('high_energy');
    if (/calm|chill|relax|slow|lazy|רגוע|איטי/.test(text)) return t('chill_vibes');
    if (/happy|joy|fun|play|שמח|כיף/.test(text)) return t('happy_month');
    return t('steady_walker');
  };

  const getWeeklyProgress = (dogId: string) => {
    const uniqueDays = new Set(
      walks.filter(w => w.dog_id === dogId && new Date(w.date) >= subDays(new Date(), 6))
        .map(w => w.date)
    );
    return uniqueDays.size;
  };

  const dogNameById = (id: string) => dogs.find(d => d.id === id)?.name || t('unknown');

  const confirmDelete = async () => {
    if (!walkToDelete) return;
    await supabase.from('walks').delete().eq('id', walkToDelete);
    setWalkToDelete(null);
    toast({ title: t('walk_deleted') });
    fetchAll();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-foreground">{t('stats_title')}</h1>
        <Button onClick={() => setShowSummary(true)} variant="outline" className="rounded-xl font-bold gap-2">
          <Share2 size={16} /> {t('share')}
        </Button>
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-2xl p-4 text-center">
          <Clock size={20} className="mx-auto mb-1 text-primary" />
          <p className="text-2xl font-black text-foreground">{totalMonthMinutes}</p>
          <p className="text-[10px] font-bold text-muted-foreground">{t('min_this_month')}</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Calendar size={20} className="mx-auto mb-1 text-primary" />
          <p className="text-2xl font-black text-foreground">{totalMonthWalks}</p>
          <p className="text-[10px] font-bold text-muted-foreground">{t('total_walks')}</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Droplets size={20} className="mx-auto mb-1 text-primary" />
          <p className="text-2xl font-black text-foreground">{totalBathroom}</p>
          <p className="text-[10px] font-bold text-muted-foreground">{t('breaks')}</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="glass rounded-2xl p-4 mb-6">
        <h2 className="font-black text-sm mb-3">{t('minutes_last_7')}</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 700 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11, fontWeight: 700 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '2px solid hsl(var(--border))',
                borderRadius: '12px',
                fontWeight: 700,
              }}
            />
            <Bar dataKey="minutes" fill="hsl(258, 90%, 66%)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per Dog Cards */}
      <h2 className="font-black text-lg mb-3">{t('dog_stats')}</h2>
      {dogs.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
          <PawPrint size={30} className="mx-auto mb-2 opacity-50" />
          <p className="font-bold">{t('no_dog_stats')}</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {dogs.map((dog) => {
            const dogWalks = walks.filter(w => w.dog_id === dog.id);
            const dogMins = Math.round(dogWalks.reduce((s, w) => s + (w.duration || 0), 0) / 60);
            const dogBreaks = dogWalks.filter(w => w.bathroom_break).length;
            const weeklyDays = getWeeklyProgress(dog.id);
            const progress = (weeklyDays / 7) * 100;
            const notes = dogWalks.map(w => w.notes).filter(Boolean) as string[];
            const label = getEngagementLabel(notes);

            return (
              <div key={dog.id} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(258, 90%, 66%)"
                        strokeWidth="3"
                        strokeDasharray={`${progress}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black">
                      {weeklyDays}/7
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="font-black text-lg">{dog.name}</p>
                    <span className="text-xs font-bold bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                      {label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted rounded-xl py-2">
                    <p className="text-lg font-black">{dogWalks.length}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{t('walks_label')}</p>
                  </div>
                  <div className="bg-muted rounded-xl py-2">
                    <p className="text-lg font-black">{dogMins}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{t('min_label')}</p>
                  </div>
                  <div className="bg-muted rounded-xl py-2">
                    <p className="text-lg font-black">{dogBreaks}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{t('breaks')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* This Month's Walks (with delete) */}
      <h2 className="font-black text-lg mb-3">{t('this_month_walks')}</h2>
      {walks.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
          <Clock size={28} className="mx-auto mb-2 opacity-50" />
          <p className="font-bold text-sm">{t('no_walks')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {walks.map((walk) => (
            <div key={walk.id} className="glass rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <PawPrint size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{dogNameById(walk.dog_id)}</p>
                <p className="text-xs text-muted-foreground font-semibold">
                  {format(new Date(walk.date), 'MMM d, yyyy')}
                  {walk.bathroom_break && ' · 💩'}
                </p>
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

      {/* Share Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="rounded-2xl max-w-[400px] mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{t('monthly_summary')}</DialogTitle>
            <DialogDescription>{t('monthly_summary_desc')}</DialogDescription>
          </DialogHeader>
          <ShareableSummary dogs={dogs} walks={walks} month={format(new Date(), 'MMMM yyyy')} />
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
              onClick={confirmDelete}
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

export default Stats;
