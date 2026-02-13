export const QUERY_KEYS = {
  // Auth & Profile
  isCallerAdmin: ['isCallerAdmin'] as const,
  currentUserProfile: ['currentUserProfile'] as const,
  userPaymentHistory: ['userPaymentHistory'] as const,

  // Competitions
  competitions: ['competitions'] as const,
  competition: (id: string) => ['competition', id] as const,
  hasRazorpayConfig: ['hasRazorpayConfig'] as const,

  // Solve Session
  sessionState: (competitionId: string, event: string) => 
    ['sessionState', competitionId, event] as const,
  scramble: (competitionId: string, event: string, attemptIndex: number) => 
    ['scramble', competitionId, event, attemptIndex] as const,
  userResult: (competitionId: string, event: string) =>
    ['userResult', competitionId, event] as const,

  // Leaderboard
  leaderboard: (competitionId: string, event: string) => 
    ['leaderboard', competitionId, event] as const,
  competitorResults: (competitor: any) => 
    ['competitorResults', competitor.toString()] as const,
  publicProfile: (principal: string) =>
    ['publicProfile', principal] as const,

  // Admin
  adminCompetitions: ['adminCompetitions'] as const,
  adminUsers: ['adminUsers'] as const,
  adminCompetitionResults: (competitionId: string) => 
    ['adminCompetitionResults', competitionId] as const,
  adminResults: (competitionId: string, event: string) =>
    ['adminResults', competitionId, event] as const,
} as const;
