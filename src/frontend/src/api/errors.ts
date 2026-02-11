export function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Unauthorized')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('not found')) {
      return 'The requested resource was not found.';
    }
    if (error.message.includes('already exists')) {
      return 'This resource already exists.';
    }
    if (error.message.includes('Invalid attempt')) {
      return 'Invalid attempt submission. Please try again.';
    }
    if (error.message.includes('already completed')) {
      return 'This competition has already been completed.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
