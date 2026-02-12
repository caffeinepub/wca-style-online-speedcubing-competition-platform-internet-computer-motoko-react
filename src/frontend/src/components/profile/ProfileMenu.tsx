import { User, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useCurrentUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

export default function ProfileMenu() {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const isLoggingOut = loginStatus === 'logging-in';

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <User className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {profileLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-chart-1" />
          </div>
        ) : (
          <>
            {userProfile && (
              <div className="px-2 py-1.5 text-sm">
                <div className="font-medium">{userProfile.displayName}</div>
                <div className="text-xs text-muted-foreground">{userProfile.mcubesId}</div>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
