export const QUERY_KEYS = {
  currentUserProfile: ['currentUserProfile'],
  isAdmin: ['isAdmin'],
  competitions: ['competitions'],
  competition: (id: bigint) => ['competition', id.toString()],
  results: (competitionId: bigint) => ['results', competitionId.toString()],
  leaderboard: (competitionId: bigint) => ['leaderboard', competitionId.toString()],
  allUserProfiles: ['allUserProfiles'],
};
