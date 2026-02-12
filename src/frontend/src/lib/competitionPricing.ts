import type { FeeMode } from '../types/backend-extended';

/**
 * Determines if a competition is paid based on its fee mode
 */
export function isCompetitionPaid(feeMode?: FeeMode): boolean {
  if (!feeMode) return false;
  
  if (feeMode.perEvent && feeMode.perEvent > BigInt(0)) return true;
  if (feeMode.basePlusAdditional && feeMode.basePlusAdditional.baseFee > BigInt(0)) return true;
  if (feeMode.allEventsFlat && feeMode.allEventsFlat > BigInt(0)) return true;
  
  return false;
}

/**
 * Formats a fee summary string for display
 */
export function formatFeeSummary(feeMode?: FeeMode): string {
  if (!feeMode) return 'Free';
  
  if (feeMode.perEvent) {
    return `₹${feeMode.perEvent.toString()} per event`;
  }
  
  if (feeMode.basePlusAdditional) {
    const { baseFee, additionalFee } = feeMode.basePlusAdditional;
    return `₹${baseFee.toString()} first event, then ₹${additionalFee.toString()} per additional event`;
  }
  
  if (feeMode.allEventsFlat) {
    return `₹${feeMode.allEventsFlat.toString()} for all events`;
  }
  
  return 'Free';
}

/**
 * Gets the display amount for a specific pricing mode (for UI purposes only)
 * Note: The actual payment amount is always determined by the backend
 */
export function getDisplayAmount(feeMode?: FeeMode): string {
  if (!feeMode) return '0';
  
  if (feeMode.perEvent) {
    return feeMode.perEvent.toString();
  }
  
  if (feeMode.basePlusAdditional) {
    return feeMode.basePlusAdditional.baseFee.toString();
  }
  
  if (feeMode.allEventsFlat) {
    return feeMode.allEventsFlat.toString();
  }
  
  return '0';
}
