import React, { useState } from 'react';
import {
  useAdminGetAllCompetitions,
  useAdminGetCompetitionResults,
  useAdminToggleResultVisibility,
} from '../../hooks/useQueries';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { normalizeError } from '../../api/errors';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle, Loader2, Download } from 'lucide-react';
import { Event } from '../../backend';
import { EVENT_LABELS } from '../../types/domain';
import { generateCSV, downloadCSV } from '../../lib/csv';
import AdminGuard from '../../components/auth/AdminGuard';

export default function AdminResultsPage() {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<bigint | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: competitions, isLoading: competitionsLoading } = useAdminGetAllCompetitions();
  const {
    data: results,
    isLoading: resultsLoading,
    isError: resultsError,
    error: resultsErrorObj,
  } = useAdminGetCompetitionResults(selectedCompetitionId, selectedEvent);
  const toggleVisibilityMutation = useAdminToggleResultVisibility();

  const selectedCompetition = competitions?.find((c) => c.id === selectedCompetitionId);
  const availableEvents = selectedCompetition?.events || [];

  const handleCompetitionChange = (competitionId: string) => {
    setSelectedCompetitionId(BigInt(competitionId));
    setSelectedEvent(null);
  };

  const handleEventChange = (event: string) => {
    if (event === 'all') {
      setSelectedEvent(null);
    } else {
      setSelectedEvent(event as Event);
    }
  };

  const handleToggleVisibility = async (user: any, competitionId: bigint, event: Event, currentlyHidden: boolean) => {
    try {
      await toggleVisibilityMutation.mutateAsync({
        competitionId,
        event,
        user,
        hidden: !currentlyHidden,
      });
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    }
  };

  const handleExportCSV = () => {
    if (!results || !selectedCompetition || !selectedEvent) return;

    const headers = ['User', 'Event', 'Ao5', 'Attempt 1', 'Attempt 2', 'Attempt 3', 'Attempt 4', 'Attempt 5', 'Status', 'Hidden'];
    const rows = results.map((r) => [
      r.user.toString(),
      EVENT_LABELS[r.event],
      r.ao5 ? `${(Number(r.ao5) / 1000).toFixed(2)}` : 'N/A',
      `${(Number(r.attempts[0]?.time || 0) / 1000).toFixed(2)}`,
      `${(Number(r.attempts[1]?.time || 0) / 1000).toFixed(2)}`,
      `${(Number(r.attempts[2]?.time || 0) / 1000).toFixed(2)}`,
      `${(Number(r.attempts[3]?.time || 0) / 1000).toFixed(2)}`,
      `${(Number(r.attempts[4]?.time || 0) / 1000).toFixed(2)}`,
      r.status,
      r.isHidden ? 'Yes' : 'No',
    ]);

    const csv = generateCSV(headers, rows);
    downloadCSV(csv, `${selectedCompetition.name}_${EVENT_LABELS[selectedEvent]}_results.csv`);
  };

  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Results Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Competition</label>
                {competitionsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Select
                    value={selectedCompetitionId?.toString() || ''}
                    onValueChange={handleCompetitionChange}
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
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Event</label>
                <Select
                  value={selectedEvent || 'all'}
                  onValueChange={handleEventChange}
                  disabled={!selectedCompetitionId || availableEvents.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvents.map((event) => (
                      <SelectItem key={event} value={event}>
                        {EVENT_LABELS[event]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {resultsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {resultsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {normalizeError(resultsErrorObj)}
                </AlertDescription>
              </Alert>
            )}

            {!resultsLoading && !resultsError && selectedCompetitionId && selectedEvent && results && results.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No results found for this competition and event
              </div>
            )}

            {!resultsLoading && !resultsError && results && results.length > 0 && (
              <>
                <div className="flex justify-end">
                  <Button onClick={handleExportCSV} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Ao5</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={`${result.user.toString()}-${result.event}`}>
                          <TableCell className="font-mono text-xs">
                            {result.user.toString().slice(0, 20)}...
                          </TableCell>
                          <TableCell>{EVENT_LABELS[result.event]}</TableCell>
                          <TableCell>
                            {result.ao5 ? `${(Number(result.ao5) / 1000).toFixed(2)}s` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {result.attempts.map((a, i) => (
                              <span key={i} className="mr-2">
                                {(Number(a.time) / 1000).toFixed(2)}s
                              </span>
                            ))}
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                              {result.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {result.isHidden ? (
                              <Badge variant="destructive">Hidden</Badge>
                            ) : (
                              <Badge variant="default">Visible</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleToggleVisibility(
                                  result.user,
                                  result.competitionId,
                                  result.event,
                                  result.isHidden
                                )
                              }
                              disabled={toggleVisibilityMutation.isPending}
                            >
                              {toggleVisibilityMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : result.isHidden ? (
                                'Show'
                              ) : (
                                'Hide'
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {toggleVisibilityMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {normalizeError(toggleVisibilityMutation.error)}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
