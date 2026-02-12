import { useState, useCallback } from 'react';
import { simulateDeployment } from '@/lib/goLiveDiagnostics';

export type StepStatus = 'pending' | 'running' | 'success' | 'failed';

export interface GoLiveStep {
  name: string;
  status: StepStatus;
  message?: string;
}

export interface GoLiveError {
  step: string;
  message: string;
}

export function useGoLiveAttempt() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<GoLiveStep[]>([
    { name: 'Preflight Validation', status: 'pending' },
    { name: 'Frontend Build', status: 'pending' },
    { name: 'Backend Build', status: 'pending' },
    { name: 'Canister Installation', status: 'pending' },
    { name: 'Network Configuration', status: 'pending' },
    { name: 'Deployment Verification', status: 'pending' },
  ]);
  const [currentStep, setCurrentStep] = useState<GoLiveStep | null>(null);
  const [error, setError] = useState<GoLiveError | null>(null);
  const [diagnostics, setDiagnostics] = useState<string>('');

  const updateStep = useCallback((index: number, updates: Partial<GoLiveStep>) => {
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], ...updates };
      return newSteps;
    });
  }, []);

  const startGoLive = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setDiagnostics('');
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as StepStatus, message: undefined })));

    let diagnosticLog = '=== MCubes Deployment Log ===\n';
    diagnosticLog += `Started at: ${new Date().toISOString()}\n\n`;

    try {
      // Run deployment simulation
      const result = await simulateDeployment((stepIndex, status, message) => {
        updateStep(stepIndex, { status, message });
        setCurrentStep(steps[stepIndex]);
        
        diagnosticLog += `[${new Date().toISOString()}] Step ${stepIndex + 1}: ${steps[stepIndex].name}\n`;
        diagnosticLog += `Status: ${status}\n`;
        if (message) {
          diagnosticLog += `Message: ${message}\n`;
        }
        diagnosticLog += '\n';
        setDiagnostics(diagnosticLog);
      });

      if (!result.success) {
        setError({
          step: result.failedStep || 'Unknown',
          message: result.error || 'Deployment failed',
        });
        diagnosticLog += `\n=== DEPLOYMENT FAILED ===\n`;
        diagnosticLog += `Failed Step: ${result.failedStep}\n`;
        diagnosticLog += `Error: ${result.error}\n`;
      } else {
        diagnosticLog += `\n=== DEPLOYMENT SUCCESSFUL ===\n`;
        diagnosticLog += `Completed at: ${new Date().toISOString()}\n`;
      }

      setDiagnostics(diagnosticLog);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError({
        step: 'Deployment Process',
        message: errorMessage,
      });
      diagnosticLog += `\n=== DEPLOYMENT ERROR ===\n`;
      diagnosticLog += `Error: ${errorMessage}\n`;
      setDiagnostics(diagnosticLog);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  }, [updateStep, steps]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as StepStatus, message: undefined })));
    setCurrentStep(null);
    setError(null);
    setDiagnostics('');
  }, []);

  return {
    isRunning,
    currentStep,
    steps,
    error,
    diagnostics,
    startGoLive,
    reset,
  };
}
