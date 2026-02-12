import { useState } from 'react';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import {
  useAdminGetAllCompetitions,
  useAdminGetResultsForCompetition,
  useAdminToggleResultVisibility,
  useAdminRecalculateLeaderboard,
} from '../../hooks/useQueries';
import { normalizeError } from '../../api/errors';
import { exportResultsToCSV } from '../../lib/csv';
import { Loader2, Download, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EVENT_LABELS, ALL_EVENTS } from '../../types/domain';
import { Event } from '../../backend';
import { Principal } from '@dfinity/principal';

export default function AdminResultsPage() {
  const { data: competitions, isLoading: competitionsLoading } = useAdminGetAllCompetitions();
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<bigint | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: results, isLoading: resultsLoading } = useAdminGetResultsForCompetition(
    selectedCompetitionId || BigInt(0),
    selectedEvent || Event.threeByThree
  );

  const toggleVisibilityMutation = useAdminToggleResultVisibility();
  const recalculateMutation = useAdminRecalculateLeaderboard();

  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);

  const handleToggleVisibility = async (userPrincipal: Principal) => {
    if (!selectedCompetitionId || !selectedEvent) return;

    const userKey = userPrincipal.toString();
    setTogglingVisibility(userKey);

    try {
      await toggleVisibilityMutation.mutateAsync({
        competitionId: selectedCompetitionId,
        event: selectedEvent,
        user: userPrincipal,
      });
      toast.success('Result visibility toggled');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setTogglingVisibility(null);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedCompetitionId || !selectedEvent) return;

    try {
      await recalculateMutation.mutateAsync({
        competitionId: selectedCompetitionId,
        event: selectedEvent,
      });
      toast.success('Leaderboard recalculated');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleExport = () => {
    if (!results || !selectedEvent) return;
    exportResultsToCSV(results, selectedEvent);
    toast.success('Results exported to CSV');
  };

  const competition = competitions && Array.isArray(competitions) 
    ? competitions.find((c) => c.id === selectedCompetitionId)
    : undefined;

  if (competitionsLoading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Manage Results</h1>

          <div className="grid gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">Select Competition</label>
              <Select
                value={selectedCompetitionId?.toString() || ''}
                onValueChange={(val) => setSelectedCompetitionId(val ? BigInt(val) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a competition" />
                </SelectTrigger>
                <SelectContent>
                  {competitions && Array.isArray(competitions) && competitions.map((comp) => (
                    <SelectItem key={comp.id.toString()} value={comp.id.toString()}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {competition && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Event</label>
                <Select
                  value={selectedEvent || ''}
                  onValueChange={(val) => setSelectedEvent(val as Event)}
                >
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
            )}
          </div>

          {selectedCompetitionId && selectedEvent && (
            <>
              <div className="flex gap-4 mb-6">
                <Button
                  onClick={handleRecalculate}
                  disabled={recalculateMutation.isPending}
                  variant="outline"
                >
                  {recalculateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Recalculate Leaderboard
                </Button>
                <Button onClick={handleExport} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              {resultsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !results || results.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No results found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {results.map((result) => (
                    <Card key={result.user.toString()}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {result.userProfile?.displayName || 'Anonymous'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {result.user.toString().slice(0, 20)}...
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                              {result.status}
                            </Badge>
                            {result.isHidden && <Badge variant="destructive">Hidden</Badge>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            {result.attempts.map((att, i) => (
                              <p key={i} className="text-sm">
                                Attempt {i + 1}: {Number(att.time) / 1000}s
                                {att.penalty > BigInt(0) && ` (+${Number(att.penalty) / 1000}s penalty)`}
                              </p>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleVisibility(result.user)}
                            disabled={togglingVisibility === result.user.toString()}
                          >
                            {togglingVisibility === result.user.toString() ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : result.isHidden ? (
                              <Eye className="h-4 w-4 mr-2" />
                            ) : (
                              <EyeOff className="h-4 w-4 mr-2" />
                            )}
                            {result.isHidden ? 'Show' : 'Hide'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
