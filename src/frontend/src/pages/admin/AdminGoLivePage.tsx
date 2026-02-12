import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Copy, Download, Rocket } from 'lucide-react';
import { useGoLiveAttempt } from '../../hooks/useGoLiveAttempt';
import type { PreflightFailure } from '../../lib/goLivePreflight';

export default function AdminGoLivePage() {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const {
    isRunning,
    isComplete,
    isSuccess,
    currentStep,
    steps,
    preflightFailures,
    diagnostics,
    error,
    startDeployment,
    reset,
  } = useGoLiveAttempt();

  const handleCopyDiagnostics = () => {
    navigator.clipboard.writeText(diagnostics.join('\n'));
  };

  const handleDownloadDiagnostics = () => {
    const blob = new Blob([diagnostics.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-diagnostics-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStepIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Go Live</h1>
        <p className="text-muted-foreground">
          Deploy your application to production on the Internet Computer network
        </p>
      </div>

      {/* Preflight Checks */}
      {preflightFailures.length > 0 && !isRunning && !isComplete && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Preflight Checks Failed
            </CardTitle>
            <CardDescription>
              The following issues must be resolved before deployment. All checks reference <code className="text-xs bg-muted px-1 py-0.5 rounded">/env.json</code> as the source of configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {preflightFailures.map((failure: PreflightFailure, index: number) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    <div className="font-semibold mb-1">{failure.check}</div>
                    <div className="text-sm mb-2">{failure.message}</div>
                    {failure.action && (
                      <div className="text-sm">
                        <span className="font-medium">Action:</span> {failure.action}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment Steps */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Deployment Progress</CardTitle>
          <CardDescription>
            Follow these steps to deploy your application to production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5">{getStepIcon(step.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{step.name}</span>
                    {step.status === 'success' && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Complete
                      </Badge>
                    )}
                    {step.status === 'running' && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Running
                      </Badge>
                    )}
                    {step.status === 'failed' && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                  {step.message && (
                    <p className="text-sm text-muted-foreground mt-1">{step.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {isSuccess && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="font-semibold mb-1">Deployment Successful!</div>
            <div className="text-sm">
              Your application is now live on the Internet Computer network.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-1">Deployment Failed</div>
            <div className="text-sm">{error.message}</div>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isRunning && !isComplete && (
          <Button
            onClick={startDeployment}
            disabled={preflightFailures.length > 0}
            size="lg"
            className="flex-1"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Start Deployment
          </Button>
        )}

        {isComplete && (
          <Button onClick={reset} variant="outline" size="lg" className="flex-1">
            Deploy Again
          </Button>
        )}

        {(isRunning || isComplete) && (
          <Button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            variant="outline"
            size="lg"
          >
            {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
          </Button>
        )}
      </div>

      {/* Diagnostics Panel */}
      {showDiagnostics && diagnostics.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Deployment Diagnostics</CardTitle>
                <CardDescription>Detailed logs from the deployment process</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopyDiagnostics} variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button onClick={handleDownloadDiagnostics} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {diagnostics.join('\n')}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Deployment Requirements</CardTitle>
          <CardDescription>
            Ensure these requirements are met before deploying
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Backend Canister Deployed:</span> Your backend canister must be deployed and the canister ID must be added to <code className="text-xs bg-muted px-1 py-0.5 rounded">/env.json</code>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Razorpay Configured:</span> Add your Razorpay Key ID to <code className="text-xs bg-muted px-1 py-0.5 rounded">razorpay.config.json</code>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Network Access:</span> Ensure you have internet connectivity to reach the Internet Computer network
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Production Build:</span> Application must be built for production (not running in development mode)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
