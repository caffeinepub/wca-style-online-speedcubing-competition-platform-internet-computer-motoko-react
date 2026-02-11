import { useState } from 'react';
import { useGetCallerUserProfile } from '../../hooks/useCurrentUserProfile';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import { User, Edit2, X, Check } from 'lucide-react';

export default function ProfileMenu() {
  const { data: profile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const handleEdit = () => {
    setDisplayName(profile?.displayName || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (displayName.trim() && profile) {
      await saveProfile.mutateAsync({
        displayName: displayName.trim(),
        mcubesId: profile.mcubesId,
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDisplayName('');
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-32 px-2 py-1 bg-background border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-chart-1"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <button
          onClick={handleSave}
          disabled={saveProfile.isPending || !displayName.trim()}
          className="p-1 hover:bg-chart-1/10 rounded transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4 text-chart-1" />
        </button>
        <button onClick={handleCancel} className="p-1 hover:bg-destructive/10 rounded transition-colors">
          <X className="w-4 h-4 text-destructive" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
      <User className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">{profile?.displayName || 'User'}</span>
      {profile?.mcubesId && (
        <span className="text-xs text-muted-foreground">({profile.mcubesId})</span>
      )}
      <button
        onClick={handleEdit}
        className="p-1 hover:bg-chart-1/10 rounded transition-colors ml-1"
        title="Edit profile"
      >
        <Edit2 className="w-3 h-3 text-muted-foreground hover:text-chart-1" />
      </button>
    </div>
  );
}
