import { useState } from 'react';
import { useGetCallerUserProfile } from '../../hooks/useCurrentUserProfile';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import { User, Edit2, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';

export default function ProfileMenu() {
  const { data: profile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState('');

  const handleEdit = () => {
    setDisplayName(profile?.displayName || '');
    setCountry(profile?.country || '');
    setGender(profile?.gender || '');
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (displayName.trim() && profile) {
      try {
        await saveProfile.mutateAsync({
          displayName: displayName.trim(),
          mcubesId: profile.mcubesId,
          country: country.trim() || undefined,
          gender: gender || undefined,
        });
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to save profile:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          onClick={handleEdit}
          className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 hover:bg-accent transition-colors"
        >
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{profile?.displayName || 'User'}</span>
          {profile?.mcubesId && (
            <span className="text-xs text-muted-foreground">({profile.mcubesId})</span>
          )}
          <Edit2 className="w-3 h-3 text-muted-foreground ml-1" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Not set"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not set</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {profile?.mcubesId && (
            <div className="space-y-2">
              <Label>MCubes ID</Label>
              <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                {profile.mcubesId}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveProfile.isPending || !displayName.trim()}
          >
            {saveProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
