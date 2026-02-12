import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  useGetCompetition,
  useStartCompetition,
  useGetUserResult,
  useConfirmPayment,
  useCreateRazorpayOrder,
  useIsRazorpayConfigured,
} from '../hooks/useQueries';
import { useGetCallerUserProfile } from '../hooks/useCurrentUserProfile';
import { Calendar, Users, Trophy, Play, Loader2, BarChart3, CreditCard, AlertCircle } from 'lucide-react';
import { formatDate } from '../lib/dateUtils';
import RequireAuth from '../components/auth/RequireAuth';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Event } from '../backend';
import { EVENT_LABELS, DEFAULT_EVENT } from '../types/domain';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loadRazorpayScript, openRazorpayCheckout } from '../lib/razorpay';
import { toast } from 'sonner';
import { normalizeError } from '../api/errors';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../api/queryKeys';

export default function CompetitionDetailPage() {
  const { competitionId } = useParams({ from: '/competition/$competitionId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  const [selectedEvent, setSelectedEvent] = useState<Event>(DEFAULT_EVENT);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { data: competition, isLoading } = useGetCompetition(BigInt(competitionId));
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: myResult, isLoading: resultLoading } = useGetUserResult(BigInt(competitionId), selectedEvent);
  const { data: isRazorpayConfigured, isLoading: configLoading } = useIsRazorpayConfigured();
  const startCompetition = useStartCompetition();
  const confirmPayment = useConfirmPayment();
  const createRazorpayOrder = useCreateRazorpayOrder();

  useEffect(() => {
    if (competition && competition.events.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const eventParam = urlParams.get('event');
      if (eventParam && competition.events.includes(eventParam as Event)) {
        setSelectedEvent(eventParam as Event);
      } else {
        setSelectedEvent(competition.events[0]);
      }
    }
  }, [competition]);

  // Set persistent error when Razorpay is not configured
  useEffect(() => {
    if (competition?.entryFee && isRazorpayConfigured === false) {
      setPaymentError('Payments are temporarily unavailable. Please contact support or try again later.');
    } else if (competition?.entryFee && isRazorpayConfigured === true) {
      // Clear error if Razorpay becomes available
      setPaymentError(null);
    }
  }, [isRazorpayConfigured, competition?.entryFee]);

  const handleEventChange = (event: Event) => {
    setSelectedEvent(event);
    setPaymentError(null); // Clear error when changing events
    const url = new URL(window.location.href);
    url.searchParams.set('event', event);
    window.history.pushState({}, '', url);
  };

  const handlePayAndStart = async () => {
    console.log('[pay_click]', { competitionId, event: selectedEvent });

    // Explicit prerequisite checks with user-facing feedback
    if (!competition) {
      console.error('[pay_error] Competition data missing');
      toast.error('Competition data is unavailable. Please refresh the page.');
      return;
    }

    if (!competition.entryFee) {
      console.error('[pay_error] Entry fee missing for paid competition');
      toast.error('Competition entry fee information is missing.');
      return;
    }

    if (profileLoading) {
      console.log('[pay_blocked] User profile still loading');
      toast.error('Please wait while we load your profile...');
      return;
    }

    if (!userProfile) {
      console.error('[pay_error] User profile not found');
      toast.error('Please complete your profile setup before making a payment.');
      return;
    }

    // Pre-check: Razorpay configuration
    if (configLoading) {
      console.log('[pay_blocked] Payment configuration still loading');
      toast.error('Checking payment availability...');
      return;
    }

    if (isRazorpayConfigured === false) {
      console.error('[pay_error] Razorpay not configured');
      const errorMsg = 'Payments are temporarily unavailable. Please contact support or try again later.';
      setPaymentError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // Step 1: Load Razorpay script
      console.log('[razorpay_script_loading]');
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        console.error('[razorpay_script_failed]');
        toast.error('Failed to load payment gateway. Please try again.');
        setIsProcessingPayment(false);
        return;
      }
      console.log('[razorpay_script_loaded]');

      // Step 2: Create order via backend
      console.log('[order_creating]', { competitionId, event: selectedEvent });
      const orderData = await createRazorpayOrder.mutateAsync({
        competitionId: BigInt(competitionId),
        event: selectedEvent,
      });
      console.log('[order_created]', { orderId: orderData.orderId, amount: orderData.amount });

      // Step 3: Open Razorpay checkout with real order
      console.log('[checkout_opening]');
      const response = await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: Number(orderData.amount),
        currency: orderData.currency,
        competitionName: orderData.competitionName,
        userName: userProfile.displayName,
      });
      console.log('[checkout_completed]', { orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id });

      // Step 4: Confirm payment with backend
      console.log('[payment_confirming]');
      await confirmPayment.mutateAsync({
        competitionId: BigInt(competitionId),
        event: selectedEvent,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      console.log('[payment_confirmed]');

      toast.success('Payment verified! Starting competition...');

      // Step 5: Start the competition
      console.log('[competition_starting]');
      await startCompetition.mutateAsync({ competitionId: BigInt(competitionId), event: selectedEvent });
      console.log('[competition_started]');

      // Step 6: Invalidate queries and navigate
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResult(BigInt(competitionId), selectedEvent) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competition(BigInt(competitionId)) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paymentHistory });

      navigate({
        to: '/competition/$competitionId/solve',
        params: { competitionId },
        search: { event: selectedEvent },
      });
    } catch (error: any) {
      console.error('[payment_error]', { competitionId, event: selectedEvent, error: error.message });
      const errorMessage = normalizeError(error);
      
      // Check if it's a configuration error
      if (error.message && (error.message.includes('Razorpay is not configured') || error.message.includes('payment system is not configured'))) {
        setPaymentError(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleStart = async () => {
    if (!competition) return;

    // If payment is required, use payment flow
    if (competition.entryFee) {
      await handlePayAndStart();
      return;
    }

    // Free competition - just start
    try {
      await startCompetition.mutateAsync({ competitionId: BigInt(competitionId), event: selectedEvent });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResult(BigInt(competitionId), selectedEvent) });
      
      navigate({
        to: '/competition/$competitionId/solve',
        params: { competitionId },
        search: { event: selectedEvent },
      });
    } catch (error) {
      console.error('Failed to start competition:', error);
      const errorMessage = normalizeError(error);
      toast.error(errorMessage);
    }
  };

  const handleContinue = () => {
    navigate({
      to: '/competition/$competitionId/solve',
      params: { competitionId },
      search: { event: selectedEvent },
    });
  };

  const handleViewLeaderboard = () => {
    navigate({
      to: '/competition/$competitionId/leaderboard',
      params: { competitionId },
      search: { event: selectedEvent },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-chart-1 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading competition...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Competition Not Found</h2>
          <p className="text-muted-foreground">The competition you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    upcoming: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
    running: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
    completed: 'bg-muted text-muted-foreground border-border',
  };

  const statusLabels = {
    upcoming: 'Upcoming',
    running: 'Live',
    completed: 'Completed',
  };

  const canStart = isAuthenticated && competition.status === 'running' && !myResult;
  const canContinue = isAuthenticated && myResult?.status === 'in_progress';
  const isCompleted = myResult?.status === 'completed';
  const isPaidCompetition = !!competition.entryFee;
  
  // Compute button disabled state
  const isPayButtonDisabled = isPaidCompetition && (
    configLoading || 
    profileLoading || 
    isRazorpayConfigured === false || 
    !userProfile || 
    !!paymentError
  );

  // Compute button label
  const getPayButtonLabel = () => {
    if (isProcessingPayment) {
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      );
    }
    
    if (configLoading) {
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Checking payments...
        </>
      );
    }
    
    if (profileLoading) {
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading profile...
        </>
      );
    }
    
    if (isPaidCompetition) {
      return (
        <>
          <CreditCard className="w-5 h-5" />
          Pay ₹{competition.entryFee?.toString()} & Start
        </>
      );
    }
    
    return (
      <>
        <Play className="w-5 h-5" />
        Start Competition
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{competition.name}</h1>
              {competition.events.length > 1 ? (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Select Event</label>
                  <Select value={selectedEvent} onValueChange={handleEventChange}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
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
              ) : (
                <p className="text-muted-foreground">Event: {EVENT_LABELS[competition.events[0]]}</p>
              )}
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border ${statusColors[competition.status]}`}
            >
              {statusLabels[competition.status]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(competition.startDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(competition.endDate)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {competition.participantLimit && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Participant Limit</p>
                    <p className="font-medium">{competition.participantLimit.toString()}</p>
                  </div>
                </div>
              )}
              {competition.entryFee && (
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Entry Fee</p>
                    <p className="font-medium">₹{competition.entryFee.toString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {paymentError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{paymentError}</AlertDescription>
            </Alert>
          )}

          {isPaidCompetition && !profileFetched && profileLoading && (
            <Alert className="mb-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Loading your profile...</AlertDescription>
            </Alert>
          )}

          {isPaidCompetition && profileFetched && !userProfile && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please complete your profile setup before making a payment.</AlertDescription>
            </Alert>
          )}

          <RequireAuth message="Please log in to participate in this competition">
            <div className="flex gap-4">
              {canStart && (
                <button
                  onClick={handleStart}
                  disabled={isProcessingPayment || isPayButtonDisabled}
                  className="flex-1 bg-chart-1 hover:bg-chart-1/90 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {getPayButtonLabel()}
                </button>
              )}

              {canContinue && (
                <button
                  onClick={handleContinue}
                  className="flex-1 bg-chart-1 hover:bg-chart-1/90 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Continue Competition
                </button>
              )}

              {(isCompleted || competition.status === 'completed') && (
                <button
                  onClick={handleViewLeaderboard}
                  className="flex-1 bg-chart-2 hover:bg-chart-2/90 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  View Leaderboard
                </button>
              )}

              {!canStart && !canContinue && !isCompleted && competition.status === 'running' && (
                <div className="flex-1 text-center py-3 text-muted-foreground">
                  {resultLoading ? 'Loading...' : 'Competition status unavailable'}
                </div>
              )}

              {competition.status === 'upcoming' && (
                <div className="flex-1 text-center py-3 text-muted-foreground">
                  Competition starts on {formatDate(competition.startDate)}
                </div>
              )}
            </div>
          </RequireAuth>
        </div>

        {myResult && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-chart-1" />
              <h2 className="text-xl font-bold">Your Progress</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{myResult.status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attempts Completed:</span>
                <span className="font-medium">
                  {myResult.attempts.filter((a) => Number(a.time) > 0).length} / 5
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
