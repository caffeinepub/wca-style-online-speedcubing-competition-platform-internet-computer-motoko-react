import type { StepStatus } from '@/hooks/useGoLiveAttempt';

export interface DeploymentResult {
  success: boolean;
  failedStep?: string;
  error?: string;
}

type StepCallback = (stepIndex: number, status: StepStatus, message?: string) => void;

export async function simulateDeployment(
  onStepUpdate: StepCallback
): Promise<DeploymentResult> {
  const steps = [
    { name: 'Preflight Validation', duration: 1000 },
    { name: 'Frontend Build', duration: 2000 },
    { name: 'Backend Build', duration: 2000 },
    { name: 'Canister Installation', duration: 3000 },
    { name: 'Network Configuration', duration: 1500 },
    { name: 'Deployment Verification', duration: 1500 },
  ];

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Mark step as running
      onStepUpdate(i, 'running', `Executing ${step.name}...`);
      
      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, step.duration));
      
      // Simulate random failure for demonstration (5% chance)
      // Remove this in production or make it configurable
      const shouldFail = Math.random() < 0.05;
      
      if (shouldFail && i > 0) {
        onStepUpdate(i, 'failed', `${step.name} failed`);
        return {
          success: false,
          failedStep: step.name,
          error: generateErrorMessage(step.name),
        };
      }
      
      // Mark step as successful
      onStepUpdate(i, 'success', `${step.name} completed successfully`);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      failedStep: 'Deployment Process',
      error: errorMessage,
    };
  }
}

function generateErrorMessage(stepName: string): string {
  const errorMessages: Record<string, string> = {
    'Preflight Validation': 'Configuration validation failed. Please check that all required environment variables are set and configuration files are present.',
    'Frontend Build': 'Frontend compilation failed. Check for TypeScript errors or missing dependencies. Run "npm run build" locally to reproduce the error.',
    'Backend Build': 'Backend Motoko compilation failed. Verify that all Motoko syntax is correct and dependencies are properly imported.',
    'Canister Installation': 'Failed to install canister on the Internet Computer network. This may be due to insufficient cycles or network connectivity issues.',
    'Network Configuration': 'Network configuration failed. Verify that DNS settings and routing rules are correctly configured.',
    'Deployment Verification': 'Deployment verification failed. The deployed application is not responding as expected. Check canister logs for details.',
  };

  return errorMessages[stepName] || `${stepName} encountered an unexpected error. Please check the deployment logs for more details.`;
}

export function normalizeDeploymentError(error: unknown): string {
  if (error instanceof Error) {
    // Extract meaningful error messages
    const message = error.message;
    
    // Check for common error patterns
    if (message.includes('ECONNREFUSED')) {
      return 'Connection refused: Unable to connect to the Internet Computer network. Check your network connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'Operation timed out: The deployment process took too long to complete. This may indicate network issues or insufficient resources.';
    }
    
    if (message.includes('permission denied')) {
      return 'Permission denied: You do not have sufficient permissions to perform this deployment. Verify your identity and admin status.';
    }
    
    if (message.includes('out of cycles')) {
      return 'Insufficient cycles: The canister does not have enough cycles to complete the deployment. Top up the canister and try again.';
    }
    
    return message;
  }
  
  return 'An unknown error occurred during deployment. Please check the diagnostics for more information.';
}
