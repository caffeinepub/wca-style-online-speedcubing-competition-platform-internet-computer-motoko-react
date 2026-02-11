import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InspectionTimerProps {
  scramble: string;
  onComplete: (penalty: number) => void;
}

export default function InspectionTimer({ scramble, onComplete }: InspectionTimerProps) {
  const [phase, setPhase] = useState<'ready' | 'inspecting' | 'complete'>('ready');
  const [timeLeft, setTimeLeft] = useState(15);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startInspection = () => {
    setPhase('inspecting');
    startTimeRef.current = Date.now();

    intervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, 15 - elapsed);
      setTimeLeft(remaining);

      if (elapsed >= 17) {
        completeInspection();
      }
    }, 50);
  };

  const completeInspection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    let penalty = 0;

    if (elapsed >= 17) {
      penalty = 999999; // DNF
    } else if (elapsed >= 15) {
      penalty = 2000; // +2 seconds in milliseconds
    }

    setPhase('complete');
    onComplete(penalty);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <EyeOff className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Ready for Inspection</h3>
          <p className="text-muted-foreground max-w-md">
            Click the button below to start the 15-second inspection phase. The scramble will be revealed.
          </p>
          <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
            <p>• Inspection: 15 seconds</p>
            <p>• 15-17 seconds: +2 penalty</p>
            <p>• Over 17 seconds: DNF</p>
          </div>
        </div>
        <button
          onClick={startInspection}
          className="px-8 py-4 bg-chart-1 hover:bg-chart-1/90 text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-chart-1/20"
        >
          Start Inspection
        </button>
      </div>
    );
  }

  if (phase === 'inspecting') {
    const isPenalty = timeLeft <= 2;
    const isDNF = timeLeft === 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
        <div className="w-20 h-20 bg-chart-1/10 rounded-full flex items-center justify-center">
          <Eye className="w-10 h-10 text-chart-1" />
        </div>

        <div className="text-center space-y-4">
          <div
            className={`text-7xl font-bold tabular-nums transition-colors ${
              isDNF ? 'text-destructive' : isPenalty ? 'text-chart-4' : 'text-chart-1'
            }`}
          >
            {timeLeft.toFixed(1)}
          </div>
          {isPenalty && !isDNF && <p className="text-chart-4 font-medium">+2 Penalty Zone</p>}
          {isDNF && <p className="text-destructive font-medium">DNF - Over 17 seconds</p>}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full">
          <p className="text-sm text-muted-foreground mb-2 text-center">Scramble:</p>
          <p className="text-lg font-mono text-center leading-relaxed">{scramble}</p>
        </div>

        <button
          onClick={completeInspection}
          className="px-8 py-4 bg-chart-2 hover:bg-chart-2/90 text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-chart-2/20"
        >
          Start Solve
        </button>
      </div>
    );
  }

  return null;
}
