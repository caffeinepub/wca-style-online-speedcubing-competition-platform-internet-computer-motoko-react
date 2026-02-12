import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppShell from './components/layout/AppShell';
import CompetitionsListPage from './pages/CompetitionsListPage';
import CompetitionDetailPage from './pages/CompetitionDetailPage';
import SolveFlowPage from './pages/SolveFlowPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LeaderboardsHubPage from './pages/LeaderboardsHubPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import AdminLandingPage from './pages/admin/AdminLandingPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCompetitionsPage from './pages/admin/AdminCompetitionsPage';
import AdminResultsPage from './pages/admin/AdminResultsPage';
import AdminCreateCompetitionPage from './pages/admin/AdminCreateCompetitionPage';
import AdminEditCompetitionPage from './pages/admin/AdminEditCompetitionPage';
import AdminGoLivePage from './pages/admin/AdminGoLivePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const rootRoute = createRootRoute({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: CompetitionsListPage,
});

const competitionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/competitions',
  component: CompetitionsListPage,
});

const competitionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/competitions/$competitionId',
  component: CompetitionDetailPage,
});

const solveFlowRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/competitions/$competitionId/solve/$event',
  component: SolveFlowPage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/competitions/$competitionId/leaderboard',
  component: LeaderboardPage,
});

const leaderboardsHubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leaderboards',
  component: LeaderboardsHubPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const publicProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profiles/$principal',
  component: PublicProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLandingPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  component: AdminUsersPage,
});

const adminCompetitionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/competitions',
  component: AdminCompetitionsPage,
});

const adminCreateCompetitionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/competitions/create',
  component: AdminCreateCompetitionPage,
});

const adminEditCompetitionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/competitions/$competitionId/edit',
  component: AdminEditCompetitionPage,
});

const adminResultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/results',
  component: AdminResultsPage,
});

const adminGoLiveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/go-live',
  component: AdminGoLivePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  competitionsRoute,
  competitionDetailRoute,
  solveFlowRoute,
  leaderboardRoute,
  leaderboardsHubRoute,
  profileRoute,
  publicProfileRoute,
  adminRoute,
  adminUsersRoute,
  adminCompetitionsRoute,
  adminCreateCompetitionRoute,
  adminEditCompetitionRoute,
  adminResultsRoute,
  adminGoLiveRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
