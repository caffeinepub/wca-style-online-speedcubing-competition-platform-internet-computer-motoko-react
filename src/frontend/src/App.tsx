import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppShell from './components/layout/AppShell';
import CompetitionsListPage from './pages/CompetitionsListPage';
import CompetitionDetailPage from './pages/CompetitionDetailPage';
import SolveFlowPage from './pages/SolveFlowPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminCreateCompetitionPage from './pages/admin/AdminCreateCompetitionPage';
import ProfileSetupDialog from './components/profile/ProfileSetupDialog';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useCurrentUserProfile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-chart-1 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell />
      {showProfileSetup && <ProfileSetupDialog />}
    </>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: CompetitionsListPage,
});

const competitionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/competition/$competitionId',
  component: CompetitionDetailPage,
});

const solveFlowRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/competition/$competitionId/solve',
  component: SolveFlowPage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/competition/$competitionId/leaderboard',
  component: LeaderboardPage,
});

const adminCreateCompetitionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/create-competition',
  component: AdminCreateCompetitionPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  competitionDetailRoute,
  solveFlowRoute,
  leaderboardRoute,
  adminCreateCompetitionRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
