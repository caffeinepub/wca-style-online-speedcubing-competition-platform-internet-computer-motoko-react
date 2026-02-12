import { useState } from 'react';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import {
  useAdminListAllUsers,
  useAdminBlockUser,
  useAdminUnblockUser,
  useAdminDeleteUser,
  useAdminResetUserCompetitionStatus,
  useAdminGetUserSolveHistory,
} from '../../hooks/useQueries';
import { normalizeError } from '../../api/errors';
import { Loader2, Ban, CheckCircle, Trash2, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Event } from '../../backend';
import type { UserSummary } from '../../types/backend-extended';
import { EVENT_LABELS } from '../../types/domain';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminListAllUsers();
  const blockUserMutation = useAdminBlockUser();
  const unblockUserMutation = useAdminUnblockUser();
  const deleteUserMutation = useAdminDeleteUser();
  const resetStatusMutation = useAdminResetUserCompetitionStatus();

  const [searchTerm, setSearchTerm] = useState('');
  const [actioningUser, setActioningUser] = useState<string | null>(null);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);
  const [resetCompId, setResetCompId] = useState('');
  const [resetEvent, setResetEvent] = useState<Event | ''>('');

  const { data: solveHistory } = useAdminGetUserSolveHistory(viewingHistory || '');

  const filteredUsers = users?.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.principal.toString().toLowerCase().includes(searchLower) ||
      user.profile?.displayName.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleBlockUser = async (user: UserSummary) => {
    setActioningUser(user.principal.toString());
    try {
      if (user.isBlocked) {
        await unblockUserMutation.mutateAsync(user.principal.toString());
        toast.success('User unblocked successfully');
      } else {
        await blockUserMutation.mutateAsync(user.principal.toString());
        toast.success('User blocked successfully');
      }
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningUser(null);
    }
  };

  const handleDeleteUser = async (user: UserSummary) => {
    if (!confirm(`Are you sure you want to delete user ${user.profile?.displayName || user.principal.toString()}?`)) {
      return;
    }

    setActioningUser(user.principal.toString());
    try {
      await deleteUserMutation.mutateAsync(user.principal.toString());
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningUser(null);
    }
  };

  const handleResetStatus = async (userPrincipal: string) => {
    if (!resetCompId || !resetEvent) {
      toast.error('Please select both competition ID and event');
      return;
    }

    try {
      await resetStatusMutation.mutateAsync({
        user: userPrincipal,
        competitionId: BigInt(resetCompId),
        event: resetEvent as Event,
      });
      toast.success('Competition status reset successfully');
      setResetCompId('');
      setResetEvent('');
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
          <h1 className="text-4xl font-bold mb-8">Manage Users</h1>

          <div className="mb-6">
            <Input
              placeholder="Search by principal, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {!filteredUsers || filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search' : 'No users yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.principal.toString()}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          {user.profile?.displayName || 'No Name'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                          {user.principal.toString()}
                        </p>
                        {user.email && (
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                      <Badge variant={user.isBlocked ? 'destructive' : 'default'}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlockUser(user)}
                        disabled={actioningUser === user.principal.toString()}
                      >
                        {actioningUser === user.principal.toString() ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : user.isBlocked ? (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        ) : (
                          <Ban className="mr-2 h-4 w-4" />
                        )}
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingHistory(user.principal.toString())}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View History
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        disabled={actioningUser === user.principal.toString()}
                      >
                        {actioningUser === user.principal.toString() ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>

                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Reset Competition Status</h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Competition ID"
                          value={resetCompId}
                          onChange={(e) => setResetCompId(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={resetEvent} onValueChange={(val) => setResetEvent(val as Event)}>
                          <SelectTrigger className="flex-1">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetStatus(user.principal.toString())}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset
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

      <Dialog open={!!viewingHistory} onOpenChange={() => setViewingHistory(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solve History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!solveHistory || solveHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No solve history found</p>
            ) : (
              solveHistory.map((result, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Event: {EVENT_LABELS[result.event] || result.event}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {result.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Attempts: {result.attempts?.length || 0}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
}
