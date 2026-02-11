import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';

export function useNavigationBlocker(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const handleNavigation = (e: PopStateEvent) => {
      const confirmed = window.confirm(
        'You have a solve in progress. Are you sure you want to leave? Your progress will be lost.'
      );
      if (!confirmed) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [enabled]);
}
