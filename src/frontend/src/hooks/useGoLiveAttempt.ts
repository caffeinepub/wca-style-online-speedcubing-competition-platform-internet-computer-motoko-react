import { useState, useCallback } from 'react';
import { simulateDeployment } from '@/lib/goLiveDiagnostics';
import { runPreflightChecks, type PreflightFailure } from '@/lib/goLivePreflight';

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
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [preflightFailures, setPreflightFailures] = useState<PreflightFailure[]>([]);

  const updateStep = useCallback((index: number, updates: Partial<GoLiveStep>) => {
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], ...updates };
      return newSteps;
    });
  }, []);

  const startDeployment = useCallback(async () => {
    // Run preflight checks first
    const preflightResult = await runPreflightChecks();
    
    if (!preflightResult.passed) {
      setPreflightFailures(preflightResult.failures);
      return;
    }

    setPreflightFailures([]);
    setIsRunning(true);
    setError(null);
    setDiagnostics([]);
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as StepStatus, message: undefined })));

    const diagnosticLog: string[] = [];
    diagnosticLog.push('=== MCubes Deployment Log ===');
    diagnosticLog.push(`Started at: ${new Date().toISOString()}`);
    diagnosticLog.push('');

    try {
      // Run deployment simulation
      const result = await simulateDeployment((stepIndex, status, message) => {
        updateStep(stepIndex, { status, message });
        setCurrentStep(steps[stepIndex]);
        
        diagnosticLog.push(`[${new Date().toISOString()}] Step ${stepIndex + 1}: ${steps[stepIndex].name}`);
        diagnosticLog.push(`Status: ${status}`);
        if (message) {
          diagnosticLog.push(`Message: ${message}`);
        }
        diagnosticLog.push('');
        setDiagnostics([...diagnosticLog]);
      });

      if (!result.success) {
        setError({
          step: result.failedStep || 'Unknown',
          message: result.error || 'Deployment failed',
        });
        diagnosticLog.push('');
        diagnosticLog.push('=== DEPLOYMENT FAILED ===');
        diagnosticLog.push(`Failed Step: ${result.failedStep}`);
        diagnosticLog.push(`Error: ${result.error}`);
      } else {
        diagnosticLog.push('');
        diagnosticLog.push('=== DEPLOYMENT SUCCESSFUL ===');
        diagnosticLog.push(`Completed at: ${new Date().toISOString()}`);
      }

      setDiagnostics([...diagnosticLog]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError({
        step: 'Deployment Process',
        message: errorMessage,
      });
      diagnosticLog.push('');
      diagnosticLog.push('=== DEPLOYMENT ERROR ===');
      diagnosticLog.push(`Error: ${errorMessage}`);
      setDiagnostics([...diagnosticLog]);
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
    setDiagnostics([]);
    setPreflightFailures([]);
  }, []);

  const isComplete = steps.every(step => step.status === 'success' || step.status === 'failed');
  const isSuccess = steps.every(step => step.status === 'success');

  return {
    isRunning,
    isComplete,
    isSuccess,
    currentStep,
    steps,
    error,
    diagnostics,
    preflightFailures,
    startDeployment,
    reset,
  };
}
