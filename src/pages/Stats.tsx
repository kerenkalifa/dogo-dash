import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Share2, Clock, Calendar, Droplets, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ShareableSummary from '@/components/ShareableSummary';
import type { Tables } from '@/integrations/supabase/types';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const Stats = () => {
  const { user } = useAuth();
  const [dogs, setDogs] = useState<Tables<'dogs'>[]>([]);
  const [walks, setWalks] = useState<Tables<'walks'>[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('dogs').select('*').order('name').then(({ data }) => { if (data) setDogs(data); });
    supabase.from('walks').select('*').gte('date', format(startOfMonth(new Date()), 'yyyy-MM-dd')).lte('date', format(endOfMonth(new Date()), 'yyyy-MM-dd')).then(({ data }) => { if (data) setWalks(data); });
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
    if (/energetic|hyper|excited|running|fast/.test(text)) return '⚡ High Energy';
    if (/calm|chill|relax|slow|lazy/.test(text)) return '😌 Chill Vibes';
    if (/happy|joy|fun|play/.test(text)) return '🎉 Happy Month';
    return '🐾 Steady Walker';
  };

  // Weekly goal: unique days walked this week (last 7 days)
  const getWeeklyProgress = (dogId: string) => {
    const uniqueDays = new Set(
      walks.filter(w => w.dog_id === dogId && new Date(w.date) >= subDays(new Date(), 6))
        .map(w => w.date)
    );
    return uniqueDays.size;
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-foreground">Stats 📊</h1>
        <Button onClick={() => setShowSummary(true)} variant="outline" className="rounded-xl font-bold gap-2">
          <Share2 size={16} /> Share
        </Button>
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-2xl p-4 text-center">
          <Clock size={20} className="mx-auto mb-1 text-primary" />
          <p className="text-2xl font-black text-foreground">{totalMonthMinutes}</p>
          <p className="text-[10px] font-bold text-muted-foreground">MIN THIS MONTH</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Calendar size={20} className="mx-auto mb-1 text-primary" />
          <p className="text-2xl font-black text-foreground">{totalMonthWalks}</p>
          <p className="text-[10px] font-bold text-muted-foreground">TOTAL WALKS</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Droplets size={20} className="mx-auto mb-1 text-primary" />
          <p className="text-2xl font-black text-foreground">{totalBathroom}</p>
          <p className="text-[10px] font-bold text-muted-foreground">BREAKS</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="glass rounded-2xl p-4 mb-6">
        <h2 className="font-black text-sm mb-3">Minutes Walked (Last 7 Days)</h2>
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
      <h2 className="font-black text-lg mb-3">Dog Stats</h2>
      {dogs.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
          <PawPrint size={30} className="mx-auto mb-2 opacity-50" />
          <p className="font-bold">No dogs to show stats for</p>
        </div>
      ) : (
        <div className="space-y-3">
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
                  {/* Circular Progress */}
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
                    <p className="text-[10px] font-bold text-muted-foreground">WALKS</p>
                  </div>
                  <div className="bg-muted rounded-xl py-2">
                    <p className="text-lg font-black">{dogMins}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">MIN</p>
                  </div>
                  <div className="bg-muted rounded-xl py-2">
                    <p className="text-lg font-black">{dogBreaks}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">BREAKS</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="rounded-2xl max-w-[400px] mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Monthly Summary 📱</DialogTitle>
            <DialogDescription>Screenshot and share with dog owners!</DialogDescription>
          </DialogHeader>
          <ShareableSummary dogs={dogs} walks={walks} month={format(new Date(), 'MMMM yyyy')} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stats;
