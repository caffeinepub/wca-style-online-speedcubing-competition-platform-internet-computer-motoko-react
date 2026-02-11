import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { useGetCompetition, useGetMyCompetitionResult, useSubmitAttempt } from '../hooks/useQueries';
import InspectionTimer from '../components/solve/InspectionTimer';
import SolveTimer from '../components/solve/SolveTimer';
import SolveCompletionScreen from '../components/solve/SolveCompletionScreen';
import RequireAuth from '../components/auth/RequireAuth';
import { Loader2 } from 'lucide-react';
import { useBeforeUnloadWarning } from '../hooks/useBeforeUnloadWarning';
import { useNavigationBlocker } from '../hooks/useNavigationBlocker';

type Phase = 'inspection' | 'solving' | 'submitting' | 'next';

export default function SolveFlowPage() {
  const { competitionId } = useParams({ from: '/competition/$competitionId/solve' });
  const { data: competition, isLoading: compLoading } = useGetCompetition(BigInt(competitionId));
  const { data: myResult, isLoading: resultLoading } = useGetMyCompetitionResult(BigInt(competitionId));
  const submitAttempt = useSubmitAttempt();

  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('inspection');
  const [penalty, setPenalty] = useState(0);

  const isInProgress = phase === 'inspection' || phase === 'solving';
  useBeforeUnloadWarning(isInProgress);
  useNavigationBlocker(isInProgress);

  useEffect(() => {
    if (myResult && myResult.status === 'in_progress') {
      const completedAttempts = myResult.attempts.filter((a) => a.time > 0).length;
      setCurrentAttemptIndex(completedAttempts);
    }
  }, [myResult]);

  const handleInspectionComplete = (penaltyMs: number) => {
    setPenalty(penaltyMs);
    setPhase('solving');
  };

  const handleSolveComplete = async (timeMs: number) => {
    setPhase('submitting');
    try {
      await submitAttempt.mutateAsync({
        competitionId: BigInt(competitionId),
        attemptIndex: BigInt(currentAttemptIndex),
        attempt: {
          time: BigInt(timeMs),
          penalty: BigInt(penalty),
        },
      });

      if (currentAttemptIndex < 4) {
        setCurrentAttemptIndex(currentAttemptIndex + 1);
        setPenalty(0);
        setPhase('next');
        setTimeout(() => setPhase('inspection'), 1500);
      } else {
        setPhase('next');
      }
    } catch (error) {
      console.error('Failed to submit attempt:', error);
      setPhase('inspection');
    }
  };

  if (compLoading || resultLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-chart-1 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!competition || !myResult) {
    return (
      <RequireAuth message="You must start the competition first.">
        <div />
      </RequireAuth>
    );
  }

  if (myResult.status === 'completed' || currentAttemptIndex >= 5) {
    return <SolveCompletionScreen competitionId={competitionId} />;
  }

  const currentScramble = competition.scrambles[currentAttemptIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold border-2 transition-all ${
                  idx < currentAttemptIndex
                    ? 'bg-chart-1 border-chart-1 text-white'
                    : idx === currentAttemptIndex
                    ? 'bg-chart-1/20 border-chart-1 text-chart-1 scale-110'
                    : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold">
            Solve {currentAttemptIndex + 1} of 5
          </h2>
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          {phase === 'inspection' && (
            <InspectionTimer scramble={currentScramble} onInspectionComplete={handleInspectionComplete} />
          )}

          {phase === 'solving' && <SolveTimer onComplete={handleSolveComplete} />}

          {phase === 'submitting' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-chart-1" />
              <p className="text-muted-foreground">Submitting solve...</p>
            </div>
          )}

          {phase === 'next' && currentAttemptIndex < 4 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="w-16 h-16 bg-chart-1 rounded-full flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-xl font-bold">Solve Submitted!</p>
              <p className="text-muted-foreground">Preparing next solve...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
