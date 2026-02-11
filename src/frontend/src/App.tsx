import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useCurrentUserProfile';
import AppShell from './components/layout/AppShell';
import CompetitionsListPage from './pages/CompetitionsListPage';
import CompetitionDetailPage from './pages/CompetitionDetailPage';
import SolveFlowPage from './pages/SolveFlowPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminCreateCompetitionPage from './pages/admin/AdminCreateCompetitionPage';
import ProfileSetupDialog from './components/profile/ProfileSetupDialog';

function RootComponent() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      <AppShell />
      {showProfileSetup && <ProfileSetupDialog />}
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

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

const adminCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/create-competition',
  component: AdminCreateCompetitionPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  competitionDetailRoute,
  solveFlowRoute,
  leaderboardRoute,
  adminCreateRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <RouterProvider router={router} />
    </div>
  );
}
