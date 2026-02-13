import React from 'react';
import { useAdminGetUsers, useAdminBlockUser, useAdminDeleteUser } from '../../hooks/useQueries';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { normalizeError } from '../../api/errors';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import AdminGuard from '../../components/auth/AdminGuard';

export default function AdminUsersPage() {
  const { data: users, isLoading, isError, error } = useAdminGetUsers();
  const blockMutation = useAdminBlockUser();
  const deleteMutation = useAdminDeleteUser();

  const handleBlockToggle = async (principal: any, currentlyBlocked: boolean) => {
    try {
      await blockMutation.mutateAsync({
        principal,
        blocked: !currentlyBlocked,
      });
    } catch (err) {
      console.error('Failed to toggle block status:', err);
    }
  };

  const handleDelete = async (principal: any) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(principal);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {normalizeError(error)}
                </AlertDescription>
              </Alert>
            )}

            {!isLoading && !isError && users && users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No users found
              </div>
            )}

            {!isLoading && !isError && users && users.length > 0 && (
              <div className="overflow-x-auto">
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
                          {user.principal.toString().slice(0, 20)}...
                        </TableCell>
                        <TableCell>
                          {user.profile?.displayName || 'No profile'}
                        </TableCell>
                        <TableCell>
                          {user.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {user.isBlocked ? (
                            <Badge variant="destructive">Blocked</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={user.isBlocked ? 'default' : 'outline'}
                              onClick={() => handleBlockToggle(user.principal, user.isBlocked)}
                              disabled={blockMutation.isPending}
                            >
                              {blockMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : user.isBlocked ? (
                                'Unblock'
                              ) : (
                                'Block'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(user.principal)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {(blockMutation.isError || deleteMutation.isError) && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {normalizeError(blockMutation.error || deleteMutation.error)}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
