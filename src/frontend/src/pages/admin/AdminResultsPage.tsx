import React, { useState } from 'react';
import {
  useAdminGetAllCompetitions,
  useAdminGetCompetitionResults,
  useAdminToggleResultVisibility,
} from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, EyeOff, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeError } from '../../api/errors';
import { AdminQueryErrorPanel } from '../../components/system/AdminQueryErrorPanel';
import { EVENT_LABELS } from '../../types/domain';
import { exportResultsToCSV } from '../../lib/csv';
import type { Event } from '../../backend';

export default function AdminResultsPage() {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<bigint | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: competitions, isLoading: compsLoading, isError: compsError, error: compsErrorObj, refetch: refetchComps } = useAdminGetAllCompetitions();
  const { data: results, isLoading: resultsLoading, isError: resultsError, error: resultsErrorObj, refetch: refetchResults } = useAdminGetCompetitionResults(selectedCompetitionId);
  const toggleVisibilityMutation = useAdminToggleResultVisibility();

  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const handleToggleVisibility = async (user: any, competitionId: bigint, event: Event, currentlyHidden: boolean) => {
    const key = `${user.toString()}-${event}`;
    setTogglingKey(key);
    try {
      await toggleVisibilityMutation.mutateAsync({ user, competitionId, event });
      toast.success(currentlyHidden ? 'Result is now visible' : 'Result is now hidden');
    } catch (err) {
      toast.error(normalizeError(err));
    } finally {
      setTogglingKey(null);
    }
  };

  const handleExportCSV = () => {
    if (!results || !selectedCompetitionId || !selectedEvent) return;

    const competition = competitions?.find(c => c.id === selectedCompetitionId);
    const competitionName = competition?.name || 'Competition';
    const eventName = EVENT_LABELS[selectedEvent] || selectedEvent;
    
    const filename = `${competitionName}_${eventName}_results.csv`;

    // Convert AdminResultEntry to CompetitionResult format for CSV export
    const filteredResults = results
      .filter(r => r.event === selectedEvent)
      .map(r => ({
        user: r.user,
        userProfile: undefined, // Admin results don't include full profile
        event: r.event,
        attempts: r.attempts,
        ao5: r.ao5,
        status: r.status,
      }));

    exportResultsToCSV(filteredResults, filename);
    toast.success('Results exported to CSV');
  };

  const filteredResults = results?.filter(r => r.event === selectedEvent) || [];

  if (compsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (compsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manage Results</h1>
          <p className="text-muted-foreground mt-2">View and manage competition results</p>
        </div>
        <AdminQueryErrorPanel
          error={compsErrorObj}
          onRetry={() => refetchComps()}
          title="Failed to Load Competitions"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Results</h1>
        <p className="text-muted-foreground mt-2">View and manage competition results</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Competition and Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Competition</label>
            <Select
              value={selectedCompetitionId?.toString() || ''}
              onValueChange={(value) => {
                setSelectedCompetitionId(BigInt(value));
                setSelectedEvent(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a competition" />
              </SelectTrigger>
              <SelectContent>
                {competitions?.map((comp) => (
                  <SelectItem key={comp.id.toString()} value={comp.id.toString()}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompetitionId && (
            <div>
              <label className="text-sm font-medium mb-2 block">Event</label>
              <Select
                value={selectedEvent || ''}
                onValueChange={(value) => setSelectedEvent(value as Event)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {competitions
                    ?.find((c) => c.id === selectedCompetitionId)
                    ?.events.map((event) => (
                      <SelectItem key={event} value={event}>
                        {EVENT_LABELS[event] || event}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCompetitionId && selectedEvent && (
        <>
          {resultsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {resultsError && (
            <AdminQueryErrorPanel
              error={resultsErrorObj}
              onRetry={() => refetchResults()}
              title="Failed to Load Results"
            />
          )}

          {!resultsLoading && !resultsError && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Results for {EVENT_LABELS[selectedEvent]} ({filteredResults.length})
                  </CardTitle>
                  {filteredResults.length > 0 && (
                    <Button onClick={handleExportCSV} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No results found for this event.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Ao5</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((result) => {
                        const key = `${result.user.toString()}-${result.event}`;
                        const isToggling = togglingKey === key;

                        return (
                          <TableRow key={key}>
                            <TableCell className="font-mono text-xs">
                              {result.user.toString().slice(0, 20)}...
                            </TableCell>
                            <TableCell>
                              {result.attempts.map((a, i) => (
                                <span key={i} className="mr-2">
                                  {Number(a.time) / 1000}s
                                </span>
                              ))}
                            </TableCell>
                            <TableCell>
                              {result.ao5 ? `${Number(result.ao5) / 1000}s` : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                                {result.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {result.isHidden ? (
                                <Badge variant="outline">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Hidden
                                </Badge>
                              ) : (
                                <Badge variant="default">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Visible
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleToggleVisibility(
                                    result.user,
                                    result.competitionId,
                                    result.event,
                                    result.isHidden
                                  )
                                }
                                disabled={isToggling}
                              >
                                {isToggling ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : result.isHidden ? (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Show
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Hide
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
