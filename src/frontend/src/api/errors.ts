export function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    // Session lock errors
    if (message.includes('session is locked') || message.includes('Invalid session token')) {
      return 'This competition session is locked to another tab or device. Please use the original tab where you started.';
    }
    
    if (message.includes('Session not found') || message.includes('No active session')) {
      return 'Your session has expired or was not found. Please return to the competition page and start again.';
    }
    
    if (message.includes('Session token required')) {
      return 'Session authentication failed. Please restart the competition from the competition page.';
    }

    // Progressive scramble errors
    if (message.includes('Previous attempt not submitted') || message.includes('out of order')) {
      return 'You must complete the previous attempt before accessing the next scramble.';
    }
    
    if (message.includes('Scramble not available')) {
      return 'The scramble for this attempt is not yet available. Please complete previous attempts first.';
    }

    // Duplicate submission errors
    if (message.includes('Attempt already submitted') || message.includes('duplicate')) {
      return 'This attempt has already been recorded. Your progress has been saved.';
    }
    
    if (message.includes('Cannot overwrite attempt')) {
      return 'This attempt cannot be modified as it has already been submitted.';
    }

    // Payment configuration errors
    if (message.includes('Razorpay is not configured') || message.includes('payment system is not configured')) {
      return 'Payments are temporarily unavailable. The payment system has not been configured yet. Please contact support or try again later.';
    }

    // Payment errors
    if (message.includes('Payment was cancelled')) {
      return 'Payment was cancelled. You can try again when ready.';
    }

    if (message.includes('Already paid')) {
      return 'You have already paid for this event.';
    }

    if (message.includes('Invalid order ID') || message.includes('Order does not belong')) {
      return 'Payment verification failed. Please try again or contact support.';
    }

    if (message.includes('Invalid payment signature')) {
      return 'Payment verification failed due to invalid signature. Please contact support.';
    }

    // Authorization errors
    if (message.includes('Unauthorized') || message.includes('Only admins')) {
      return 'You do not have permission to perform this action.';
    }

    if (message.includes('User is blocked')) {
      return 'Your account has been blocked. Please contact support.';
    }

    if (message.includes('User profile does not exist')) {
      return 'Please complete your profile setup before continuing.';
    }

    // Competition errors
    if (message.includes('Competition does not exist')) {
      return 'This competition could not be found.';
    }

    if (message.includes('Competition is not running')) {
      return 'This competition is not currently active.';
    }

    if (message.includes('Event is not part of this competition')) {
      return 'The selected event is not available in this competition.';
    }

    // Deployment errors
    if (message.includes('Build artifacts not found')) {
      return 'Build artifacts are missing. Please run a build first.';
    }

    if (message.includes('Network connectivity check failed')) {
      return 'Unable to connect to the Internet Computer network. Please check your connection.';
    }

    if (message.includes('Deployment failed')) {
      return 'Deployment failed. Please check the diagnostics for details.';
    }

    // Generic backend errors
    if (message.includes('Call failed') || message.includes('Canister')) {
      return 'A backend error occurred. Please try again or contact support.';
    }

    // Return the original message if no specific match
    return message;
  }

  return 'An unexpected error occurred. Please try again.';
}
