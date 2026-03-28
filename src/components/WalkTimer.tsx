import { useState, useEffect, useRef } from 'react';
import { Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalkTimerProps {
  onStop: (durationSeconds: number) => void;
  startTime: Date;
}

const WalkTimer = ({ onStop, startTime }: WalkTimerProps) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number>();

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="glass rounded-2xl p-6 text-center border-2 border-accent/50 animate-pulse-slow">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Clock size={18} className="text-accent" />
        <span className="text-sm font-bold text-accent uppercase tracking-wider">Walk in Progress</span>
      </div>
      <div className="text-5xl font-black tabular-nums tracking-tight text-foreground mb-4">
        {hours > 0 && `${pad(hours)}:`}{pad(minutes)}:{pad(seconds)}
      </div>
      <Button
        onClick={() => onStop(elapsed)}
        size="lg"
        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl h-14 px-10 text-lg font-black gap-2"
      >
        <Square size={20} /> Stop Walk
      </Button>
    </div>
  );
};

export default WalkTimer;
