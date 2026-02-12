import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { toast } from 'sonner';
import RequireAuth from '../components/auth/RequireAuth';
import InspectionTimer from '../components/solve/InspectionTimer';
import SolveTimer from '../components/solve/SolveTimer';
import SolveCompletionScreen from '../components/solve/SolveCompletionScreen';
import { useGetCompetition, useGetScrambleForAttempt, useSubmitResult, useStartCompetition } from '../hooks/useQueries';
import { getSolveSession, clearSolveSession, storeSolveSession } from '../lib/solveSession';
import { normalizeError } from '../api/errors';
import { EVENT_LABELS } from '../types/domain';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
  const search = useSearch({ strict: false }) as { attempt?: string };

  const [phase, setPhase] = useState<SolvePhase>('inspection');
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [sessionToken, setSessionToken] = useState<Uint8Array | null>(null);
  const [inspectionStartTime, setInspectionStartTime] = useState<number | null>(null);
  const [inspectionPenalty, setInspectionPenalty] = useState<number>(0);
  const [sessionSynced, setSessionSynced] = useState(false);
  const [wasAutoDNF, setWasAutoDNF] = useState(false);

  const { data: competition, isLoading: competitionLoading } = useGetCompetition(BigInt(competitionId));
  const { data: scramble, isLoading: scrambleLoading, error: scrambleError } = useGetScrambleForAttempt(
    BigInt(competitionId),
    event,
    currentAttempt
  );
  const submitResultMutation = useSubmitResult();
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

      // Store the initial attempt index from local storage
      const initialAttempt = search.attempt ? parseInt(search.attempt, 10) : 0;
      
      try {
        // Call backend to sync session state (this will auto-DNF if refresh occurred during solve)
        const newSessionToken = await startCompetitionMutation.mutateAsync({
          competitionId: BigInt(competitionId),
          event,
        });

        // Store the new session token
        storeSolveSession(competitionId, event, newSessionToken);
        setSessionToken(newSessionToken);

        // Check if we need to advance to the next attempt
        // The backend increments currentAttempt if refresh occurred during an active solve
        // We detect this by checking if the scramble for the initial attempt is still valid
        // If the backend advanced the attempt, we should show the next scramble
        
        // For now, we'll use a simple heuristic:
        // If the user had started an attempt (phase was 'solving'), the backend will have
        // marked it as DNF and advanced. We detect this by checking if we're on attempt 0
        // but the URL suggests we should be further along.
        
        // Since we don't have explicit backend state, we'll check if the session was resumed
        // and show a notification if the attempt index changed
        const storedPhase = sessionStorage.getItem(`solve-phase-${competitionId}-${event}`);
        const storedAttempt = sessionStorage.getItem(`solve-attempt-${competitionId}-${event}`);
        
        if (storedPhase === 'solving' && storedAttempt !== null) {
          const lastAttempt = parseInt(storedAttempt, 10);
          // If we were solving, the backend marked it as DNF and advanced
          setCurrentAttempt(lastAttempt + 1);
          setWasAutoDNF(true);
          
          // Clear the stored phase
          sessionStorage.removeItem(`solve-phase-${competitionId}-${event}`);
          sessionStorage.removeItem(`solve-attempt-${competitionId}-${event}`);
        } else if (!isNaN(initialAttempt) && initialAttempt >= 0 && initialAttempt < 5) {
          setCurrentAttempt(initialAttempt);
        }

        setSessionSynced(true);
      } catch (error) {
        toast.error(normalizeError(error));
        navigate({ to: `/competitions/${competitionId}` });
      }
    };

    if (!sessionSynced) {
      syncSession();
    }
  }, [competitionId, event, navigate, search.attempt, sessionSynced, startCompetitionMutation]);

  // Show auto-DNF notification
  useEffect(() => {
    if (wasAutoDNF && sessionSynced) {
      toast.info(
        `This attempt was marked DNF because the page was refreshed. Continuing with attempt ${currentAttempt + 1}.`,
        { duration: 6000 }
      );
      setWasAutoDNF(false);
    }
  }, [wasAutoDNF, sessionSynced, currentAttempt]);

  // Store current phase and attempt for refresh detection
  useEffect(() => {
    if (sessionSynced) {
      sessionStorage.setItem(`solve-phase-${competitionId}-${event}`, phase);
      sessionStorage.setItem(`solve-attempt-${competitionId}-${event}`, currentAttempt.toString());
    }
  }, [phase, currentAttempt, competitionId, event, sessionSynced]);

  const handleInspectionComplete = () => {
    setPhase('solving');
  };

  const handleInspectionStart = () => {
    setInspectionStartTime(Date.now());
  };

  const handleSolveStart = () => {
    // Calculate inspection penalty when solve timer starts (not when it completes)
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
    
    // Store the penalty to apply when solve completes
    setInspectionPenalty(penalty);
  };

  const handleSolveComplete = async (time: number, penalty: number) => {
    // Apply the inspection penalty that was calculated when solve started
    const finalPenalty = penalty + inspectionPenalty;

    const newAttempts = [...attempts, { time, penalty: finalPenalty }];
    setAttempts(newAttempts);

    if (newAttempts.length === 5) {
      // Submit all attempts
      try {
        await submitResultMutation.mutateAsync({
          competitionId: BigInt(competitionId),
          event,
          attempts: newAttempts,
          status: 'completed',
        });
        
        // Clear session and stored state
        clearSolveSession(competitionId, event);
        sessionStorage.removeItem(`solve-phase-${competitionId}-${event}`);
        sessionStorage.removeItem(`solve-attempt-${competitionId}-${event}`);
        
        setPhase('completed');
      } catch (error) {
        toast.error(normalizeError(error));
      }
    } else {
      // Move to next attempt
      setCurrentAttempt(currentAttempt + 1);
      setPhase('inspection');
      setInspectionStartTime(null);
      setInspectionPenalty(0);
    }
  };

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
                      {attempt.penalty === 999999
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
