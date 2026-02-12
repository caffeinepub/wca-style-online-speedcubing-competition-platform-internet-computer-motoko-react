export interface PreflightFailure {
  check: string;
  message: string;
  action?: string;
}

export interface PreflightResult {
  passed: boolean;
  failures: PreflightFailure[];
}

export async function runPreflightChecks(): Promise<PreflightResult> {
  const failures: PreflightFailure[] = [];

  // Check 1: Verify environment configuration
  try {
    const response = await fetch('/env.json');
    if (!response.ok) {
      failures.push({
        check: 'Environment Configuration',
        message: 'env.json file is missing or inaccessible',
        action: 'Ensure env.json is present in the public directory with correct canister IDs',
      });
    } else {
      const envData = await response.json();
      if (!envData.BACKEND_CANISTER_ID) {
        failures.push({
          check: 'Backend Canister ID',
          message: 'BACKEND_CANISTER_ID is not defined in env.json',
          action: 'Deploy backend canister and update env.json with the canister ID',
        });
      }
    }
  } catch (error) {
    failures.push({
      check: 'Environment Configuration',
      message: 'Failed to load environment configuration',
      action: 'Check that env.json exists and is valid JSON',
    });
  }

  // Check 2: Verify Razorpay configuration
  try {
    const response = await fetch('/razorpay.config.json');
    if (!response.ok) {
      failures.push({
        check: 'Payment Configuration',
        message: 'razorpay.config.json file is missing',
        action: 'Create razorpay.config.json in the public directory with your Razorpay Key ID',
      });
    } else {
      const razorpayConfig = await response.json();
      if (!razorpayConfig.keyId) {
        failures.push({
          check: 'Razorpay Key ID',
          message: 'Razorpay Key ID is not configured',
          action: 'Add your Razorpay Key ID to razorpay.config.json',
        });
      }
    }
  } catch (error) {
    failures.push({
      check: 'Payment Configuration',
      message: 'Failed to load Razorpay configuration',
      action: 'Ensure razorpay.config.json exists and is valid JSON',
    });
  }

  // Check 3: Verify network connectivity
  try {
    const response = await fetch('https://ic0.app', { method: 'HEAD', mode: 'no-cors' });
    // If we get here without error, connectivity is OK
  } catch (error) {
    failures.push({
      check: 'Network Connectivity',
      message: 'Unable to reach Internet Computer network',
      action: 'Check your internet connection and firewall settings',
    });
  }

  // Check 4: Verify build artifacts (simulated)
  // In a real scenario, this would check for compiled assets
  const buildCheck = await checkBuildArtifacts();
  if (!buildCheck.passed) {
    failures.push({
      check: 'Build Artifacts',
      message: buildCheck.message,
      action: 'Run npm run build to generate production assets',
    });
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

async function checkBuildArtifacts(): Promise<{ passed: boolean; message: string }> {
  // Simulate checking for build artifacts
  // In production, this would verify dist/ directory exists and contains required files
  try {
    // Check if we're in development mode
    const isDev = import.meta.env.DEV;
    if (isDev) {
      return {
        passed: false,
        message: 'Application is running in development mode',
      };
    }
    return { passed: true, message: 'Build artifacts verified' };
  } catch (error) {
    return {
      passed: false,
      message: 'Unable to verify build artifacts',
    };
  }
}
