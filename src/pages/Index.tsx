import { useState, useEffect } from 'react';
import { Play, Plus, PawPrint, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DogSelector from '@/components/DogSelector';
import WalkTimer from '@/components/WalkTimer';
import type { Tables } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dogs, setDogs] = useState<Tables<'dogs'>[]>([]);
  const [recentWalks, setRecentWalks] = useState<(Tables<'walks'> & { dogs?: Tables<'dogs'> })[]>([]);
  const [showDogPicker, setShowDogPicker] = useState(false);
  const [selectedDogs, setSelectedDogs] = useState<string[]>([]);
  const [activeWalk, setActiveWalk] = useState<{ startTime: Date; dogIds: string[] } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchDogs();
    fetchRecentWalks();
  }, [user]);

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
      toast({ title: "Add a dog first!", description: "Go to the Dogs tab to add your pups.", variant: "destructive" });
      return;
    }
    setSelectedDogs([]);
    setShowDogPicker(true);
  };

  const confirmStartWalk = () => {
    if (selectedDogs.length === 0) {
      toast({ title: "Pick at least one dog! 🐕", variant: "destructive" });
      return;
    }
    setShowDogPicker(false);
    setActiveWalk({ startTime: new Date(), dogIds: selectedDogs });
  };

  const handleStopWalk = async (durationSeconds: number) => {
    if (!activeWalk || !user) return;
    const now = new Date();

    for (const dogId of activeWalk.dogIds) {
      await supabase.from('walks').insert({
        user_id: user.id,
        dog_id: dogId,
        start_time: activeWalk.startTime.toISOString(),
        end_time: now.toISOString(),
        duration: durationSeconds,
        date: format(now, 'yyyy-MM-dd'),
      });
    }

    setActiveWalk(null);
    toast({ title: "Walk saved! 🎉", description: `${Math.floor(durationSeconds / 60)} min walk logged.` });
    fetchRecentWalks();
  };

  const toggleDog = (dogId: string) => {
    setSelectedDogs(prev =>
      prev.includes(dogId) ? prev.filter(id => id !== dogId) : [...prev, dogId]
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">Dogo 🐾</h1>
          <p className="text-sm font-bold text-muted-foreground">Ready to walk?</p>
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
        <WalkTimer startTime={activeWalk.startTime} onStop={handleStopWalk} />
      ) : (
        <button
          onClick={handleStartWalk}
          className="w-full glass rounded-2xl p-8 flex flex-col items-center gap-3 border-2 border-primary/30 hover:border-primary/60 active:scale-[0.98] transition-all duration-200 group mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 group-hover:scale-110 transition-transform">
            <Play size={36} className="text-primary-foreground ml-1" />
          </div>
          <span className="text-xl font-black text-foreground">Start Walk</span>
          <span className="text-sm text-muted-foreground font-bold">Tap to begin tracking</span>
        </button>
      )}

      {/* Recent Walks */}
      <div className="mt-6">
        <h2 className="text-lg font-black text-foreground mb-3">Recent Walks</h2>
        {recentWalks.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
            <Clock size={30} className="mx-auto mb-2 opacity-50" />
            <p className="font-bold">No walks yet</p>
            <p className="text-sm">Start your first walk! 🏃</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentWalks.map((walk) => (
              <div key={walk.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PawPrint size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{(walk as any).dogs?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground font-semibold">{format(new Date(walk.date), 'MMM d, yyyy')}</p>
                </div>
                <span className="text-sm font-black text-primary">{formatDuration(walk.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dog Picker Dialog */}
      <Dialog open={showDogPicker} onOpenChange={setShowDogPicker}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Who's walking? 🐕</DialogTitle>
            <DialogDescription>Select the dogs joining this walk</DialogDescription>
          </DialogHeader>
          <DogSelector dogs={dogs} selected={selectedDogs} onToggle={toggleDog} />
          <Button
            onClick={confirmStartWalk}
            disabled={selectedDogs.length === 0}
            className="w-full h-12 rounded-xl font-black text-base"
          >
            Let's Go! ({selectedDogs.length} selected)
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
