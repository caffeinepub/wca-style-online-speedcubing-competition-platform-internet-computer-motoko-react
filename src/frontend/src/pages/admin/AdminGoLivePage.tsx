import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Rocket, CheckCircle2, XCircle, AlertCircle, Copy, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AdminGuard from '@/components/auth/AdminGuard';
import { toast } from 'sonner';
import { runPreflightChecks, type PreflightResult } from '@/lib/goLivePreflight';
import { useGoLiveAttempt, type GoLiveStep } from '@/hooks/useGoLiveAttempt';

export default function AdminGoLivePage() {
  return (
    <AdminGuard>
      <AdminGoLiveContent />
    </AdminGuard>
  );
}

function AdminGoLiveContent() {
  const navigate = useNavigate();
  const [preflightResults, setPreflightResults] = useState<PreflightResult | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const { 
    isRunning, 
    currentStep, 
    steps, 
    error, 
    diagnostics,
    startGoLive,
    reset 
  } = useGoLiveAttempt();

  const handleRunPreflight = async () => {
    const results = await runPreflightChecks();
    setPreflightResults(results);
    
    if (results.passed) {
      toast.success('All preflight checks passed');
    } else {
      toast.error(`${results.failures.length} preflight check(s) failed`);
    }
  };

  const handleStartGoLive = async () => {
    setShowDiagnostics(true);
    await startGoLive();
  };

  const handleRetry = () => {
    reset();
    setPreflightResults(null);
    setShowDiagnostics(false);
  };

  const handleCopyDiagnostics = () => {
    if (diagnostics) {
      navigator.clipboard.writeText(diagnostics);
      toast.success('Diagnostics copied to clipboard');
    }
  };

  const handleDownloadDiagnostics = () => {
    if (diagnostics) {
      const blob = new Blob([diagnostics], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `go-live-diagnostics-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Diagnostics downloaded');
    }
  };

  const allStepsComplete = steps.every(s => s.status === 'success');
  const hasFailure = steps.some(s => s.status === 'failed') || !!error;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/admin' })}
          className="mb-4"
        >
          ← Back to Admin
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Go Live</h1>
            <p className="text-muted-foreground">Deploy your application to production</p>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      {(isRunning || allStepsComplete || hasFailure) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isRunning && (
                <>
                  <div className="w-4 h-4 border-2 border-chart-1 border-t-transparent rounded-full animate-spin" />
                  Deployment in Progress
                </>
              )}
              {allStepsComplete && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Deployment Successful
                </>
              )}
              {hasFailure && !isRunning && (
                <>
                  <XCircle className="w-5 h-5 text-destructive" />
                  Deployment Failed
                </>
              )}
            </CardTitle>
            {currentStep && (
              <CardDescription>
                Current step: {currentStep.name}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <StepIndicator key={index} step={step} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Deployment Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="font-medium mb-1">Step: {error.step}</p>
            <p className="text-sm">{error.message}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Preflight Results */}
      {preflightResults && !preflightResults.passed && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Preflight Checks Failed
            </CardTitle>
            <CardDescription>
              Please resolve the following issues before deploying
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {preflightResults.failures.map((failure, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{failure.check}</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-sm mb-2">{failure.message}</p>
                    {failure.action && (
                      <p className="text-sm font-medium">Action: {failure.action}</p>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostics Panel */}
      {showDiagnostics && diagnostics && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Deployment Diagnostics</CardTitle>
                <CardDescription>Complete output from the deployment process</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyDiagnostics}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadDiagnostics}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border bg-muted/50 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {diagnostics}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Actions</CardTitle>
          <CardDescription>
            Run preflight checks before deploying to production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isRunning && !allStepsComplete && (
            <>
              <Button
                onClick={handleRunPreflight}
                variant="outline"
                className="w-full"
                disabled={isRunning}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Run Preflight Checks
              </Button>

              <Separator />

              <Button
                onClick={handleStartGoLive}
                className="w-full"
                disabled={isRunning || (preflightResults !== null && !preflightResults.passed)}
              >
                <Rocket className="w-4 h-4 mr-2" />
                {isRunning ? 'Deploying...' : 'Start Deployment'}
              </Button>

              {preflightResults !== null && !preflightResults.passed && (
                <p className="text-sm text-muted-foreground text-center">
                  Resolve preflight issues before deploying
                </p>
              )}
            </>
          )}

          {(allStepsComplete || hasFailure) && !isRunning && (
            <Button
              onClick={handleRetry}
              variant={hasFailure ? 'default' : 'outline'}
              className="w-full"
            >
              {hasFailure ? 'Retry Deployment' : 'Deploy Again'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Preflight checks validate your configuration before deployment
          </p>
          <p>
            • All deployment steps must complete successfully for a valid deployment
          </p>
          <p>
            • Download diagnostics if you need to troubleshoot deployment issues
          </p>
          <p>
            • Contact support if deployment continues to fail after resolving all issues
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StepIndicator({ step }: { step: GoLiveStep }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-shrink-0">
        {step.status === 'pending' && (
          <div className="w-5 h-5 rounded-full border-2 border-muted" />
        )}
        {step.status === 'running' && (
          <div className="w-5 h-5 border-2 border-chart-1 border-t-transparent rounded-full animate-spin" />
        )}
        {step.status === 'success' && (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        )}
        {step.status === 'failed' && (
          <XCircle className="w-5 h-5 text-destructive" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{step.name}</p>
          {step.status === 'running' && (
            <Badge variant="outline" className="text-xs">
              In Progress
            </Badge>
          )}
        </div>
        {step.message && (
          <p className="text-xs text-muted-foreground mt-1">{step.message}</p>
        )}
      </div>

      {step.status === 'success' && (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  );
}
