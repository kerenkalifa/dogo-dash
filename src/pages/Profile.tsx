import { LogOut, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-black text-foreground mb-6">Profile 👤</h1>

      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <User size={28} className="text-primary-foreground" />
          </div>
          <div>
            <p className="font-black text-lg">Dog Walker</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-semibold">
              <Mail size={14} />
              <span className="truncate max-w-[200px]">{user?.email}</span>
            </div>
          </div>
        </div>

        <Button onClick={handleSignOut} variant="destructive" className="w-full h-12 rounded-xl font-black text-base gap-2">
          <LogOut size={18} /> Sign Out
        </Button>
      </div>

      <div className="glass rounded-2xl p-5 text-center">
        <p className="text-4xl mb-2">🐾</p>
        <p className="font-black text-lg">Dogo</p>
        <p className="text-sm text-muted-foreground font-bold">Walk tracking for pros</p>
        <p className="text-xs text-muted-foreground mt-2">v1.0.0</p>
      </div>
    </div>
  );
};

export default Profile;
