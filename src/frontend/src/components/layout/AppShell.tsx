import { Outlet, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Trophy, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';
import LoginButton from '../auth/LoginButton';
import ProfileMenu from '../profile/ProfileMenu';

export default function AppShell() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!identity;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity"
            >
              <Trophy className="h-6 w-6 text-primary" />
              <span>MCubes</span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => navigate({ to: '/competitions' })}
              >
                Competitions
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate({ to: '/leaderboards' })}
              >
                Leaderboards
              </Button>
              {isAuthenticated && isAdmin && (
                <Button
                  variant="ghost"
                  onClick={() => navigate({ to: '/admin' })}
                  className="text-primary"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
            </nav>

            {/* Auth Section */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <ProfileMenu />
              ) : (
                <LoginButton />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate({ to: '/competitions' });
                  setMobileMenuOpen(false);
                }}
              >
                Competitions
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate({ to: '/leaderboards' });
                  setMobileMenuOpen(false);
                }}
              >
                Leaderboards
              </Button>
              {isAuthenticated && isAdmin && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-primary"
                  onClick={() => {
                    navigate({ to: '/admin' });
                    setMobileMenuOpen(false);
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <div className="pt-4 border-t">
                {isAuthenticated ? (
                  <ProfileMenu />
                ) : (
                  <LoginButton />
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MCubes. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.hostname : 'mcubes-app'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
