import { useState } from 'react';
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
import { normalizeError } from '../../api/errors';
import { Loader2, Shield, ShieldOff, Trash2, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EVENT_LABELS } from '../../types/domain';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminGetAllUsers();
  const blockUserMutation = useAdminBlockUser();
  const unblockUserMutation = useAdminUnblockUser();
  const deleteUserMutation = useAdminDeleteUser();
  const resetStatusMutation = useAdminResetUserCompetitionStatus();
  const { data: solveHistory = [], refetch: refetchSolveHistory } = useAdminGetUserSolveHistory();

  const [actioningUser, setActioningUser] = useState<string | null>(null);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<string | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const handleBlockUser = async (userPrincipal: string) => {
    if (!confirm('Are you sure you want to block this user?')) return;

    setActioningUser(userPrincipal);
    try {
      await blockUserMutation.mutateAsync(userPrincipal);
      toast.success('User blocked successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningUser(null);
    }
  };

  const handleUnblockUser = async (userPrincipal: string) => {
    setActioningUser(userPrincipal);
    try {
      await unblockUserMutation.mutateAsync(userPrincipal);
      toast.success('User unblocked successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningUser(null);
    }
  };

  const handleDeleteUser = async (userPrincipal: string, displayName: string) => {
    if (!confirm(`Are you sure you want to delete user "${displayName}"? This action cannot be undone.`)) return;

    setActioningUser(userPrincipal);
    try {
      await deleteUserMutation.mutateAsync(userPrincipal);
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningUser(null);
    }
  };

  const handleResetCompetitionStatus = async (userPrincipal: string, competitionId: bigint) => {
    if (!confirm('Are you sure you want to reset this user\'s competition status?')) return;

    setActioningUser(userPrincipal);
    try {
      await resetStatusMutation.mutateAsync({
        principal: userPrincipal,
        competitionId,
      });
      toast.success('Competition status reset successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningUser(null);
    }
  };

  const handleViewSolveHistory = async (userPrincipal: string) => {
    setSelectedUserForHistory(userPrincipal);
    setShowHistoryDialog(true);
    // Refetch solve history for this user
    await refetchSolveHistory();
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
          <h1 className="text-4xl font-bold mb-8">Manage Users</h1>

          {!users || users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.principal.toString()}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {user.profile?.displayName || 'No Name'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {user.principal.toString().slice(0, 20)}...
                        </p>
                        {user.email && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {user.email}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {user.isBlocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {user.isBlocked ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblockUser(user.principal.toString())}
                          disabled={actioningUser === user.principal.toString()}
                        >
                          {actioningUser === user.principal.toString() ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Shield className="h-4 w-4 mr-2" />
                          )}
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlockUser(user.principal.toString())}
                          disabled={actioningUser === user.principal.toString()}
                        >
                          {actioningUser === user.principal.toString() ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ShieldOff className="h-4 w-4 mr-2" />
                          )}
                          Block
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewSolveHistory(user.principal.toString())}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View History
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.principal.toString(), user.profile?.displayName || 'Unknown')}
                        disabled={actioningUser === user.principal.toString()}
                      >
                        {actioningUser === user.principal.toString() ? (
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

        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Solve History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {solveHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No solve history found</p>
              ) : (
                solveHistory.map((result: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium">{EVENT_LABELS[result.event]}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: {result.status}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {result.attempts.map((att: any, i: number) => (
                            <p key={i} className="text-sm">
                              Attempt {i + 1}: {Number(att.time) / 1000}s
                              {att.penalty > 0 && ` (+${Number(att.penalty) / 1000}s penalty)`}
                            </p>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}
