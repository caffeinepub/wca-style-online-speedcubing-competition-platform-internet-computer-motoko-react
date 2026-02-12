/**
 * Solve session management utilities for tab-scoped session tokens.
 * Session tokens are stored in sessionStorage to ensure they're tab-specific
 * and prevent multi-tab access or refresh-based replay attacks.
 */

export interface SolveSessionToken {
  competitionId: string;
  event: string;
  token: number[]; // Store as number array for JSON serialization
  createdAt: number;
}

/**
 * Generate a storage key for a solve session
 */
function getSessionKey(competitionId: string, event: string): string {
  return `solve_session_${competitionId}_${event}`;
}

/**
 * Store a solve session token in sessionStorage (tab-scoped)
 */
export function storeSolveSession(
  competitionId: string,
  event: string,
  token: Uint8Array
): void {
  const key = getSessionKey(competitionId, event);
  const session: SolveSessionToken = {
    competitionId,
    event,
    token: Array.from(token), // Convert to array for JSON serialization
    createdAt: Date.now(),
  };
  
  try {
    sessionStorage.setItem(key, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to store solve session:', error);
  }
}

/**
 * Retrieve a solve session token from sessionStorage
 */
export function getSolveSession(
  competitionId: string,
  event: string
): Uint8Array | null {
  const key = getSessionKey(competitionId, event);
  
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;
    
    const session: SolveSessionToken = JSON.parse(stored);
    
    // Verify it matches the requested competition/event
    if (session.competitionId !== competitionId || session.event !== event) {
      return null;
    }
    
    // Convert back to Uint8Array
    return new Uint8Array(session.token);
  } catch (error) {
    console.error('Failed to retrieve solve session:', error);
    return null;
  }
}

/**
 * Clear a solve session token from sessionStorage
 */
export function clearSolveSession(competitionId: string, event: string): void {
  const key = getSessionKey(competitionId, event);
  sessionStorage.removeItem(key);
}

/**
 * Check if a solve session exists for the given competition/event
 */
export function hasSolveSession(competitionId: string, event: string): boolean {
  return getSolveSession(competitionId, event) !== null;
}
