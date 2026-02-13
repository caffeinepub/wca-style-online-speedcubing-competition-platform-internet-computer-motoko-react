export function normalizeError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message;

    // Backend method not available errors
    if (message.includes('Backend method not available') || message.includes('Backend method doesn\'t exist')) {
      return 'This feature is not yet available. Please contact the administrator.';
    }

    // Actor not available
    if (message.includes('Actor not available')) {
      return 'Unable to connect to the backend. Please try again.';
    }

    // Authorization errors
    if (message.includes('Unauthorized') || message.includes('not authorized')) {
      return 'You do not have permission to perform this action.';
    }

    // User blocked
    if (message.includes('User is blocked')) {
      return 'Your account has been blocked. Please contact support.';
    }

    // Competition errors
    if (message.includes('Competition does not exist')) {
      return 'Competition not found.';
    }

    if (message.includes('Competition is not active')) {
      return 'This competition is not currently active.';
    }

    if (message.includes('Competition registration is closed') || message.includes('Competition is locked')) {
      return 'Registration for this competition is closed.';
    }

    if (message.includes('Competition has ended')) {
      return 'This competition has already ended.';
    }

    if (message.includes('Competition is not currently running')) {
      return 'This competition is not currently running.';
    }

    if (message.includes('Registration has not started yet')) {
      return 'Registration has not started yet for this competition.';
    }

    // Event errors
    if (message.includes('Event is not part of this competition')) {
      return 'This event is not available in this competition.';
    }

    // Session errors
    if (message.includes('already have an active session') || message.includes('Session already exists')) {
      return 'Resuming your existing session for this event.';
    }

    if (message.includes('Session already completed') || message.includes('already completed')) {
      return 'You have already completed this event.';
    }

    if (message.includes('Session token required') || message.includes('No active session found')) {
      return 'Session token is missing. Please start a new session from the competition page.';
    }

    if (message.includes('Session not found') || message.includes('Invalid session')) {
      return 'Session not found. Please start a new session from the competition page.';
    }

    // Attempt submission errors
    if (message.includes('duplicate') || message.includes('Attempt already submitted')) {
      return 'This attempt has already been submitted.';
    }

    if (message.includes('Invalid attempt index')) {
      return 'Invalid attempt number.';
    }

    // Payment errors
    if (message.includes('Payment system not configured')) {
      return 'Payment system not configured. Please contact the administrator.';
    }

    if (message.includes('This is a free competition')) {
      return 'This is a free competition. No payment is required.';
    }

    if (message.includes('Payment required') || message.includes('Unauthorized: Payment required')) {
      return 'Payment is required to access this event.';
    }

    if (message.includes('Already paid for this event')) {
      return 'You have already paid for this event.';
    }

    if (message.includes('Payment already confirmed')) {
      return 'Payment has already been confirmed for this event.';
    }

    if (message.includes('Order not found') || message.includes('Invalid order ID')) {
      return 'Invalid payment order. Please try again.';
    }

    if (message.includes('Order details mismatch') || message.includes('Order details do not match')) {
      return 'Payment order details do not match. Please try again.';
    }

    if (message.includes('Order does not belong to caller') || message.includes('This order does not belong to you')) {
      return 'This payment order does not belong to you.';
    }

    // Profile errors
    if (message.includes('User profile does not exist')) {
      return 'User profile not found. Please create a profile first.';
    }

    if (message.includes('Can only view your own profile')) {
      return 'You can only view your own profile.';
    }

    // Payment cancellation
    if (message.includes('Payment was cancelled')) {
      return 'Payment was cancelled.';
    }

    // Scramble errors
    if (message.includes('No scrambles found') || message.includes('No scramble available')) {
      return 'No scrambles available for this event.';
    }

    // Refresh recovery - preserve attempt numbers from backend messages
    if (message.includes('marked DNF because the page was refreshed')) {
      // Return the full message to preserve attempt numbers
      return message;
    }

    if (message.includes('Continuing with attempt')) {
      // Return the full message to preserve attempt numbers
      return message;
    }

    // Generic error message
    return message;
  }

  // Handle ActorBootstrapError objects
  if (typeof error === 'object' && error !== null && 'stage' in error && 'message' in error) {
    const bootstrapError = error as { stage: string; message: string };
    return bootstrapError.message;
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
}
