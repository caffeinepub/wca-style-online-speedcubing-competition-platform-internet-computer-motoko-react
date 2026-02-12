import type { CompetitionResult } from '../backend';

export function exportResultsToCSV(results: CompetitionResult[], filename: string): void {
  // CSV headers
  const headers = ['User Principal', 'Display Name', 'MCubes ID', 'Status', 'Attempt 1', 'Attempt 2', 'Attempt 3', 'Attempt 4', 'Attempt 5'];
  
  // CSV rows
  const rows = results.map(result => {
    const attempts = result.attempts.map(att => {
      const time = Number(att.time);
      const penalty = Number(att.penalty);
      if (time === 0 && penalty === 0) return '-';
      return `${(time / 1000).toFixed(2)}s`;
    });
    
    // Pad with empty attempts if less than 5
    while (attempts.length < 5) {
      attempts.push('-');
    }
    
    return [
      escapeCSV(result.user.toString()),
      escapeCSV(result.userProfile?.displayName || 'Unknown'),
      escapeCSV(result.userProfile?.mcubesId || '-'),
      escapeCSV(result.status),
      ...attempts,
    ];
  });
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
