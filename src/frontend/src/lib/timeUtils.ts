export function formatTime(ms: number): string {
  if (ms === 999999 || ms >= 999999) return 'DNF';
  
  const seconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
}
