import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useCurrentUserProfile';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { ArrowLeft, Loader2, CreditCard, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import PaymentsPurchasesSection from '../components/profile/PaymentsPurchasesSection';

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

export default function ProfilePage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState<string>('');
  const [gender, setGender] = useState<string>('');

  const isAuthenticated = !!identity;

  // Redirect if not authenticated
  if (!isAuthenticated && !profileLoading) {
    navigate({ to: '/' });
    return null;
  }

  // Initialize form when profile loads
  if (userProfile && !isEditing && displayName === '') {
    setDisplayName(userProfile.displayName);
    setCountry(userProfile.country || '');
    setGender(userProfile.gender || '');
  }

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

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-chart-1 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your profile information and view payment history</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="bg-card border border-border rounded-xl p-6">
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

                  <div className="flex gap-2 pt-6">
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
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentsPurchasesSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
