// Solve session management utilities for storing and retrieving tab-scoped session tokens
// in sessionStorage with attempt data for refresh recovery

interface SolveSessionData {
  token: Uint8Array;
  attempts: Array<{ time: number; penalty: number }>;
  timestamp: number;
}

function getSessionKey(competitionId: string, event: string): string {
  return `solve_session_${competitionId}_${event}`;
}

export function storeSolveSession(
  competitionId: string,
  event: string,
  token: Uint8Array,
  attempts: Array<{ time: number; penalty: number }> = []
): void {
  const key = getSessionKey(competitionId, event);
  const data: SolveSessionData = {
    token,
    attempts,
    timestamp: Date.now(),
  };
  
  // Convert Uint8Array to regular array for JSON serialization
  const serializable = {
    token: Array.from(token),
    attempts: data.attempts,
    timestamp: data.timestamp,
  };
  
  sessionStorage.setItem(key, JSON.stringify(serializable));
}

export function getSolveSession(
  competitionId: string,
  event: string
): SolveSessionData | null {
  const key = getSessionKey(competitionId, event);
  const stored = sessionStorage.getItem(key);
  
  if (!stored) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(stored);
    
    // Convert array back to Uint8Array
    return {
      token: new Uint8Array(parsed.token),
      attempts: parsed.attempts || [],
      timestamp: parsed.timestamp,
    };
  } catch (error) {
    console.error('Failed to parse solve session:', error);
    return null;
  }
}

export function clearSolveSession(competitionId: string, event: string): void {
  const key = getSessionKey(competitionId, event);
  sessionStorage.removeItem(key);
}
