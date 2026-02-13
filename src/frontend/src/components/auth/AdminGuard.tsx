import React from 'react';
import { useIsCallerAdmin } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Loader2, ShieldAlert, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading, isError, error, refetch } = useIsCallerAdmin();

  // Wait for both authentication and admin check
  if (isInitializing || !identity) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verifying admin status...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to verify admin status';
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Admin Status Check Failed</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-sm">{errorMessage}</p>
            <p className="text-sm">Please try again or contact support if the problem persists.</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <ShieldAlert className="h-16 w-16 mx-auto text-destructive" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have permission to access this area. Admin privileges are required.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
