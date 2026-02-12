export function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Payment-related errors
    if (message.includes('Payment required')) {
      return 'Payment is required to access this competition. Please complete payment to continue.';
    }
    
    if (message.includes('payment') && message.includes('verification')) {
      return 'Payment verification failed. Please try again or contact support.';
    }
    
    if (message.includes('Payment cancelled')) {
      return 'Payment was cancelled. Please try again when ready.';
    }
    
    // Authorization errors
    if (message.includes('Unauthorized')) {
      if (message.includes('authenticated')) {
        return 'Please log in to continue.';
      }
      if (message.includes('admin')) {
        return 'This action requires administrator privileges.';
      }
      return 'You do not have permission to perform this action.';
    }
    
    // Competition errors
    if (message.includes('Competition does not exist')) {
      return 'Competition not found.';
    }
    
    if (message.includes('not running')) {
      return 'This competition is not currently active.';
    }
    
    if (message.includes('Already started')) {
      return 'You have already started this competition.';
    }
    
    // Profile errors
    if (message.includes('profile') && message.includes('exist')) {
      return 'Please complete your profile setup first.';
    }
    
    // Generic fallback
    return message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
