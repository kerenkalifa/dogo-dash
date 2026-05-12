import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';

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

  const handleGoogle = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'dogwalker://login-callback',
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_system'); // opens real Safari, not SFSafariViewController
    }
  } catch (err: any) {
    toast({ title: t('oops'), description: err.message, variant: 'destructive' });
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

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold uppercase text-muted-foreground">{t('or')}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleGoogle}
            className="w-full h-12 rounded-xl text-base font-bold gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            {t('continue_with_google')}
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
