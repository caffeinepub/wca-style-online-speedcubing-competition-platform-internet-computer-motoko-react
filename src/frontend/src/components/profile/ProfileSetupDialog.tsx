import { useState } from 'react';
import { useCreateUserProfile, useSetUserEmail } from '../../hooks/useQueries';
import { User } from 'lucide-react';

export default function ProfileSetupDialog() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const createProfile = useCreateUserProfile();
  const setUserEmail = useSetUserEmail();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim() && email.trim()) {
      try {
        // Set email first (required for admin allowlist check)
        await setUserEmail.mutateAsync(email.trim());
        // Then create profile with mcubes ID (country and gender set to null initially)
        await createProfile.mutateAsync({ displayName: displayName.trim(), email: email.trim() });
      } catch (error) {
        console.error('Failed to create profile:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full shadow-2xl">
        <div className="w-16 h-16 bg-chart-1/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-chart-1" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Welcome to MCubes!</h2>
        <p className="text-muted-foreground text-center mb-6">
          Create your profile to get started with speedcubing competitions
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required for competition registration and notifications
            </p>
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1"
              required
              minLength={2}
              maxLength={30}
            />
          </div>
          <button
            type="submit"
            disabled={createProfile.isPending || setUserEmail.isPending || !displayName.trim() || !email.trim()}
            className="w-full bg-chart-1 hover:bg-chart-1/90 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createProfile.isPending || setUserEmail.isPending ? 'Creating Profile...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
