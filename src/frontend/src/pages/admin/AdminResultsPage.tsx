import { useState } from 'react';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import {
  useAdminGetAllCompetitions,
  useAdminGetCompetitionResults,
  useAdminToggleResultVisibility,
} from '../../hooks/useQueries';
import { normalizeError } from '../../api/errors';
import { exportResultsToCSV } from '../../lib/csv';
import { EVENT_LABELS } from '../../types/domain';
import { Loader2, Download, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Event } from '../../backend';

export default function AdminResultsPage() {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<Event | '__ALL__'>('__ALL__');

  const { data: competitions = [], isLoading: loadingCompetitions } = useAdminGetAllCompetitions();
  const { data: results = [], isLoading: loadingResults } = useAdminGetCompetitionResults(
    selectedCompetitionId ? BigInt(selectedCompetitionId) : BigInt(0)
  );
  const toggleVisibilityMutation = useAdminToggleResultVisibility();

  const selectedCompetition = competitions.find((c) => c.id === BigInt(selectedCompetitionId || 0));

  const filteredResults = selectedEvent === '__ALL__'
    ? results
    : results.filter((r) => r.event === selectedEvent);

  const handleToggleVisibility = async (userId: string, event: Event, currentlyHidden: boolean) => {
    if (!selectedCompetitionId) return;

    try {
      await toggleVisibilityMutation.mutateAsync({
        user: { toText: () => userId } as any,
        competitionId: BigInt(selectedCompetitionId),
        event,
        hidden: !currentlyHidden,
      });
      toast.success(currentlyHidden ? 'Result shown' : 'Result hidden');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleExportCSV = () => {
    if (!selectedCompetition || filteredResults.length === 0) {
      toast.error('No results to export');
      return;
    }

    exportResultsToCSV(filteredResults, `${selectedCompetition.name}-results.csv`);
    toast.success('CSV exported successfully');
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Results Management</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Competition</label>
                <Select
                  value={selectedCompetitionId}
                  onValueChange={setSelectedCompetitionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a competition" />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map((comp) => (
                      <SelectItem key={comp.id.toString()} value={comp.id.toString()}>
                        {comp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompetition && (
                <div>
                  <label className="block text-sm font-medium mb-2">Event</label>
                  <Select
                    value={selectedEvent}
                    onValueChange={(val) => setSelectedEvent(val as Event | '__ALL__')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">All Events</SelectItem>
                      {selectedCompetition.events.map((event) => (
                        <SelectItem key={event} value={event}>
                          {EVENT_LABELS[event]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedCompetitionId && (
                <Button onClick={handleExportCSV} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              )}
            </CardContent>
          </Card>

          {loadingCompetitions || loadingResults ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedCompetitionId ? (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No results found for the selected filters
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ao5</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">
                            {result.user.toString().slice(0, 8)}...
                          </TableCell>
                          <TableCell>{EVENT_LABELS[result.event]}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                result.status === 'completed'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}
                            >
                              {result.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {result.ao5 ? `${(Number(result.ao5) / 1000).toFixed(2)}s` : 'DNF'}
                          </TableCell>
                          <TableCell>
                            {result.isHidden ? (
                              <span className="text-muted-foreground">Hidden</span>
                            ) : (
                              <span className="text-green-600">Visible</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleVisibility(
                                  result.user.toString(),
                                  result.event,
                                  result.isHidden
                                )
                              }
                              disabled={toggleVisibilityMutation.isPending}
                            >
                              {result.isHidden ? (
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
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Select a competition to view results
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
