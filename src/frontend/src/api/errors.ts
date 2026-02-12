export function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Payment cancellation
    if (message.includes('cancelled')) {
      return 'Payment was cancelled. Please try again when ready.';
    }
    
    // Payment-related errors
    if (message.includes('Payment required')) {
      return 'Payment is required to access this competition. Please complete payment to continue.';
    }
    
    if (message.includes('verification') || message.includes('Invalid payment signature')) {
      return 'Payment verification failed. Please try again or contact support.';
    }
    
    if (message.includes('Already paid')) {
      return 'You have already paid for this event.';
    }
    
    if (message.includes('Razorpay is not configured') || message.includes('payment system is not configured')) {
      return 'Payments are temporarily unavailable. Please contact support or try again later.';
    }
    
    if (message.includes('Invalid order')) {
      return 'Invalid payment order. Please try again.';
    }
    
    if (message.includes('Order does not belong')) {
      return 'Payment order verification failed. Please try again.';
    }
    
    if (message.includes('Order details do not match')) {
      return 'Payment details do not match. Please try again.';
    }
    
    if (message.includes('free competition')) {
      return 'This is a free competition. No payment required.';
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
    
    if (message.includes('Event is not part of this competition')) {
      return 'This event is not available in this competition.';
    }
    
    // Profile errors
    if (message.includes('profile') && message.includes('exist')) {
      return 'Please complete your profile setup first.';
    }
    
    // Actor/connection errors
    if (message.includes('Actor not available')) {
      return 'Connection error. Please refresh and try again.';
    }
    
    // Generic fallback
    return message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
