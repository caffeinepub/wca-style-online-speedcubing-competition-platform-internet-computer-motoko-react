import { useState, useEffect, useRef } from 'react';
import { Timer, Square, Loader2 } from 'lucide-react';

interface SolveTimerProps {
  onComplete: (time: number, penalty: number) => void;
  onStart?: () => void;
  isSubmitting?: boolean;
}

export default function SolveTimer({ onComplete, onStart, isSubmitting }: SolveTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);

  const startTimer = () => {
    if (isSubmitting) return;
    setIsRunning(true);
    startTimeRef.current = Date.now();
    
    // Notify parent that solve timer has started
    if (onStart) {
      onStart();
    }
    
    intervalRef.current = window.setInterval(() => {
      setTime(Date.now() - startTimeRef.current);
    }, 10);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    onComplete(time, 0); // No penalty for now
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
  };

  if (!isRunning && time === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
        <div className="w-24 h-24 bg-chart-2/10 rounded-full flex items-center justify-center">
          <Timer className="w-12 h-12 text-chart-2" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-3xl font-bold">Ready to Solve</h3>
          <p className="text-muted-foreground">Click the button to start timing your solve</p>
        </div>
        <button
          onClick={startTimer}
          disabled={isSubmitting}
          className="px-12 py-6 bg-chart-2 hover:bg-chart-2/90 text-white font-bold text-xl rounded-xl transition-colors shadow-lg shadow-chart-2/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Timer
        </button>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-12">
        <div className="text-center space-y-6">
          <div className="text-8xl md:text-9xl font-bold tabular-nums text-chart-1">
            {formatTime(time)}
          </div>
          <p className="text-muted-foreground text-lg">Solving...</p>
        </div>
        <button
          onClick={stopTimer}
          disabled={isSubmitting}
          className="px-12 py-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xl rounded-xl transition-colors shadow-lg shadow-destructive/20 flex items-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Square className="w-6 h-6" />
              Stop Timer
            </>
          )}
        </button>
      </div>
    );
  }

  return null;
}
