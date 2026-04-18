import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, lang, setLang, dir } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast({ title: t('account_created'), description: t('check_email') });
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err: any) {
      toast({ title: t('oops'), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        {/* Lang switch */}
        <div className="flex justify-end mb-4 gap-1 text-xs font-bold">
          <button
            onClick={() => setLang('en')}
            className={`px-2 py-1 rounded-lg ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >EN</button>
          <button
            onClick={() => setLang('he')}
            className={`px-2 py-1 rounded-lg ${lang === 'he' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >HE</button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/30">
            <PawPrint size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-foreground">Dogo</h1>
          <p className="text-muted-foreground font-bold mt-1">{t('walk_tracking_pro_dogs')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div className="relative">
            <Mail size={18} className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-muted-foreground`} />
            <Input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-12 rounded-xl text-base font-semibold`}
              required
            />
          </div>
          <div className="relative">
            <Lock size={18} className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-muted-foreground`} />
            <Input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-12 rounded-xl text-base font-semibold`}
              required
              minLength={6}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-base font-black"
          >
            {loading ? '...' : isSignUp ? t('create_account') : t('sign_in')}
          </Button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center mt-4 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? t('have_account') : t('no_account')}
        </button>
      </div>
    </div>
  );
};

export default Auth;
