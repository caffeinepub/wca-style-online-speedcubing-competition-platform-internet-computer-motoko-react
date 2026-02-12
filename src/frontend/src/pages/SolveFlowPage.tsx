import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import RequireAuth from '../components/auth/RequireAuth';
import InspectionTimer from '../components/solve/InspectionTimer';
import SolveTimer from '../components/solve/SolveTimer';
import SolveCompletionScreen from '../components/solve/SolveCompletionScreen';
import {
  useGetCompetition,
  useGetSolveSessionState,
  useGetScrambleForAttempt,
  useSubmitAttempt,
} from '../hooks/useQueries';
import { getSolveSession, clearSolveSession } from '../lib/solveSession';
import { normalizeError } from '../api/errors';
import { useBeforeUnloadWarning } from '../hooks/useBeforeUnloadWarning';
import { useNavigationBlocker } from '../hooks/useNavigationBlocker';
import { Loader2 } from 'lucide-react';
import type { Event } from '../backend';

export default function SolveFlowPage() {
  const navigate = useNavigate();
  const { competitionId, event } = useParams({ strict: false }) as { competitionId: string; event: Event };
  const [sessionToken, setSessionToken] = useState<Uint8Array | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [phase, setPhase] = useState<'inspection' | 'solving' | 'completed'>('inspection');
  const [solveTime, setSolveTime] = useState<number | null>(null);
  const [penalty, setPenalty] = useState(0);

  const { data: competition } = useGetCompetition(BigInt(competitionId));
  const { data: sessionState, isLoading: sessionLoading } = useGetSolveSessionState(
    BigInt(competitionId),
    event
  );
  const { data: scramble, isLoading: scrambleLoading } = useGetScrambleForAttempt(
    BigInt(competitionId),
    event,
    currentAttempt,
    sessionToken
  );
  const submitAttemptMutation = useSubmitAttempt();

  // Session recovery on mount
  useEffect(() => {
    const storedToken = getSolveSession(competitionId, event);
    if (storedToken && storedToken.length > 0) {
      setSessionToken(storedToken);
    } else {
      toast.error('No active session found. Please return to the competition page and start again.');
      navigate({ to: `/competitions/${competitionId}` });
    }
  }, [competitionId, event, navigate]);

  // Restore session state
  useEffect(() => {
    if (sessionState) {
      setCurrentAttempt(Number(sessionState.currentAttempt));
      
      if (sessionState.isCompleted) {
        setPhase('completed');
      } else if (sessionState.inspectionStarted) {
        setPhase('solving');
      } else {
        setPhase('inspection');
      }
    }
  }, [sessionState]);

  // Block navigation and page unload during active session
  const isSessionActive = phase !== 'completed';
  useBeforeUnloadWarning(isSessionActive);
  useNavigationBlocker(isSessionActive);

  const handleInspectionComplete = () => {
    setPhase('solving');
  };

  const handleSolveComplete = (time: number, penaltyValue: number) => {
    setSolveTime(time);
    setPenalty(penaltyValue);
    handleSubmitAttempt(time, penaltyValue);
  };

  const handleSubmitAttempt = async (time: number, penaltyValue: number) => {
    if (!sessionToken) {
      toast.error('Session token missing. Please restart the competition.');
      return;
    }

    try {
      await submitAttemptMutation.mutateAsync({
        competitionId: BigInt(competitionId),
        event,
        attemptIndex: currentAttempt,
        time,
        penalty: penaltyValue,
        sessionToken,
      });

      // Check if all attempts are complete
      if (currentAttempt >= 4) {
        setPhase('completed');
        clearSolveSession(competitionId, event);
      } else {
        // Move to next attempt
        setCurrentAttempt(currentAttempt + 1);
        setPhase('inspection');
        setSolveTime(null);
        setPenalty(0);
      }
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  if (sessionLoading || !sessionToken) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RequireAuth>
    );
  }

  if (!sessionState) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Your session has expired or was not found. Please return to the competition page and start again.
            </p>
            <button
              onClick={() => navigate({ to: `/competitions/${competitionId}` })}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Return to Competition
            </button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (phase === 'completed') {
    return (
      <RequireAuth>
        <SolveCompletionScreen
          competitionId={BigInt(competitionId)}
          event={event}
        />
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">{competition?.name}</h1>
            <p className="text-muted-foreground">
              Attempt {currentAttempt + 1} of 5
            </p>
          </div>

          {phase === 'inspection' && (
            <InspectionTimer
              scramble={scramble || undefined}
              onComplete={handleInspectionComplete}
            />
          )}

          {phase === 'solving' && (
            <SolveTimer
              onComplete={handleSolveComplete}
              isSubmitting={submitAttemptMutation.isPending}
            />
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
