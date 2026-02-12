import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface InspectionTimerProps {
  scramble?: string;
  onComplete: () => void;
  onStart?: () => void;
}

export default function InspectionTimer({ scramble, onComplete, onStart }: InspectionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [showScramble, setShowScramble] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onComplete]);

  const handleStart = () => {
    setIsRunning(true);
    setShowScramble(true);
    if (onStart) {
      onStart();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl">
      <div className="text-center space-y-4 w-full">
        <h2 className="text-2xl font-semibold">Inspection Phase</h2>
        
        {scramble && (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Scramble</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScramble(!showScramble)}
              >
                {showScramble ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show
                  </>
                )}
              </Button>
            </div>
            {showScramble && (
              <p className="font-mono text-lg break-words">{scramble}</p>
            )}
          </div>
        )}

        {!isRunning ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              You have 15 seconds to inspect the cube before solving.
            </p>
            <Button onClick={handleStart} size="lg" className="w-full">
              Start Inspection
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-8xl font-bold tabular-nums">
              {timeLeft}
            </div>
            <p className="text-muted-foreground">seconds remaining</p>
            <Button onClick={handleSkip} variant="outline" size="lg" className="w-full">
              Skip to Solve
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
