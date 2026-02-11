import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Timer, Trophy, Plus } from 'lucide-react';
import LoginButton from '../auth/LoginButton';
import ProfileMenu from '../profile/ProfileMenu';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../../hooks/useQueries';

export default function AppShell() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: isAdmin } = useIsCallerAdmin();

  const isSolveFlow = routerState.location.pathname.includes('/solve');

  if (isSolveFlow) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="w-4 h-4" />
              <span>Solve in Progress</span>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <h1 className="text-xl font-bold tracking-tight">SpeedCube</h1>
              <p className="text-xs text-muted-foreground">Online Competitions</p>
            </div>
          </button>

          <nav className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: '/' })}
              className="text-sm font-medium hover:text-chart-1 transition-colors"
            >
              Competitions
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate({ to: '/admin/create-competition' })}
                className="flex items-center gap-2 text-sm font-medium hover:text-chart-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            )}
            {isAuthenticated ? <ProfileMenu /> : <LoginButton />}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card/30 mt-auto">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="w-4 h-4" />
            <span>© {new Date().getFullYear()} SpeedCube Platform</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                window.location.hostname
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-chart-1 hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
