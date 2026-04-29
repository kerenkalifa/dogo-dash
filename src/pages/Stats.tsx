import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Share2, Clock, Calendar as CalendarIcon, Droplets, PawPrint, Trash2, FileDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PresetKey = 'week' | 'month' | 'quarter' | 'year' | 'custom';

const Stats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [dogs, setDogs] = useState<Tables<'dogs'>[]>([]);
  const [walks, setWalks] = useState<Tables<'walks'>[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [walkToDelete, setWalkToDelete] = useState<string | null>(null);

  const [preset, setPreset] = useState<PresetKey>('month');
  const [customFrom, setCustomFrom] = useState<Date | undefined>(startOfMonth(new Date()));
  const [customTo, setCustomTo] = useState<Date | undefined>(endOfMonth(new Date()));

  const { from, to, label } = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case 'week':
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }), label: t('this_week') };
      case 'quarter':
        return { from: startOfQuarter(now), to: endOfQuarter(now), label: `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}` };
      case 'year':
        return { from: startOfYear(now), to: endOfYear(now), label: `${now.getFullYear()}` };
      case 'custom':
        return {
          from: customFrom ?? startOfMonth(now),
          to: customTo ?? endOfMonth(now),
          label: `${format(customFrom ?? now, 'MMM d')} – ${format(customTo ?? now, 'MMM d, yyyy')}`,
        };
      case 'month':
      default:
        return { from: startOfMonth(now), to: endOfMonth(now), label: format(now, 'MMMM yyyy') };
    }
  }, [preset, customFrom, customTo, t]);

  const fetchAll = () => {
    if (!user) return;
    supabase.from('dogs').select('*').order('name').then(({ data }) => { if (data) setDogs(data); });
    supabase
      .from('walks')
      .select('*')
      .gte('date', format(from, 'yyyy-MM-dd'))
      .lte('date', format(to, 'yyyy-MM-dd'))
      .order('date', { ascending: false })
      .then(({ data }) => { if (data) setWalks(data); });
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, from.getTime(), to.getTime()]);

  // Weekly chart data (last 7 days, fixed window)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayWalks = walks.filter(w => w.date === dateStr);
    const totalMin = dayWalks.reduce((s, w) => s + (w.duration || 0), 0) / 60;
    return { day: format(day, 'EEE'), minutes: Math.round(totalMin) };
  });

  const totalMinutes = Math.round(walks.reduce((s, w) => s + (w.duration || 0), 0) / 60);
  const totalWalks = walks.length;
  const totalBathroom = walks.filter(w => w.bathroom_break).length;
  const avgWalk = totalWalks > 0 ? Math.round(totalMinutes / totalWalks) : 0;

  const dogNameById = (id: string) => dogs.find(d => d.id === id)?.name || t('unknown');

  const perDog = useMemo(() => {
    return dogs.map((d) => {
      const dw = walks.filter(w => w.dog_id === d.id);
      return {
        id: d.id,
        name: d.name,
        walks: dw.length,
        minutes: Math.round(dw.reduce((s, w) => s + (w.duration || 0), 0) / 60),
        breaks: dw.filter(w => w.bathroom_break).length,
      };
    }).filter(d => d.walks > 0);
  }, [dogs, walks]);

  const topDog = perDog.slice().sort((a, b) => b.minutes - a.minutes)[0];

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

  const fileBase = `dogo-report-${format(from, 'yyyy-MM-dd')}_to_${format(to, 'yyyy-MM-dd')}`;

  const exportCSV = () => {
    const headers = ['Date', 'Dog', 'Duration (min)', 'Bathroom Break', 'Notes'];
    const rows = walks.map((w) => [
      w.date,
      dogNameById(w.dog_id),
      String(Math.round((w.duration || 0) / 60)),
      w.bathroom_break ? 'Yes' : 'No',
      (w.notes || '').replace(/"/g, '""').replace(/\r?\n/g, ' '),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    // BOM for Excel UTF-8 (Hebrew support)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileBase}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t('export_csv') + ' ✓' });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Dogo Walk Report', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`, 14, 26);

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Summary', 14, 38);
    autoTable(doc, {
      startY: 42,
      head: [['Total Walks', 'Total Minutes', 'Bathroom Breaks', 'Avg Walk (min)', 'Top Dog']],
      body: [[
        String(totalWalks),
        String(totalMinutes),
        String(totalBathroom),
        String(avgWalk),
        topDog ? `${topDog.name} (${topDog.minutes}m)` : '—',
      ]],
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] },
    });

    const afterSummaryY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.text('Per-Dog Breakdown', 14, afterSummaryY);
    autoTable(doc, {
      startY: afterSummaryY + 4,
      head: [['Dog', 'Walks', 'Minutes', 'Breaks']],
      body: perDog.map((d) => [d.name, String(d.walks), String(d.minutes), String(d.breaks)]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
    });

    const afterDogsY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.text('Walks', 14, afterDogsY);
    autoTable(doc, {
      startY: afterDogsY + 4,
      head: [['Date', 'Dog', 'Duration (min)', 'Break', 'Notes']],
      body: walks.map((w) => [
        w.date,
        dogNameById(w.dog_id),
        String(Math.round((w.duration || 0) / 60)),
        w.bathroom_break ? 'Yes' : 'No',
        w.notes || '',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 9 },
    });

    doc.save(`${fileBase}.pdf`);
    toast({ title: t('export_pdf') + ' ✓' });
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-black text-foreground">{t('stats_title')}</h1>
        <Button onClick={() => setShowSummary(true)} variant="outline" className="rounded-xl font-bold gap-2">
          <Share2 size={16} /> {t('share')}
        </Button>
      </div>

      {/* Period Selector */}
      <div className="glass rounded-2xl p-3 mb-4">
        <p className="text-xs font-black text-muted-foreground mb-2">{t('period')}</p>
        <ToggleGroup
          type="single"
          value={preset}
          onValueChange={(v) => v && setPreset(v as PresetKey)}
          className="flex-wrap justify-start gap-2"
        >
          <ToggleGroupItem value="week" className="rounded-xl font-bold text-xs h-8 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('this_week')}</ToggleGroupItem>
          <ToggleGroupItem value="month" className="rounded-xl font-bold text-xs h-8 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('this_month')}</ToggleGroupItem>
          <ToggleGroupItem value="quarter" className="rounded-xl font-bold text-xs h-8 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('this_quarter')}</ToggleGroupItem>
          <ToggleGroupItem value="year" className="rounded-xl font-bold text-xs h-8 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('this_year')}</ToggleGroupItem>
          <ToggleGroupItem value="custom" className="rounded-xl font-bold text-xs h-8 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('custom_range')}</ToggleGroupItem>
        </ToggleGroup>

        {preset === 'custom' && (
          <div className="flex gap-2 mt-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 rounded-xl font-bold text-xs justify-start gap-2">
                  <CalendarIcon size={14} />
                  {customFrom ? format(customFrom, 'MMM d, yyyy') : t('pick_start')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn('p-3 pointer-events-auto')} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 rounded-xl font-bold text-xs justify-start gap-2">
                  <CalendarIcon size={14} />
                  {customTo ? format(customTo, 'MMM d, yyyy') : t('pick_end')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className={cn('p-3 pointer-events-auto')} />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <p className="text-[11px] font-bold text-muted-foreground mt-2">{label}</p>
      </div>

      {/* Overview Tiles */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass rounded-2xl p-4 text-center">
          <Clock size={20} className="mx-auto mb-1 text-primary" />
          <p className="text-2xl font-black text-foreground">{totalMinutes}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('min_label')}</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <CalendarIcon size={20} className="mx-auto mb-1 text-primary" />
          <p className="text-2xl font-black text-foreground">{totalWalks}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('total_walks')}</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Droplets size={20} className="mx-auto mb-1 text-primary" />
          <p className="text-2xl font-black text-foreground">{totalBathroom}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('breaks')}</p>
        </div>
      </div>

      {/* Report Summary + Export */}
      <div className="glass rounded-2xl p-4 mb-6 border-2 border-primary/20">
        <h2 className="font-black text-lg mb-3">{t('report_summary')}</h2>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted rounded-xl p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('avg_walk')}</p>
            <p className="text-lg font-black">{avgWalk}m</p>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('top_dog')}</p>
            <p className="text-lg font-black truncate">{topDog ? topDog.name : '—'}</p>
          </div>
        </div>

        {perDog.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] font-black text-muted-foreground uppercase mb-2">{t('per_dog_breakdown')}</p>
            <div className="space-y-1">
              {perDog.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm font-bold bg-muted/50 rounded-lg px-3 py-1.5">
                  <span className="truncate">{d.name}</span>
                  <span className="text-muted-foreground text-xs">{d.walks}w · {d.minutes}m · {d.breaks}💩</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={exportCSV} disabled={walks.length === 0} className="flex-1 rounded-xl font-black gap-2">
            <FileDown size={16} /> {t('export_csv')}
          </Button>
          <Button onClick={exportPDF} disabled={walks.length === 0} variant="secondary" className="flex-1 rounded-xl font-black gap-2">
            <FileText size={16} /> {t('export_pdf')}
          </Button>
        </div>
      </div>

      {/* Weekly Chart (fixed last-7-days) */}
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
            const engagement = getEngagementLabel(notes);

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
                      {engagement}
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

      {/* Walks in selected range */}
      <h2 className="font-black text-lg mb-3">{t('walks_in_range')}</h2>
      {walks.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
          <Clock size={28} className="mx-auto mb-2 opacity-50" />
          <p className="font-bold text-sm">{t('no_walks_range')}</p>
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
          <ShareableSummary dogs={dogs} walks={walks} month={label} />
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
