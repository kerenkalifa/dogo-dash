import { useState, useEffect } from 'react';
import { Plus, PawPrint, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { useLanguage } from '@/hooks/useLanguage';

const Dogs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [dogs, setDogs] = useState<Tables<'dogs'>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDog, setEditingDog] = useState<Tables<'dogs'> | null>(null);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (user) fetchDogs();
  }, [user]);

  const fetchDogs = async () => {
    const { data } = await supabase.from('dogs').select('*').order('name');
    if (data) setDogs(data);
  };

  const openAdd = () => {
    setEditingDog(null);
    setName('');
    setBreed('');
    setImageUrl('');
    setShowForm(true);
  };

  const openEdit = (dog: Tables<'dogs'>) => {
    setEditingDog(dog);
    setName(dog.name);
    setBreed(dog.breed || '');
    setImageUrl(dog.image_url || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) return;

    if (editingDog) {
      await supabase.from('dogs').update({ name, breed: breed || null, image_url: imageUrl || null }).eq('id', editingDog.id);
      toast({ title: t('dog_updated') });
    } else {
      await supabase.from('dogs').insert({ user_id: user.id, name, breed: breed || null, image_url: imageUrl || null });
      toast({ title: t('dog_added') });
    }
    setShowForm(false);
    fetchDogs();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('dogs').delete().eq('id', id);
    toast({ title: t('dog_removed') });
    fetchDogs();
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-foreground">{t('my_dogs')}</h1>
        <Button onClick={openAdd} size="icon" className="rounded-xl h-10 w-10">
          <Plus size={20} />
        </Button>
      </div>

      {dogs.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <PawPrint size={48} className="mx-auto mb-3 text-primary opacity-60" />
          <p className="font-black text-lg">{t('no_dogs')}</p>
          <p className="text-sm text-muted-foreground font-bold mb-4">{t('add_first_pup')}</p>
          <Button onClick={openAdd} className="rounded-xl font-bold">
            <Plus size={16} /> {t('add_dog')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {dogs.map((dog) => (
            <div key={dog.id} className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                {dog.image_url ? (
                  <img src={dog.image_url} alt={dog.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🐕</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg truncate">{dog.name}</p>
                {dog.breed && <p className="text-sm text-muted-foreground font-semibold">{dog.breed}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(dog)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Pencil size={16} className="text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(dog.id)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors">
                  <Trash2 size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editingDog ? t('edit_dog') : t('add_dog')} 🐾</DialogTitle>
            <DialogDescription>{editingDog ? t('edit_dog_desc') : t('add_dog_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder={t('name_required')} value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl font-semibold" />
            <Input placeholder={t('breed_optional')} value={breed} onChange={e => setBreed(e.target.value)} className="h-12 rounded-xl font-semibold" />
            <Input placeholder={t('image_url_optional')} value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="h-12 rounded-xl font-semibold" />
            <Button onClick={handleSave} disabled={!name.trim()} className="w-full h-12 rounded-xl font-black text-base">
              {editingDog ? t('save_changes') : t('add_dog')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dogs;
