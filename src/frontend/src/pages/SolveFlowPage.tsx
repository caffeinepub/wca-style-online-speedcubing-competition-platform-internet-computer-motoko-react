import { useState, useEffect } from 'react';
import { useParams, useSearch } from '@tanstack/react-router';
import { useGetCompetition, useGetUserResult, useSubmitAttempt } from '../hooks/useQueries';
import InspectionTimer from '../components/solve/InspectionTimer';
import SolveTimer from '../components/solve/SolveTimer';
import SolveCompletionScreen from '../components/solve/SolveCompletionScreen';
import RequireAuth from '../components/auth/RequireAuth';
import { Loader2 } from 'lucide-react';
import { useBeforeUnloadWarning } from '../hooks/useBeforeUnloadWarning';
import { useNavigationBlocker } from '../hooks/useNavigationBlocker';
import { Event } from '../backend';
import { DEFAULT_EVENT, EVENT_LABELS } from '../types/domain';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../api/queryKeys';

type Phase = 'inspection' | 'solving' | 'submitting' | 'next';

export default function SolveFlowPage() {
  const { competitionId } = useParams({ from: '/competition/$competitionId/solve' });
  const search = useSearch({ from: '/competition/$competitionId/solve' }) as { event?: Event };
  const selectedEvent = search.event || DEFAULT_EVENT;

  const { data: competition, isLoading: compLoading } = useGetCompetition(BigInt(competitionId));
  const { data: myResult, isLoading: resultLoading } = useGetUserResult(BigInt(competitionId), selectedEvent);
  const submitAttempt = useSubmitAttempt();
  const queryClient = useQueryClient();

  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('inspection');
  const [penalty, setPenalty] = useState(0);

  const isInProgress = phase === 'inspection' || phase === 'solving';
  useBeforeUnloadWarning(isInProgress);
  useNavigationBlocker(isInProgress);

  useEffect(() => {
    if (myResult && myResult.status === 'in_progress') {
      const completedAttempts = myResult.attempts.filter((a) => Number(a.time) > 0).length;
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
        event: selectedEvent,
        attemptIndex: BigInt(currentAttemptIndex),
        attempt: {
          time: BigInt(timeMs),
          penalty: BigInt(penalty),
        },
      });

      // After 5th solve, proactively refetch leaderboard
      if (currentAttemptIndex === 4) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.leaderboard(BigInt(competitionId), selectedEvent),
        });
      }

      if (currentAttemptIndex < 4) {
        setCurrentAttemptIndex(currentAttemptIndex + 1);
        setPenalty(0);
        setPhase('next');
      } else {
        setPhase('next');
      }
    } catch (error) {
      console.error('Failed to submit attempt:', error);
      setPhase('next');
    }
  };

  const handleNextAttempt = () => {
    setPhase('inspection');
  };

  if (compLoading || resultLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-chart-1 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading solve session...</p>
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

  const eventScrambles = competition.scrambles.find(([_, event]) => event === selectedEvent)?.[0] || [];

  if (eventScrambles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Scrambles Available</h2>
          <p className="text-muted-foreground">This event does not have scrambles configured.</p>
        </div>
      </div>
    );
  }

  const isAllComplete = currentAttemptIndex >= 5;

  if (isAllComplete) {
    return <SolveCompletionScreen competitionId={competitionId} event={selectedEvent} />;
  }

  const currentScramble = eventScrambles[currentAttemptIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{competition.name}</h1>
          <p className="text-muted-foreground">
            {EVENT_LABELS[selectedEvent]} - Attempt {currentAttemptIndex + 1} of 5
          </p>
        </div>

        {phase === 'inspection' && (
          <InspectionTimer scramble={currentScramble} onComplete={handleInspectionComplete} />
        )}

        {phase === 'solving' && <SolveTimer onComplete={handleSolveComplete} />}

        {phase === 'submitting' && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-chart-1 mx-auto mb-4" />
              <p className="text-muted-foreground">Submitting your time...</p>
            </div>
          </div>
        )}

        {phase === 'next' && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-20 h-20 bg-chart-1/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Attempt {currentAttemptIndex} Complete!</h2>
              <p className="text-muted-foreground mb-8">
                {currentAttemptIndex < 4
                  ? `Ready for attempt ${currentAttemptIndex + 1}?`
                  : 'All attempts completed!'}
              </p>
              <button
                onClick={handleNextAttempt}
                className="px-8 py-3 bg-chart-1 hover:bg-chart-1/90 text-white font-bold rounded-lg transition-colors"
              >
                {currentAttemptIndex < 4 ? 'Next Attempt' : 'View Results'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
