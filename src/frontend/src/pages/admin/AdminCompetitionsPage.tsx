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
import { ArrowLeft, Plus, Eye, Edit, Trash2, Lock, Unlock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { normalizeError } from '../../api/errors';
import { formatDate } from '../../lib/dateUtils';
import type { Competition } from '../../backend';

export default function AdminCompetitionsPage() {
  const navigate = useNavigate();
  const { data: competitions = [], isLoading, refetch } = useAdminGetAllCompetitions();
  const deleteCompetitionMutation = useAdminDeleteCompetition();
  const lockCompetitionMutation = useAdminLockCompetition();
  const unlockCompetitionMutation = useAdminUnlockCompetition();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);

  const handleDelete = async () => {
    if (!selectedCompetition) return;

    try {
      await deleteCompetitionMutation.mutateAsync(selectedCompetition.id);
      toast.success('Competition deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedCompetition(null);
      refetch();
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleLockToggle = async (competition: Competition) => {
    try {
      if (competition.isLocked) {
        await unlockCompetitionMutation.mutateAsync(competition.id);
        toast.success('Competition unlocked successfully');
      } else {
        await lockCompetitionMutation.mutateAsync(competition.id);
        toast.success('Competition locked successfully');
      }
      refetch();
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const openDeleteDialog = (competition: Competition) => {
    setSelectedCompetition(competition);
    setDeleteDialogOpen(true);
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">Competition Management</h1>
                <p className="text-muted-foreground mt-2">
                  Create and manage competitions
                </p>
              </div>
              <Button onClick={() => navigate({ to: '/admin/competitions/create' })}>
                <Plus className="mr-2 h-4 w-4" />
                Create Competition
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : competitions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No competitions found</p>
              <Button
                onClick={() => navigate({ to: '/admin/competitions/create' })}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Competition
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Locked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitions.map((competition) => (
                    <TableRow key={competition.id.toString()}>
                      <TableCell className="font-medium">{competition.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            competition.status === 'running'
                              ? 'default'
                              : competition.status === 'upcoming'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {competition.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                      </TableCell>
                      <TableCell>{competition.events.length} events</TableCell>
                      <TableCell>
                        {competition.isLocked ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Unlock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate({ to: `/competitions/${competition.id}` })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate({ to: `/admin/competitions/${competition.id}/edit` })}
                            disabled={competition.isLocked}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLockToggle(competition)}
                            disabled={lockCompetitionMutation.isPending || unlockCompetitionMutation.isPending}
                          >
                            {competition.isLocked ? (
                              <Unlock className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(competition)}
                            disabled={competition.isLocked || deleteCompetitionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Competition</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedCompetition?.name}"? This action cannot be undone and will remove all associated results.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCompetitionMutation.isPending}
              >
                {deleteCompetitionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Competition
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}
