import React, { useState } from 'react';
import {
  useAdminGetUsers,
  useAdminBlockUser,
  useAdminUnblockUser,
  useAdminDeleteUser,
} from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Ban, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeError } from '../../api/errors';
import { AdminQueryErrorPanel } from '../../components/system/AdminQueryErrorPanel';
import type { Principal } from '@dfinity/principal';

export default function AdminUsersPage() {
  const { data: users, isLoading, isError, error, refetch } = useAdminGetUsers();
  const blockMutation = useAdminBlockUser();
  const unblockMutation = useAdminUnblockUser();
  const deleteMutation = useAdminDeleteUser();

  const [actioningPrincipal, setActioningPrincipal] = useState<string | null>(null);

  const handleBlock = async (principal: Principal, displayName: string) => {
    setActioningPrincipal(principal.toString());
    try {
      await blockMutation.mutateAsync(principal);
      toast.success(`User ${displayName} blocked successfully`);
    } catch (err) {
      toast.error(normalizeError(err));
    } finally {
      setActioningPrincipal(null);
    }
  };

  const handleUnblock = async (principal: Principal, displayName: string) => {
    setActioningPrincipal(principal.toString());
    try {
      await unblockMutation.mutateAsync(principal);
      toast.success(`User ${displayName} unblocked successfully`);
    } catch (err) {
      toast.error(normalizeError(err));
    } finally {
      setActioningPrincipal(null);
    }
  };

  const handleDelete = async (principal: Principal, displayName: string) => {
    if (!confirm(`Are you sure you want to delete user "${displayName}"? This action cannot be undone.`)) {
      return;
    }

    setActioningPrincipal(principal.toString());
    try {
      await deleteMutation.mutateAsync(principal);
      toast.success(`User ${displayName} deleted successfully`);
    } catch (err) {
      toast.error(normalizeError(err));
    } finally {
      setActioningPrincipal(null);
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
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground mt-2">View and manage user accounts</p>
        </div>
        <AdminQueryErrorPanel
          error={error}
          onRetry={() => refetch()}
          title="Failed to Load Users"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-muted-foreground mt-2">View and manage user accounts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const principalStr = user.principal.toString();
                  const displayName = user.profile?.displayName || 'No profile';
                  const isActioning = actioningPrincipal === principalStr;

                  return (
                    <TableRow key={principalStr}>
                      <TableCell className="font-medium">{displayName}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{principalStr.slice(0, 20)}...</TableCell>
                      <TableCell>
                        {user.isBlocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isActioning}>
                              {isActioning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.isBlocked ? (
                              <DropdownMenuItem onClick={() => handleUnblock(user.principal, displayName)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Unblock
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleBlock(user.principal, displayName)}>
                                <Ban className="h-4 w-4 mr-2" />
                                Block
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(user.principal, displayName)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
