import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ActorInitializationErrorProps {
  message: string;
  onRetry: () => void;
}

export default function ActorInitializationError({ message, onRetry }: ActorInitializationErrorProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Connection Error</AlertTitle>
          <AlertDescription className="mt-2 text-base">
            {message}
          </AlertDescription>
        </Alert>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">What you can do:</h3>
          <ul className="space-y-3 mb-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-chart-1 font-bold mt-1">•</span>
              <span>Check your internet connection and try again</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-chart-1 font-bold mt-1">•</span>
              <span>If you're an administrator, ensure the backend canister ID is properly configured in <code className="bg-muted px-1.5 py-0.5 rounded text-sm">/env.json</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-chart-1 font-bold mt-1">•</span>
              <span>Contact support if the problem persists</span>
            </li>
          </ul>

          <Button onClick={onRetry} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </div>
    </div>
  );
}
