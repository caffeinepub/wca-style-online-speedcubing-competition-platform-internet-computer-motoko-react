import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import RequireAuth from '../components/auth/RequireAuth';
import InspectionTimer from '../components/solve/InspectionTimer';
import SolveTimer from '../components/solve/SolveTimer';
import SolveCompletionScreen from '../components/solve/SolveCompletionScreen';
import { 
  useGetCompetition, 
  useGetScrambleForAttempt, 
  useStartCompetition,
} from '../hooks/useQueries';
import { getSolveSession, clearSolveSession, storeSolveSession } from '../lib/solveSession';
import { normalizeError } from '../api/errors';
import { EVENT_LABELS } from '../types/domain';
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Event } from '../backend';

type SolvePhase = 'inspection' | 'solving' | 'completed';

interface AttemptData {
  time: number;
  penalty: number;
}

export default function SolveFlowPage() {
  const navigate = useNavigate();
  const { competitionId, event } = useParams({ strict: false }) as {
    competitionId: string;
    event: Event;
  };

  const [phase, setPhase] = useState<SolvePhase>('inspection');
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [sessionToken, setSessionToken] = useState<Uint8Array | null>(null);
  const [inspectionStartTime, setInspectionStartTime] = useState<number | null>(null);
  const [inspectionPenalty, setInspectionPenalty] = useState<number>(0);
  const [sessionSynced, setSessionSynced] = useState(false);
  const [wasRefreshRecovery, setWasRefreshRecovery] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  const { data: competition, isLoading: competitionLoading } = useGetCompetition(BigInt(competitionId));
  const { data: scramble, isLoading: scrambleLoading, error: scrambleError } = useGetScrambleForAttempt(
    BigInt(competitionId),
    event,
    currentAttempt
  );
  const startCompetitionMutation = useStartCompetition();

  // Sync session state on mount
  useEffect(() => {
    const syncSession = async () => {
      const session = getSolveSession(competitionId, event);
      if (!session) {
        toast.error('No active session found. Please start from the competition page.');
        navigate({ to: `/competitions/${competitionId}` });
        return;
      }

      try {
        // Call backend to get or resume session
        const newSessionToken = await startCompetitionMutation.mutateAsync({
          competitionId: BigInt(competitionId),
          event,
        });

        // Store the session token
        storeSolveSession(competitionId, event, newSessionToken);
        setSessionToken(newSessionToken);
        
        // Check if this is a refresh recovery scenario
        // The backend auto-advances on refresh, so if we have stored attempts
        // but the backend returns a new token, we need to detect this
        const storedAttempts = session.attempts || [];
        if (storedAttempts.length > 0) {
          // This is a refresh recovery - backend has already marked previous attempt as DNF
          setWasRefreshRecovery(true);
          const markedAttempt = storedAttempts.length; // 0-indexed, so length is the next attempt
          const nextAttempt = markedAttempt + 1;
          setRecoveryMessage(
            `Attempt ${markedAttempt} was marked DNF because the page was refreshed. Continuing with attempt ${nextAttempt}.`
          );
          setCurrentAttempt(markedAttempt); // Backend has already advanced
          setAttempts(storedAttempts);
        }
        
        setSessionSynced(true);
      } catch (error) {
        const errorMsg = normalizeError(error);
        
        // Handle "resuming existing session" case
        if (errorMsg.includes('Resuming your existing session')) {
          // This is expected - just continue
          const session = getSolveSession(competitionId, event);
          if (session?.token) {
            setSessionToken(session.token);
            setCurrentAttempt(session.attempts?.length || 0);
            setAttempts(session.attempts || []);
            setSessionSynced(true);
            return;
          }
        }
        
        toast.error(errorMsg);
        navigate({ to: `/competitions/${competitionId}` });
      }
    };

    if (!sessionSynced) {
      syncSession();
    }
  }, [competitionId, event, navigate, sessionSynced, startCompetitionMutation]);

  const handleInspectionComplete = useCallback(() => {
    setPhase('solving');
  }, []);

  const handleInspectionStart = useCallback(() => {
    setInspectionStartTime(Date.now());
  }, []);

  const handleSolveStart = useCallback(() => {
    // Calculate inspection penalty when solve timer starts
    let penalty = 0;
    
    if (inspectionStartTime) {
      const solveStartTime = Date.now();
      const inspectionDuration = solveStartTime - inspectionStartTime;
      
      // WCA Rule: 15-17 seconds = +2 penalty
      if (inspectionDuration >= 15000 && inspectionDuration < 17000) {
        penalty = 2000; // Add 2 seconds
        toast.info('Inspection time exceeded 15s: +2 penalty applied');
      }
      // WCA Rule: >= 17 seconds = DNF
      else if (inspectionDuration >= 17000) {
        penalty = 999999; // DNF marker
        toast.error('Inspection time exceeded 17s: DNF applied');
      }
    }
    
    setInspectionPenalty(penalty);
  }, [inspectionStartTime]);

  const handleSolveComplete = useCallback(async (time: number, penalty: number) => {
    // Apply the inspection penalty
    const finalPenalty = penalty + inspectionPenalty;

    // Update local state immediately
    const newAttempts = [...attempts, { time, penalty: finalPenalty }];
    setAttempts(newAttempts);
    
    // Store in session storage for refresh recovery
    const session = getSolveSession(competitionId, event);
    if (session) {
      storeSolveSession(competitionId, event, sessionToken!, newAttempts);
    }

    // Check if we've completed all 5 attempts
    if (newAttempts.length >= 5) {
      // Competition is complete
      clearSolveSession(competitionId, event);
      setPhase('completed');
      toast.success('All attempts completed!');
    } else {
      // Move to next attempt
      setCurrentAttempt(currentAttempt + 1);
      setPhase('inspection');
      setInspectionStartTime(null);
      setInspectionPenalty(0);
      toast.success(`Attempt ${currentAttempt + 1} completed!`);
    }
  }, [
    inspectionPenalty,
    competitionId,
    event,
    sessionToken,
    currentAttempt,
    attempts,
  ]);

  if (competitionLoading || !sessionSynced) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RequireAuth>
    );
  }

  if (!competition) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Competition not found</p>
            <Button onClick={() => navigate({ to: '/competitions' })}>
              Back to Competitions
            </Button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (!sessionToken) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground mb-4">
              Please return to the competition page and start or resume your session.
            </p>
            <Button onClick={() => navigate({ to: `/competitions/${competitionId}` })}>
              Back to Competition
            </Button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (scrambleError) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Scramble</h2>
            <p className="text-muted-foreground mb-4">{normalizeError(scrambleError)}</p>
            <Button onClick={() => navigate({ to: `/competitions/${competitionId}` })}>
              Back to Competition
            </Button>
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
      <div className="min-h-screen bg-background flex flex-col">
        <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{competition.name}</h1>
            <p className="text-muted-foreground">{EVENT_LABELS[event]}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Attempt {currentAttempt + 1} of 5
            </p>
          </div>

          {wasRefreshRecovery && recoveryMessage && (
            <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                {recoveryMessage}
              </AlertDescription>
            </Alert>
          )}

          {scrambleLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              {phase === 'inspection' && (
                <InspectionTimer
                  scramble={scramble || undefined}
                  onComplete={handleInspectionComplete}
                  onStart={handleInspectionStart}
                />
              )}

              {phase === 'solving' && (
                <SolveTimer 
                  onComplete={handleSolveComplete}
                  onStart={handleSolveStart}
                />
              )}
            </div>
          )}

          {attempts.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Previous Attempts</h3>
              <div className="flex gap-2 flex-wrap">
                {attempts.map((attempt, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-card border rounded-lg"
                  >
                    <span className="text-sm text-muted-foreground">#{index + 1}: </span>
                    <span className="font-mono">
                      {attempt.penalty === 999999 || (attempt.time === 0 && attempt.penalty === 0)
                        ? 'DNF'
                        : `${((attempt.time + attempt.penalty) / 1000).toFixed(2)}s`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
