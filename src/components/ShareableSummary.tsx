import { PawPrint, Clock, Calendar, Droplets } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { useLanguage } from '@/hooks/useLanguage';

interface ShareableSummaryProps {
  dogs: Tables<'dogs'>[];
  walks: Tables<'walks'>[];
  month: string;
}

const ShareableSummary = ({ dogs, walks, month }: ShareableSummaryProps) => {
  const { t } = useLanguage();
  const totalMinutes = walks.reduce((sum, w) => sum + (w.duration || 0), 0) / 60;
  const totalWalks = walks.length;
  const bathroomBreaks = walks.filter(w => w.bathroom_break).length;

  const getEngagementLabel = (notes: string[]) => {
    const text = notes.join(' ').toLowerCase();
    if (/energetic|hyper|excited|running|fast|אנרגטי|מתרוצץ/.test(text)) return t('high_energy');
    if (/calm|chill|relax|slow|lazy|רגוע|איטי/.test(text)) return t('chill_vibes');
    if (/happy|joy|fun|play|שמח|כיף/.test(text)) return t('happy_month');
    return t('steady_walker');
  };

  return (
    <div
      id="shareable-summary"
      className="w-[360px] mx-auto rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, hsl(258 90% 66%), hsl(258 90% 45%), hsl(270 60% 30%))',
      }}
    >
      <div className="p-6 text-white">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-3">
            <PawPrint size={16} />
            <span className="font-black text-sm">DOGO</span>
          </div>
          <h2 className="text-2xl font-black">{month} {t('summary')}</h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/15 rounded-2xl p-3 text-center backdrop-blur-sm">
            <Clock size={18} className="mx-auto mb-1" />
            <p className="text-2xl font-black">{Math.round(totalMinutes)}</p>
            <p className="text-[10px] font-bold opacity-80">{t('pdf_minutes').toUpperCase()}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center backdrop-blur-sm">
            <Calendar size={18} className="mx-auto mb-1" />
            <p className="text-2xl font-black">{totalWalks}</p>
            <p className="text-[10px] font-bold opacity-80">{t('walks_label')}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center backdrop-blur-sm">
            <Droplets size={18} className="mx-auto mb-1" />
            <p className="text-2xl font-black">{bathroomBreaks}</p>
            <p className="text-[10px] font-bold opacity-80">{t('breaks')}</p>
          </div>
        </div>

        {/* Per Dog */}
        {dogs.map((dog) => {
          const dogWalks = walks.filter(w => w.dog_id === dog.id);
          const dogMins = dogWalks.reduce((s, w) => s + (w.duration || 0), 0) / 60;
          const notes = dogWalks.map(w => w.notes).filter(Boolean) as string[];
          const label = getEngagementLabel(notes);

          return (
            <div key={dog.id} className="bg-white/10 rounded-2xl p-4 mb-3 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-black text-lg">{dog.name}</p>
                  {dog.breed && <p className="text-xs opacity-70">{dog.breed}</p>}
                </div>
                <span className="text-sm bg-secondary/20 rounded-full px-3 py-1 font-bold" style={{ color: 'hsl(50 97% 76%)' }}>
                  {label}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <span>{dogWalks.length} {t('walks_word')}</span>
                <span>{Math.round(dogMins)} {t('minutes_word')}</span>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div className="text-center mt-4 opacity-60 text-xs font-bold">
          {t('generated_with')}
        </div>
      </div>
    </div>
  );
};

export default ShareableSummary;
