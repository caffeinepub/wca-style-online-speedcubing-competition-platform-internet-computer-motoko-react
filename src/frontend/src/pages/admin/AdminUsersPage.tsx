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
  useAdminGetAllCompetitions,
} from '../../hooks/useQueries';
import { normalizeError } from '../../api/errors';
import { Loader2, Shield, ShieldOff, Trash2, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { EVENT_LABELS } from '../../types/domain';
import type { Event } from '../../backend';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminGetAllUsers();
  const { data: competitions = [] } = useAdminGetAllCompetitions();
  const blockUserMutation = useAdminBlockUser();
  const deleteUserMutation = useAdminDeleteUser();
  const resetStatusMutation = useAdminResetUserCompetitionStatus();

  const [actioningUser, setActioningUser] = useState<string | null>(null);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<string | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetUserPrincipal, setResetUserPrincipal] = useState<string | null>(null);
  const [resetCompetitionId, setResetCompetitionId] = useState<string>('');
  const [resetEvent, setResetEvent] = useState<Event | ''>('');

  const { data: solveHistory = [] } = useAdminGetUserSolveHistory(
    selectedUserForHistory ? Principal.fromText(selectedUserForHistory) : Principal.anonymous()
  );

  const handleBlockUser = async (userPrincipal: string) => {
    if (!confirm('Are you sure you want to block this user?')) return;

    setActioningUser(userPrincipal);
    try {
      await blockUserMutation.mutateAsync({
        user: Principal.fromText(userPrincipal),
        blocked: true,
      });
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
      await blockUserMutation.mutateAsync({
        user: Principal.fromText(userPrincipal),
        blocked: false,
      });
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
      await deleteUserMutation.mutateAsync(Principal.fromText(userPrincipal));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningUser(null);
    }
  };

  const handleOpenResetDialog = (userPrincipal: string) => {
    setResetUserPrincipal(userPrincipal);
    setResetCompetitionId('');
    setResetEvent('');
    setShowResetDialog(true);
  };

  const handleResetCompetitionStatus = async () => {
    if (!resetUserPrincipal || !resetCompetitionId || !resetEvent) {
      toast.error('Please select both competition and event');
      return;
    }

    setActioningUser(resetUserPrincipal);
    try {
      await resetStatusMutation.mutateAsync({
        user: Principal.fromText(resetUserPrincipal),
        competitionId: BigInt(resetCompetitionId),
        event: resetEvent as Event,
      });
      toast.success('Competition status reset successfully');
      setShowResetDialog(false);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setActioningUser(null);
    }
  };

  const handleViewSolveHistory = (userPrincipal: string) => {
    setSelectedUserForHistory(userPrincipal);
    setShowHistoryDialog(true);
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
                        onClick={() => handleOpenResetDialog(user.principal.toString())}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Status
                      </Button>
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

        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Competition Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="competition">Competition</Label>
                <Select value={resetCompetitionId} onValueChange={setResetCompetitionId}>
                  <SelectTrigger id="competition">
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
                <Label htmlFor="event">Event</Label>
                <Select value={resetEvent} onValueChange={(val) => setResetEvent(val as Event)}>
                  <SelectTrigger id="event">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleResetCompetitionStatus}
                disabled={!resetCompetitionId || !resetEvent || !!actioningUser}
              >
                {actioningUser ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Reset Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Solve History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {solveHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No solve history found</p>
              ) : (
                solveHistory.map(([competitionId, event, result], index) => {
                  const competition = competitions.find(c => c.id === competitionId);
                  return (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium">{competition?.name || `Competition ${competitionId}`}</p>
                            <p className="text-sm text-muted-foreground">{EVENT_LABELS[event]}</p>
                            <p className="text-sm text-muted-foreground">
                              Status: {result.status}
                            </p>
                          </div>
                          <div className="space-y-1">
                            {result.attempts.map((att, i) => (
                              <p key={i} className="text-sm">
                                Attempt {i + 1}: {Number(att.time) / 1000}s
                                {att.penalty > 0 && ` (+${Number(att.penalty) / 1000}s penalty)`}
                              </p>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}
