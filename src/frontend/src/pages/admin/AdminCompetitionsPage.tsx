import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import {
  useAdminGetAllCompetitions,
  useAdminDeleteCompetition,
  useAdminLockCompetition,
  useAdminActivateCompetition,
} from '../../hooks/useQueries';
import { normalizeError } from '../../api/errors';
import { Loader2, Plus, Edit, Trash2, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '../../lib/dateUtils';

export default function AdminCompetitionsPage() {
  const { data: competitions, isLoading } = useAdminGetAllCompetitions();
  const deleteCompetitionMutation = useAdminDeleteCompetition();
  const lockCompetitionMutation = useAdminLockCompetition();
  const activateCompetitionMutation = useAdminActivateCompetition();

  const [actioningCompetition, setActioningCompetition] = useState<string | null>(null);

  const handleDeleteCompetition = async (competitionId: bigint, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    setActioningCompetition(competitionId.toString());
    try {
      await deleteCompetitionMutation.mutateAsync(competitionId);
      toast.success('Competition deleted successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningCompetition(null);
    }
  };

  const handleToggleLock = async (competitionId: bigint, currentlyLocked: boolean) => {
    setActioningCompetition(competitionId.toString());
    try {
      await lockCompetitionMutation.mutateAsync({
        competitionId,
        locked: !currentlyLocked,
      });
      toast.success(currentlyLocked ? 'Competition unlocked' : 'Competition locked');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningCompetition(null);
    }
  };

  const handleToggleActive = async (competitionId: bigint, currentlyActive: boolean) => {
    setActioningCompetition(competitionId.toString());
    try {
      await activateCompetitionMutation.mutateAsync({
        competitionId,
        active: !currentlyActive,
      });
      toast.success(currentlyActive ? 'Competition deactivated' : 'Competition activated');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningCompetition(null);
    }
  };

  if (isLoading) {
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Manage Competitions</h1>
            <Link to="/admin/competitions/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Competition
              </Button>
            </Link>
          </div>

          {!competitions || competitions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No competitions found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {competitions.map((competition) => (
                <Card key={competition.id.toString()}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{competition.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {competition.events.length} event{competition.events.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Badge variant={competition.status === 'running' ? 'default' : 'outline'}>
                          {competition.status}
                        </Badge>
                        {competition.isLocked && <Badge variant="destructive">Locked</Badge>}
                        {!competition.isActive && <Badge variant="secondary">Hidden</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Link to="/admin/competitions/$competitionId/edit" params={{ competitionId: competition.id.toString() }}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleLock(competition.id, competition.isLocked)}
                        disabled={actioningCompetition === competition.id.toString()}
                      >
                        {actioningCompetition === competition.id.toString() ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : competition.isLocked ? (
                          <Unlock className="h-4 w-4 mr-2" />
                        ) : (
                          <Lock className="h-4 w-4 mr-2" />
                        )}
                        {competition.isLocked ? 'Unlock' : 'Lock'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(competition.id, competition.isActive)}
                        disabled={actioningCompetition === competition.id.toString()}
                      >
                        {actioningCompetition === competition.id.toString() ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : competition.isActive ? (
                          <EyeOff className="h-4 w-4 mr-2" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        {competition.isActive ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCompetition(competition.id, competition.name)}
                        disabled={actioningCompetition === competition.id.toString()}
                      >
                        {actioningCompetition === competition.id.toString() ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
