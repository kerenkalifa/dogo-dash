import { Home, PawPrint, BarChart3, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const tabs = [
    { path: '/', icon: Home, label: t('nav_home') },
    { path: '/dogs', icon: PawPrint, label: t('nav_dogs') },
    { path: '/stats', icon: BarChart3, label: t('nav_stats') },
    { path: '/profile', icon: User, label: t('nav_profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t-2 border-primary/20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-2xl transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground scale-105 shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
