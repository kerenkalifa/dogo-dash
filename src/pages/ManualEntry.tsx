import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

const ManualEntry = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dogs, setDogs] = useState<Tables<'dogs'>[]>([]);
  const [dogId, setDogId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [notes, setNotes] = useState('');
  const [bathroomBreak, setBathroomBreak] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('dogs').select('*').order('name').then(({ data }) => {
        if (data) setDogs(data);
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !dogId) return;

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const duration = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));

    await supabase.from('walks').insert({
      user_id: user.id,
      dog_id: dogId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration,
      date,
      notes: notes || null,
      bathroom_break: bathroomBreak,
    });

    toast({ title: "Walk logged! 📝" });
    navigate('/');
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground font-bold mb-4 hover:text-foreground transition-colors">
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="text-3xl font-black text-foreground mb-6">Log a Walk 📝</h1>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div>
          <Label className="font-bold text-sm mb-1.5 block">Dog *</Label>
          <Select value={dogId} onValueChange={setDogId}>
            <SelectTrigger className="h-12 rounded-xl font-semibold">
              <SelectValue placeholder="Select dog" />
            </SelectTrigger>
            <SelectContent>
              {dogs.map(dog => (
                <SelectItem key={dog.id} value={dog.id}>{dog.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="font-bold text-sm mb-1.5 block">Date</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-12 rounded-xl font-semibold" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="font-bold text-sm mb-1.5 block">Start Time</Label>
            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-12 rounded-xl font-semibold" />
          </div>
          <div>
            <Label className="font-bold text-sm mb-1.5 block">End Time</Label>
            <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-12 rounded-xl font-semibold" />
          </div>
        </div>

        <div>
          <Label className="font-bold text-sm mb-1.5 block">Notes</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How was the walk? Energetic? Calm?" className="rounded-xl font-semibold min-h-[80px]" />
        </div>

        <div className="flex items-center justify-between">
          <Label className="font-bold text-sm">Bathroom Break? 💩</Label>
          <Switch checked={bathroomBreak} onCheckedChange={setBathroomBreak} />
        </div>

        <Button onClick={handleSubmit} disabled={!dogId} className="w-full h-12 rounded-xl font-black text-base">
          Save Walk
        </Button>
      </div>
    </div>
  );
};

export default ManualEntry;
