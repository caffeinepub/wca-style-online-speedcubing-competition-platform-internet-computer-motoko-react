import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import {
  useAdminGetAllUsers,
  useAdminBlockUser,
  useAdminUnblockUser,
  useAdminDeleteUser,
  useAdminResetUserCompetitionStatus,
  useAdminGetUserSolveHistory,
} from '../../hooks/useQueries';
import { ArrowLeft, Loader2, Ban, Unlock, Trash2, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizeError } from '../../api/errors';
import { EVENT_LABELS } from '../../types/domain';
import type { Event, UserSummary } from '../../backend';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { data: users = [], isLoading, refetch } = useAdminGetAllUsers();
  const blockUserMutation = useAdminBlockUser();
  const unblockUserMutation = useAdminUnblockUser();
  const deleteUserMutation = useAdminDeleteUser();
  const resetStatusMutation = useAdminResetUserCompetitionStatus();

  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [showSolveHistory, setShowSolveHistory] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetCompetitionId, setResetCompetitionId] = useState<string>('');
  const [resetEvent, setResetEvent] = useState<Event | ''>('');

  const { data: solveHistory = [] } = useAdminGetUserSolveHistory(
    selectedUser?.principal.toString() || ''
  );

  const handleBlockUser = async (user: UserSummary) => {
    try {
      await blockUserMutation.mutateAsync(user.principal.toString());
      toast.success('User blocked successfully');
      refetch();
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleUnblockUser = async (user: UserSummary) => {
    try {
      await unblockUserMutation.mutateAsync(user.principal.toString());
      toast.success('User unblocked successfully');
      refetch();
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleDeleteUser = async (user: UserSummary) => {
    if (!confirm(`Are you sure you want to delete user ${user.profile?.displayName || 'Unknown'}?`)) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(user.principal.toString());
      toast.success('User deleted successfully');
      refetch();
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleResetStatus = async () => {
    if (!selectedUser || !resetCompetitionId || !resetEvent) {
      toast.error('Please select competition and event');
      return;
    }

    try {
      await resetStatusMutation.mutateAsync({
        user: selectedUser.principal.toString(),
        competitionId: BigInt(resetCompetitionId),
        event: resetEvent as Event,
      });
      toast.success('Competition status reset successfully');
      setShowResetDialog(false);
      setResetCompetitionId('');
      setResetEvent('');
      refetch();
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleViewSolveHistory = (user: UserSummary) => {
    setSelectedUser(user);
    setShowSolveHistory(true);
  };

  const handleOpenResetDialog = (user: UserSummary) => {
    setSelectedUser(user);
    setShowResetDialog(true);
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
            <h1 className="text-4xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage users, block/unblock, and reset competition status
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>MCubes ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.principal.toString()}>
                      <TableCell className="font-medium">
                        {user.profile?.displayName || 'Unknown'}
                      </TableCell>
                      <TableCell>{user.profile?.mcubesId || '-'}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        {user.isBlocked ? (
                          <span className="text-red-600 dark:text-red-400">Blocked</span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">Active</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSolveHistory(user)}
                            title="View solve history"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenResetDialog(user)}
                            title="Reset competition status"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          {user.isBlocked ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnblockUser(user)}
                              disabled={unblockUserMutation.isPending}
                              title="Unblock user"
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBlockUser(user)}
                              disabled={blockUserMutation.isPending}
                              title="Block user"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deleteUserMutation.isPending}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
      </div>

      {/* Solve History Dialog */}
      <Dialog open={showSolveHistory} onOpenChange={setShowSolveHistory}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Solve History - {selectedUser?.profile?.displayName || 'Unknown'}
            </DialogTitle>
            <DialogDescription>
              View all competition results for this user
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {solveHistory.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No solve history found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solveHistory.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{EVENT_LABELS[result.event]}</TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Competition Status Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Competition Status</DialogTitle>
            <DialogDescription>
              Reset competition status for {selectedUser?.profile?.displayName || 'Unknown'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Competition ID</label>
              <Input
                type="number"
                value={resetCompetitionId}
                onChange={(e) => setResetCompetitionId(e.target.value)}
                placeholder="Enter competition ID"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Event</label>
              <Select value={resetEvent} onValueChange={(val) => setResetEvent(val as Event)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetCompetitionId('');
                  setResetEvent('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetStatus}
                disabled={!resetCompetitionId || !resetEvent || resetStatusMutation.isPending}
              >
                {resetStatusMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reset Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
}
