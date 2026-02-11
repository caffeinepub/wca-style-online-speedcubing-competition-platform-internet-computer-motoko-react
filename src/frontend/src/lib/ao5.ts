export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  ao5: number | 'DNF';
  attempts: Array<{ time: number; penalty: number }>;
}

export function calculateAo5(attempts: Array<{ time: number; penalty: number }>): number | 'DNF' {
  if (attempts.length !== 5) return 'DNF';

  const totalTimes = attempts.map((a) => {
    if (a.penalty === 999999) return 'DNF';
    return a.time + a.penalty;
  });

  const dnfCount = totalTimes.filter((t) => t === 'DNF').length;
  if (dnfCount >= 2) return 'DNF';

  const numericTimes = totalTimes.filter((t) => t !== 'DNF') as number[];
  numericTimes.sort((a, b) => a - b);

  const best = numericTimes[0];
  const worst = numericTimes[numericTimes.length - 1];

  const middle = numericTimes.filter((t) => t !== best && t !== worst);
  if (middle.length === 0) return 'DNF';

  const sum = middle.reduce((acc, t) => acc + t, 0);
  return Math.round(sum / middle.length);
}
