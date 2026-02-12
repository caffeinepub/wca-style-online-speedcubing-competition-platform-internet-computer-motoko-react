import { useState } from 'react';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import AdminGuard from '../../components/auth/AdminGuard';
import {
  useAdminGetAllUsers,
  useAdminBlockUser,
  useAdminDeleteUser,
  useAdminResetUserCompetitionStatus,
  useAdminGetUserSolveHistory,
} from '../../hooks/useQueries';
import { normalizeError } from '../../api/errors';
import { EVENT_LABELS } from '../../types/domain';
import { Loader2, Ban, Trash2, RotateCcw, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Event } from '../../backend';

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminGetAllUsers();
  const blockUserMutation = useAdminBlockUser();
  const deleteUserMutation = useAdminDeleteUser();
  const resetStatusMutation = useAdminResetUserCompetitionStatus();
  const getUserHistoryMutation = useAdminGetUserSolveHistory();

  const [selectedUserForHistory, setSelectedUserForHistory] = useState<Principal | null>(null);
  const [userHistory, setUserHistory] = useState<Array<[bigint, Event, any]>>([]);

  const handleBlockUser = async (userPrincipal: Principal, currentlyBlocked: boolean) => {
    try {
      await blockUserMutation.mutateAsync({
        user: userPrincipal,
        blocked: !currentlyBlocked,
      });
      toast.success(currentlyBlocked ? 'User unblocked' : 'User blocked');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleDeleteUser = async (userPrincipal: Principal) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(userPrincipal);
      toast.success('User deleted');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleResetStatus = async (
    userPrincipal: Principal,
    competitionId: bigint,
    event: Event
  ) => {
    if (!confirm('Are you sure you want to reset this competition status?')) {
      return;
    }

    try {
      await resetStatusMutation.mutateAsync({
        user: userPrincipal,
        competitionId,
        event,
      });
      toast.success('Competition status reset');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleViewHistory = async (userPrincipal: Principal) => {
    try {
      const history = await getUserHistoryMutation.mutateAsync(userPrincipal);
      setUserHistory(history);
      setSelectedUserForHistory(userPrincipal);
    } catch (error) {
      toast.error(normalizeError(error));
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
          <h1 className="text-4xl font-bold mb-8">User Management</h1>

          <Card>
            <CardHeader>
              <CardTitle>All Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.principal.toString()}>
                      <TableCell className="font-mono text-xs">
                        {user.principal.toString().slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        {user.profile?.displayName || <span className="text-muted-foreground">No profile</span>}
                      </TableCell>
                      <TableCell>
                        {user.email || <span className="text-muted-foreground">No email</span>}
                      </TableCell>
                      <TableCell>
                        {user.isBlocked ? (
                          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBlockUser(user.principal, user.isBlocked)}
                            disabled={blockUserMutation.isPending}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.principal)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewHistory(user.principal)}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Solve History</DialogTitle>
                                <DialogDescription>
                                  {user.profile?.displayName || user.principal.toString()}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="max-h-96 overflow-y-auto">
                                {getUserHistoryMutation.isPending ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                  </div>
                                ) : userHistory.length === 0 ? (
                                  <p className="text-center text-muted-foreground py-8">
                                    No solve history found
                                  </p>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Competition ID</TableHead>
                                        <TableHead>Event</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {userHistory.map(([compId, event, result], index) => (
                                        <TableRow key={index}>
                                          <TableCell>{compId.toString()}</TableCell>
                                          <TableCell>{EVENT_LABELS[event]}</TableCell>
                                          <TableCell>{result.status}</TableCell>
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleResetStatus(user.principal, compId, event)
                                              }
                                              disabled={resetStatusMutation.isPending}
                                            >
                                              <RotateCcw className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}
