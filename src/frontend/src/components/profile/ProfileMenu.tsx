import { useState } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useCurrentUserProfile';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import { User, LogOut, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentsPurchasesSection from './PaymentsPurchasesSection';

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'China',
  'Brazil',
  'Other',
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function ProfileMenu() {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState<string>('');
  const [gender, setGender] = useState<string>('');

  const isAuthenticated = !!identity;
  const isLoggingOut = loginStatus === 'logging-in';

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && userProfile) {
      setDisplayName(userProfile.displayName);
      setCountry(userProfile.country || '');
      setGender(userProfile.gender || '');
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    setIsOpen(false);
  };

  const handleSave = async () => {
    if (!userProfile) return;

    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        ...userProfile,
        displayName: displayName.trim(),
        country: country || undefined,
        gender: gender || undefined,
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setCountry(userProfile.country || '');
      setGender(userProfile.gender || '');
    }
    setIsEditing(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <User className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>View and manage your profile information and purchases</DialogDescription>
        </DialogHeader>

        {profileLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-chart-1" />
          </div>
        ) : (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="w-4 h-4 mr-2" />
                Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              {userProfile && (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mcubesId">MCubes ID</Label>
                      <Input id="mcubesId" value={userProfile.mcubesId} disabled className="mt-1.5" />
                    </div>

                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={!isEditing}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={country} onValueChange={setCountry} disabled={!isEditing}>
                        <SelectTrigger id="country" className="mt-1.5">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={gender} onValueChange={setGender} disabled={!isEditing}>
                        <SelectTrigger id="gender" className="mt-1.5">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDERS.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave} disabled={saveProfile.isPending} className="flex-1">
                          {saveProfile.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                        <Button onClick={handleCancel} variant="outline" disabled={saveProfile.isPending}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)} className="flex-1">
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-border">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  disabled={isLoggingOut}
                  className="w-full text-destructive hover:text-destructive"
                >
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
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <PaymentsPurchasesSection />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
