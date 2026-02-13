import { useState } from 'react';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import {
  useAdminGetUsers,
  useAdminBlockUser,
  useAdminDeleteUser,
  useAdminGetUserSolveHistory,
  useAdminResetUserCompetitionStatus,
} from '../../hooks/useQueries';
import { normalizeError } from '../../api/errors';
import { Loader2, Ban, Trash2, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminGetUsers();
  const blockUserMutation = useAdminBlockUser();
  const deleteUserMutation = useAdminDeleteUser();
  const getUserSolveHistoryMutation = useAdminGetUserSolveHistory();
  const resetUserCompetitionStatusMutation = useAdminResetUserCompetitionStatus();

  const [selectedUserHistory, setSelectedUserHistory] = useState<any>(null);

  const handleBlockUser = async (userPrincipal: string, currentlyBlocked: boolean) => {
    try {
      await blockUserMutation.mutateAsync({
        user: userPrincipal as any,
        blocked: !currentlyBlocked,
      });
      toast.success(currentlyBlocked ? 'User unblocked successfully' : 'User blocked successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleDeleteUser = async (userPrincipal: string) => {
    try {
      await deleteUserMutation.mutateAsync(userPrincipal as any);
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleViewSolveHistory = async (userPrincipal: string) => {
    try {
      const history = await getUserSolveHistoryMutation.mutateAsync(userPrincipal as any);
      setSelectedUserHistory(history);
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleResetCompetitionStatus = async (
    userPrincipal: string,
    competitionId: bigint,
    event: string
  ) => {
    try {
      await resetUserCompetitionStatusMutation.mutateAsync({
        user: userPrincipal as any,
        competitionId,
        event: event as any,
      });
      toast.success('Competition status reset successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>

        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.principal.toString()}>
                      <td className="px-6 py-4 text-sm font-mono">
                        {user.principal.toString().slice(0, 20)}...
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.profile?.displayName || 'No profile'}
                      </td>
                      <td className="px-6 py-4 text-sm">{user.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm">
                        {user.isBlocked ? (
                          <span className="px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewSolveHistory(user.principal.toString())}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Solve History</DialogTitle>
                              <DialogDescription>
                                View solve history for {user.profile?.displayName || 'this user'}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              {selectedUserHistory ? (
                                <pre className="text-xs overflow-auto">
                                  {JSON.stringify(selectedUserHistory, null, 2)}
                                </pre>
                              ) : (
                                <p className="text-muted-foreground">Loading...</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleBlockUser(user.principal.toString(), user.isBlocked)
                          }
                          disabled={blockUserMutation.isPending}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this user? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.principal.toString())}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
