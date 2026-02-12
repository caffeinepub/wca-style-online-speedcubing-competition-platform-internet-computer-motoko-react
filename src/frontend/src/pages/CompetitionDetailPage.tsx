import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import RequireAuth from '../components/auth/RequireAuth';
import {
  useGetCompetition,
  useGetUserResult,
  useStartCompetition,
  useCreateRazorpayOrder,
  useConfirmPayment,
  useHasRazorpayConfig,
  type PaymentConfirmation,
} from '../hooks/useQueries';
import { storeSolveSession } from '../lib/solveSession';
import { normalizeError } from '../api/errors';
import { openRazorpayCheckout } from '../lib/razorpay';
import { formatFeeSummary, isCompetitionPaid } from '../lib/competitionPricing';
import { formatDateTime } from '../lib/dateUtils';
import { EVENT_LABELS } from '../types/domain';
import { ArrowLeft, Loader2, Play, Lock, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Event } from '../backend';

export default function CompetitionDetailPage() {
  const navigate = useNavigate();
  const { competitionId } = useParams({ strict: false }) as { competitionId: string };
  const [selectedEvent, setSelectedEvent] = useState<Event | ''>('');

  const { data: competition, isLoading } = useGetCompetition(BigInt(competitionId));
  const { data: myResult } = useGetUserResult(
    BigInt(competitionId),
    selectedEvent as Event
  );
  const { data: hasRazorpayConfig, isLoading: configLoading } = useHasRazorpayConfig();
  const startCompetitionMutation = useStartCompetition();
  const createOrderMutation = useCreateRazorpayOrder();
  const confirmPaymentMutation = useConfirmPayment();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Check if registration is gated
  const isRegistrationGated = competition?.status === 'upcoming' && 
    competition.registrationStartDate !== undefined &&
    Date.now() * 1000000 < Number(competition.registrationStartDate);

  // Check if payment system is configured for paid competitions
  const requiresPayment = isCompetitionPaid(competition?.feeMode);
  const paymentSystemNotConfigured = requiresPayment && hasRazorpayConfig === false;

  const handleStartCompetition = async () => {
    if (!selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    // Block if payment system is not configured
    if (paymentSystemNotConfigured) {
      toast.error('Payment system not configured');
      return;
    }

    // Check if payment is required
    if (requiresPayment) {
      // Check if already paid (myResult exists means payment was made)
      if (!myResult) {
        await handlePayment();
        return;
      }
    }

    // Start or resume competition session
    try {
      const sessionToken = await startCompetitionMutation.mutateAsync({
        competitionId: BigInt(competitionId),
        event: selectedEvent as Event,
      });

      // Always store the session token (for both new and resumed sessions)
      storeSolveSession(competitionId, selectedEvent, sessionToken);

      // Navigate to solve flow
      navigate({ to: `/competitions/${competitionId}/solve/${selectedEvent}` });
    } catch (error) {
      const errorMessage = normalizeError(error);
      // If it's a resume message, treat it as success
      if (errorMessage.includes('Resuming your existing session')) {
        toast.info(errorMessage);
        // Still navigate to solve flow
        navigate({ to: `/competitions/${competitionId}/solve/${selectedEvent}` });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handlePayment = async () => {
    if (!selectedEvent || !competition) return;

    setIsProcessingPayment(true);

    try {
      // Create order - backend determines the amount
      const orderResponse = await createOrderMutation.mutateAsync({
        competitionId: BigInt(competitionId),
        event: selectedEvent as Event,
      });

      // Load Razorpay and process payment with backend-provided amount
      const paymentResult = await openRazorpayCheckout({
        orderId: orderResponse.orderId,
        amount: Number(orderResponse.amount),
        currency: orderResponse.currency,
        competitionName: `${orderResponse.competitionName} - ${EVENT_LABELS[orderResponse.event]}`,
      });

      // Confirm payment with backend
      const paymentConfirmation: PaymentConfirmation = {
        competitionId: BigInt(competitionId),
        event: selectedEvent as Event,
        razorpayOrderId: paymentResult.razorpay_order_id,
        razorpayPaymentId: paymentResult.razorpay_payment_id,
        razorpaySignature: paymentResult.razorpay_signature,
      };

      await confirmPaymentMutation.mutateAsync(paymentConfirmation);
      toast.success('Payment successful! You can now start the competition.');

      // Now start the competition
      const sessionToken = await startCompetitionMutation.mutateAsync({
        competitionId: BigInt(competitionId),
        event: selectedEvent as Event,
      });

      storeSolveSession(competitionId, selectedEvent, sessionToken);
      navigate({ to: `/competitions/${competitionId}/solve/${selectedEvent}` });
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleViewLeaderboard = () => {
    if (!selectedEvent) {
      toast.error('Please select an event');
      return;
    }
    navigate({
      to: `/competitions/${competitionId}/leaderboard`,
      search: { event: selectedEvent },
    });
  };

  if (isLoading || configLoading) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RequireAuth>
    );
  }

  if (!competition) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Competition not found</p>
        </div>
      </RequireAuth>
    );
  }

  const hasPaid = myResult !== null;
  const canStart = !requiresPayment || hasPaid;

  const resultStatus = myResult?.status as string | undefined;
  const isCompleted = resultStatus === 'completed';
  const isInProgress = resultStatus === 'in_progress';

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/competitions' })}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Competitions
          </Button>

          <div className="bg-card rounded-lg border p-8">
            <h1 className="text-4xl font-bold mb-4">{competition.name}</h1>
            
            {requiresPayment && (
              <div className="mb-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">
                  Entry Fee: {formatFeeSummary(competition.feeMode)}
                </p>
              </div>
            )}

            {paymentSystemNotConfigured && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Payments are temporarily unavailable. Please contact the administrator to configure the payment system.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Select Event</label>
                <Select value={selectedEvent} onValueChange={(val) => setSelectedEvent(val as Event)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {competition.events.map((event) => (
                      <SelectItem key={event} value={event}>
                        {EVENT_LABELS[event]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEvent && (
                <div className="space-y-4">
                  {isCompleted && (
                    <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <p className="text-green-800 dark:text-green-400 font-medium">
                        You have completed this event!
                      </p>
                    </div>
                  )}

                  {isInProgress && (
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <p className="text-yellow-800 dark:text-yellow-400 font-medium">
                        You have an in-progress session for this event. Click below to resume.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleStartCompetition}
                    disabled={
                      !selectedEvent ||
                      isCompleted ||
                      isRegistrationGated ||
                      paymentSystemNotConfigured ||
                      startCompetitionMutation.isPending ||
                      isProcessingPayment
                    }
                    className="w-full"
                    size="lg"
                  >
                    {(startCompetitionMutation.isPending || isProcessingPayment) && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    {requiresPayment && !hasPaid && <Lock className="mr-2 h-5 w-5" />}
                    {isCompleted
                      ? 'Completed'
                      : isInProgress
                      ? 'Resume Competition'
                      : requiresPayment && !hasPaid
                      ? 'Pay & Start'
                      : 'Start Competition'}
                  </Button>

                  {isRegistrationGated && competition.registrationStartDate && (
                    <p className="text-sm text-center text-muted-foreground">
                      Registration opens at {formatDateTime(competition.registrationStartDate)}
                    </p>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleViewLeaderboard}
                    className="w-full"
                    size="lg"
                  >
                    <BarChart3 className="mr-2 h-5 w-5" />
                    View Leaderboard
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
