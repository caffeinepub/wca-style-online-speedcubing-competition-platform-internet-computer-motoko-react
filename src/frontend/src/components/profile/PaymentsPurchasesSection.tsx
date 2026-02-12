import { useGetUserPaymentHistory } from '../../hooks/useQueries';
import { Loader2, CreditCard, Calendar, Trophy } from 'lucide-react';
import { formatDate } from '../../lib/dateUtils';
import { EVENT_LABELS } from '../../types/domain';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PaymentsPurchasesSection() {
  const { data: payments, isLoading, error } = useGetUserPaymentHistory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-chart-1" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load payment history. Please try again.</p>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
        <p className="text-muted-foreground">
          Your competition entry payments will appear here.
        </p>
      </div>
    );
  }

  // Sort by most recent first
  const sortedPayments = [...payments].sort((a, b) => {
    const timeA = Number(a.paymentDate);
    const timeB = Number(b.paymentDate);
    return timeB - timeA;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-chart-1" />
        <h3 className="text-lg font-semibold">Payment History</h3>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {sortedPayments.map((payment, index) => (
            <Card key={index} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-chart-1" />
                      {payment.competitionName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {EVENT_LABELS[payment.event]}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                    Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Amount</p>
                    <p className="font-semibold">₹{Number(payment.entryFee)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date
                    </p>
                    <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Payment ID: {payment.razorpayPaymentId.slice(0, 20)}...
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
