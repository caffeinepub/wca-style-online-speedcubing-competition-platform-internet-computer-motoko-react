export const QUERY_KEYS = {
  competitions: ['competitions'] as const,
  competition: (id: bigint) => ['competition', id.toString()] as const,
  userResult: (competitionId: bigint, event: string) =>
    ['userResult', competitionId.toString(), event] as const,
  leaderboard: (competitionId: bigint, event: string) =>
    ['leaderboard', competitionId.toString(), event] as const,
  userProfile: (principal?: string) =>
    principal ? ['userProfile', principal] : ['userProfile'] as const,
  currentUserProfile: ['currentUserProfile'] as const,
  razorpayConfigured: ['razorpayConfigured'] as const,
  paymentHistory: ['paymentHistory'] as const,
  
  // Public profile keys
  publicProfile: (principal: string) => ['publicProfile', principal] as const,
  publicResults: (principal: string) => ['publicResults', principal] as const,
  
  // Admin keys
  adminUsers: ['admin', 'users'] as const,
  adminCompetitions: ['admin', 'competitions'] as const,
  adminResults: ['admin', 'results'] as const,
  adminUserSolveHistory: (principal: string) =>
    ['admin', 'userSolveHistory', principal] as const,
  isCallerAdmin: ['isCallerAdmin'] as const,
  
  // Solve session keys
  solveSessionState: (competitionId: bigint, event: string) =>
    ['solveSession', 'state', competitionId.toString(), event] as const,
  scrambleForAttempt: (competitionId: bigint, event: string, attemptIndex: number) =>
    ['scramble', competitionId.toString(), event, attemptIndex] as const,
} as const;
