import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import {
  useAdminGetAllCompetitions,
  useAdminGetResultsForCompetition,
  useAdminRecalculateLeaderboard,
  useAdminToggleLeaderboardVisibility,
} from '../../hooks/useQueries';
import { ArrowLeft, Download, RefreshCw, Loader2, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { normalizeError } from '../../api/errors';
import { EVENT_LABELS } from '../../types/domain';
import { exportResultsToCSV } from '../../lib/csv';
import type { Event } from '../../backend';

export default function AdminResultsPage() {
  const navigate = useNavigate();
  const { data: competitions = [], isLoading: loadingCompetitions } = useAdminGetAllCompetitions();
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<Event | ''>('');

  const { data: results = [], isLoading: loadingResults, refetch } = useAdminGetResultsForCompetition(
    selectedCompetitionId ? BigInt(selectedCompetitionId) : BigInt(0),
    selectedEvent as Event
  );

  const recalculateMutation = useAdminRecalculateLeaderboard();
  const toggleVisibilityMutation = useAdminToggleLeaderboardVisibility();

  const selectedCompetition = competitions.find(c => c.id.toString() === selectedCompetitionId);
  const availableEvents = selectedCompetition?.events || [];

  const handleRecalculate = async () => {
    if (!selectedCompetitionId || !selectedEvent) {
      toast.error('Please select both competition and event');
      return;
    }

    try {
      await recalculateMutation.mutateAsync({
        competitionId: BigInt(selectedCompetitionId),
        event: selectedEvent as Event,
      });
      toast.success('Leaderboard recalculated successfully');
      refetch();
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleDownloadCSV = () => {
    if (!selectedCompetitionId || !selectedEvent || results.length === 0) {
      toast.error('No results to download');
      return;
    }

    const competition = competitions.find(c => c.id.toString() === selectedCompetitionId);
    const filename = `${competition?.name || 'competition'}_${selectedEvent}_results.csv`;
    
    exportResultsToCSV(results, filename);
    toast.success('CSV downloaded successfully');
  };

  const handleToggleVisibility = async (userPrincipal: string, isCurrentlyHidden: boolean) => {
    if (!selectedCompetitionId || !selectedEvent) return;

    try {
      await toggleVisibilityMutation.mutateAsync({
        user: userPrincipal,
        competitionId: BigInt(selectedCompetitionId),
        event: selectedEvent as Event,
      });
      toast.success(isCurrentlyHidden ? 'Result unhidden from leaderboard' : 'Result hidden from leaderboard');
      refetch();
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/admin' })}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
            <h1 className="text-4xl font-bold">Results Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage competition results
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Competition</label>
                <Select
                  value={selectedCompetitionId}
                  onValueChange={(val) => {
                    setSelectedCompetitionId(val);
                    setSelectedEvent('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select competition" />
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Event</label>
                <Select
                  value={selectedEvent}
                  onValueChange={(val) => setSelectedEvent(val as Event)}
                  disabled={!selectedCompetitionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
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

            <div className="flex gap-2">
              <Button
                onClick={handleRecalculate}
                disabled={!selectedCompetitionId || !selectedEvent || recalculateMutation.isPending}
              >
                {recalculateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Recalculate Leaderboard
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadCSV}
                disabled={!selectedCompetitionId || !selectedEvent || results.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </div>

          {loadingResults ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !selectedCompetitionId || !selectedEvent ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Select a competition and event to view results</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found for this competition and event</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>MCubes ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => {
                    const isHidden = result.isHidden;
                    
                    return (
                      <TableRow key={result.user.toString()}>
                        <TableCell className="font-medium">
                          {result.userProfile?.displayName || 'Unknown'}
                        </TableCell>
                        <TableCell>{result.userProfile?.mcubesId || '-'}</TableCell>
                        <TableCell>
                          {result.status === 'completed' ? (
                            <span className="text-green-600 dark:text-green-400">Completed</span>
                          ) : result.status === 'in_progress' ? (
                            <span className="text-yellow-600 dark:text-yellow-400">In Progress</span>
                          ) : (
                            <span className="text-muted-foreground">Not Started</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {result.attempts.map((att, i) => (
                              <span key={i} className="text-sm">
                                {Number(att.time) === 0 && Number(att.penalty) === 0
                                  ? '-'
                                  : `${(Number(att.time) / 1000).toFixed(2)}s`}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleVisibility(result.user.toString(), isHidden)}
                            disabled={toggleVisibilityMutation.isPending}
                            title={isHidden ? 'Unhide from leaderboard' : 'Hide from leaderboard'}
                          >
                            {isHidden ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
