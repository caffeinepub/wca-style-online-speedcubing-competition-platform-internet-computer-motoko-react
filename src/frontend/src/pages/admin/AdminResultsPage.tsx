import { useState } from 'react';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import {
  useAdminGetAllCompetitions,
  useAdminGetCompetitionResults,
  useAdminToggleResultVisibility,
} from '../../hooks/useQueries';
import { normalizeError } from '../../api/errors';
import { Loader2, Eye, EyeOff, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EVENT_LABELS } from '../../types/domain';
import { generateCSV, downloadCSV } from '../../lib/csv';
import type { Event } from '../../backend';

const ALL_EVENTS_SENTINEL = '__ALL__';

export default function AdminResultsPage() {
  const { data: competitions = [], isLoading: loadingCompetitions } = useAdminGetAllCompetitions();
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>(ALL_EVENTS_SENTINEL);

  const { data: results = [], isLoading: loadingResults } = useAdminGetCompetitionResults(
    selectedCompetitionId ? BigInt(selectedCompetitionId) : BigInt(0)
  );

  const toggleVisibilityMutation = useAdminToggleResultVisibility();
  const [actioningResult, setActioningResult] = useState<string | null>(null);

  const selectedCompetition = competitions.find((c) => c.id.toString() === selectedCompetitionId);

  const filteredResults = selectedEvent !== ALL_EVENTS_SENTINEL
    ? results.filter((r) => r.event === selectedEvent)
    : results;

  const handleToggleVisibility = async (
    user: any,
    competitionId: bigint,
    event: Event,
    currentlyHidden: boolean
  ) => {
    const key = `${user.toString()}-${event}`;
    setActioningResult(key);
    try {
      await toggleVisibilityMutation.mutateAsync({
        user,
        competitionId,
        event,
        hidden: !currentlyHidden,
      });
      toast.success(currentlyHidden ? 'Result shown' : 'Result hidden');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningResult(null);
    }
  };

  const handleExportCSV = () => {
    if (!selectedCompetition || filteredResults.length === 0) {
      toast.error('No results to export');
      return;
    }

    const headers = ['User Principal', 'Event', 'Status', 'Hidden', 'Attempts'];
    const rows = filteredResults.map((result) => [
      result.user.toString(),
      EVENT_LABELS[result.event],
      result.status,
      result.isHidden ? 'Yes' : 'No',
      result.attempts
        .map((att, i) => `${i + 1}: ${Number(att.time) / 1000}s`)
        .join('; '),
    ]);

    const csv = generateCSV(headers, rows);
    downloadCSV(csv, `${selectedCompetition.slug}-results.csv`);
    toast.success('CSV exported successfully');
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Manage Results</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="competition">Competition</Label>
                  <Select
                    value={selectedCompetitionId}
                    onValueChange={(val) => {
                      setSelectedCompetitionId(val);
                      setSelectedEvent(ALL_EVENTS_SENTINEL);
                    }}
                  >
                    <SelectTrigger id="competition">
                      <SelectValue placeholder="Select competition" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(competitions) && competitions.map((comp) => (
                        <SelectItem key={comp.id.toString()} value={comp.id.toString()}>
                          {comp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="event">Event (optional)</Label>
                  <Select
                    value={selectedEvent}
                    onValueChange={(val) => setSelectedEvent(val)}
                    disabled={!selectedCompetitionId}
                  >
                    <SelectTrigger id="event">
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_EVENTS_SENTINEL}>All events</SelectItem>
                      {selectedCompetition?.events.map((event) => (
                        <SelectItem key={event} value={event}>
                          {EVENT_LABELS[event]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedCompetitionId && (
                <Button onClick={handleExportCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </CardContent>
          </Card>

          {loadingCompetitions || loadingResults ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !selectedCompetitionId ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Select a competition to view results</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredResults.map((result) => {
                const key = `${result.user.toString()}-${result.event}`;
                return (
                  <Card key={key}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {result.user.toString().slice(0, 20)}...
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {EVENT_LABELS[result.event]}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={result.status === 'completed' ? 'default' : 'outline'}>
                            {result.status}
                          </Badge>
                          {result.isHidden && <Badge variant="destructive">Hidden</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {result.attempts.map((att, i) => (
                          <p key={i} className="text-sm">
                            Attempt {i + 1}: {Number(att.time) / 1000}s
                            {att.penalty > 0 && ` (+${Number(att.penalty) / 1000}s penalty)`}
                          </p>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleToggleVisibility(
                            result.user,
                            BigInt(selectedCompetitionId),
                            result.event,
                            result.isHidden
                          )
                        }
                        disabled={actioningResult === key}
                      >
                        {actioningResult === key ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : result.isHidden ? (
                          <Eye className="h-4 w-4 mr-2" />
                        ) : (
                          <EyeOff className="h-4 w-4 mr-2" />
                        )}
                        {result.isHidden ? 'Show' : 'Hide'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
