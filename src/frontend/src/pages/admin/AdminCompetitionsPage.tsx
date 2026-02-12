import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import {
  useAdminGetAllCompetitions,
  useAdminDeleteCompetition,
  useAdminLockCompetition,
  useAdminUnlockCompetition,
} from '../../hooks/useQueries';
import { normalizeError } from '../../api/errors';
import { formatDate } from '../../lib/dateUtils';
import { Loader2, Plus, Edit, Trash2, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Competition } from '../../types/backend-extended';

export default function AdminCompetitionsPage() {
  const navigate = useNavigate();
  const { data: competitions, isLoading } = useAdminGetAllCompetitions();
  const deleteCompetitionMutation = useAdminDeleteCompetition();
  const lockCompetitionMutation = useAdminLockCompetition();
  const unlockCompetitionMutation = useAdminUnlockCompetition();

  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [lockingId, setLockingId] = useState<bigint | null>(null);

  const handleDelete = async (id: bigint, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeletingId(id);
    try {
      await deleteCompetitionMutation.mutateAsync(id);
      toast.success('Competition deleted successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleLock = async (competition: Competition) => {
    setLockingId(competition.id);
    try {
      if (competition.isLocked) {
        await unlockCompetitionMutation.mutateAsync(competition.id);
        toast.success('Competition unlocked');
      } else {
        await lockCompetitionMutation.mutateAsync(competition.id);
        toast.success('Competition locked');
      }
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setLockingId(null);
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
            <Button onClick={() => navigate({ to: '/admin/competitions/create' })}>
              <Plus className="mr-2 h-4 w-4" />
              Create Competition
            </Button>
          </div>

          {!competitions || competitions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No competitions yet</p>
              <Button onClick={() => navigate({ to: '/admin/competitions/create' })}>
                Create Your First Competition
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {competitions.map((competition) => (
                <Card key={competition.id.toString()}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{competition.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={competition.isActive ? 'default' : 'secondary'}>
                          {competition.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant={competition.isLocked ? 'destructive' : 'outline'}>
                          {competition.isLocked ? 'Locked' : 'Open'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>{competition.events.length} events</p>
                        {competition.participantLimit && (
                          <p>Limit: {competition.participantLimit.toString()} participants</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate({
                              to: '/admin/competitions/$competitionId/edit',
                              params: { competitionId: competition.id.toString() },
                            })
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleLock(competition)}
                          disabled={lockingId === competition.id}
                        >
                          {lockingId === competition.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : competition.isLocked ? (
                            <Unlock className="mr-2 h-4 w-4" />
                          ) : (
                            <Lock className="mr-2 h-4 w-4" />
                          )}
                          {competition.isLocked ? 'Unlock' : 'Lock'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(competition.id, competition.name)}
                          disabled={deletingId === competition.id}
                        >
                          {deletingId === competition.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </div>
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
