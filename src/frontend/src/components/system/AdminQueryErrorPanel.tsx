import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AdminQueryErrorPanelProps {
  error: unknown;
  onRetry: () => void;
  title?: string;
}

export function AdminQueryErrorPanel({ error, onRetry, title = 'Error Loading Data' }: AdminQueryErrorPanelProps) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">{errorMessage}</p>
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
