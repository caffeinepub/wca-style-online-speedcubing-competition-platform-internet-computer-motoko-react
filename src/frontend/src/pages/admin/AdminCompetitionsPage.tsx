import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useAdminGetAllCompetitions,
  useAdminDeleteCompetition,
  useAdminLockCompetition,
  useAdminActivateCompetition,
} from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus, Edit, Trash2, Lock, Unlock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeError } from '../../api/errors';
import { AdminQueryErrorPanel } from '../../components/system/AdminQueryErrorPanel';
import { formatDate } from '../../lib/dateUtils';

export default function AdminCompetitionsPage() {
  const navigate = useNavigate();
  const { data: competitions, isLoading, isError, error, refetch } = useAdminGetAllCompetitions();
  const deleteMutation = useAdminDeleteCompetition();
  const lockMutation = useAdminLockCompetition();
  const activateMutation = useAdminActivateCompetition();

  const [actioningId, setActioningId] = useState<bigint | null>(null);

  const handleDelete = async (id: bigint, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setActioningId(id);
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Competition deleted successfully');
    } catch (err) {
      toast.error(normalizeError(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleLock = async (id: bigint, currentlyLocked: boolean) => {
    setActioningId(id);
    try {
      await lockMutation.mutateAsync(id);
      toast.success(currentlyLocked ? 'Competition unlocked' : 'Competition locked');
    } catch (err) {
      toast.error(normalizeError(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleActive = async (id: bigint, currentlyActive: boolean) => {
    setActioningId(id);
    try {
      await activateMutation.mutateAsync(id);
      toast.success(currentlyActive ? 'Competition deactivated' : 'Competition activated');
    } catch (err) {
      toast.error(normalizeError(err));
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manage Competitions</h1>
          <p className="text-muted-foreground mt-2">Create and manage competitions</p>
        </div>
        <AdminQueryErrorPanel
          error={error}
          onRetry={() => refetch()}
          title="Failed to Load Competitions"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Competitions</h1>
          <p className="text-muted-foreground mt-2">Create and manage competitions</p>
        </div>
        <Button onClick={() => navigate({ to: '/admin/competitions/create' })}>
          <Plus className="h-4 w-4 mr-2" />
          Create Competition
        </Button>
      </div>

      {!competitions || competitions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No competitions found. Create your first competition to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {competitions.map((comp) => (
            <Card key={comp.id.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{comp.name}</CardTitle>
                      <Badge variant={comp.status === 'running' ? 'default' : comp.status === 'upcoming' ? 'secondary' : 'outline'}>
                        {comp.status}
                      </Badge>
                      {comp.isLocked && (
                        <Badge variant="destructive">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                      {!comp.isActive && (
                        <Badge variant="outline">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        {formatDate(comp.startDate)} - {formatDate(comp.endDate)}
                      </p>
                      <p>{comp.events.length} events</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={actioningId === comp.id}>
                        {actioningId === comp.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate({ to: `/admin/competitions/${comp.id.toString()}/edit` })}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleLock(comp.id, comp.isLocked)}>
                        {comp.isLocked ? (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Unlock
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Lock
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(comp.id, comp.isActive)}>
                        {comp.isActive ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(comp.id, comp.name)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
