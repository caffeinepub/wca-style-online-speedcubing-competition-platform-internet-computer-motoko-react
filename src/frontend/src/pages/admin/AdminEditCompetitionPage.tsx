import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import { useAdminGetAllCompetitions, useAdminUpdateCompetition } from '../../hooks/useQueries';
import { normalizeError } from '../../api/errors';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EVENT_LABELS } from '../../types/domain';
import CompetitionPricingFields from '../../components/admin/CompetitionPricingFields';
import type { Event } from '../../backend';
import type { CompetitionInput, FeeMode, CompetitionStatus } from '../../types/backend-extended';

export default function AdminEditCompetitionPage() {
  const navigate = useNavigate();
  const { competitionId } = useParams({ strict: false }) as { competitionId: string };
  const { data: competitions, isLoading: loadingCompetitions } = useAdminGetAllCompetitions();
  const updateCompetitionMutation = useAdminUpdateCompetition();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationStartDate, setRegistrationStartDate] = useState('');
  const [status, setStatus] = useState<CompetitionStatus>('upcoming');
  const [participantLimit, setParticipantLimit] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [scrambles, setScrambles] = useState<Record<Event, string[]>>({} as Record<Event, string[]>);
  const [feeMode, setFeeMode] = useState<FeeMode | undefined>(undefined);

  useEffect(() => {
    if (competitions) {
      const competition = competitions.find((c) => c.id === BigInt(competitionId));
      if (competition) {
        setName(competition.name);
        setSlug(competition.slug);
        setStartDate(new Date(Number(competition.startDate) / 1000000).toISOString().slice(0, 16));
        setEndDate(new Date(Number(competition.endDate) / 1000000).toISOString().slice(0, 16));
        if (competition.registrationStartDate) {
          setRegistrationStartDate(new Date(Number(competition.registrationStartDate) / 1000000).toISOString().slice(0, 16));
        }
        setStatus(competition.status);
        setParticipantLimit(competition.participantLimit ? competition.participantLimit.toString() : '');
        setSelectedEvents(competition.events);
        setFeeMode(competition.feeMode);
        
        const scrambleMap: Record<Event, string[]> = {} as Record<Event, string[]>;
        competition.scrambles.forEach(([scrambleList, event]) => {
          scrambleMap[event] = scrambleList;
        });
        setScrambles(scrambleMap);
      }
    }
  }, [competitions, competitionId]);

  const handleEventToggle = (event: Event) => {
    setSelectedEvents((prev) => {
      if (prev.includes(event)) {
        const newEvents = prev.filter((e) => e !== event);
        const newScrambles = { ...scrambles };
        delete newScrambles[event];
        setScrambles(newScrambles);
        return newEvents;
      } else {
        return [...prev, event];
      }
    });
  };

  const handleScrambleChange = (event: Event, index: number, value: string) => {
    setScrambles((prev) => {
      const eventScrambles = prev[event] || ['', '', '', '', ''];
      const newEventScrambles = [...eventScrambles];
      newEventScrambles[index] = value;
      return { ...prev, [event]: newEventScrambles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEvents.length === 0) {
      toast.error('Please select at least one event');
      return;
    }

    // Validate scrambles
    for (const event of selectedEvents) {
      const eventScrambles = scrambles[event] || [];
      if (eventScrambles.length !== 5 || eventScrambles.some((s) => !s.trim())) {
        toast.error(`Each event must have exactly 5 scrambles. Please check ${EVENT_LABELS[event]}.`);
        return;
      }
    }

    const competitionInput: CompetitionInput = {
      name,
      slug,
      startDate: BigInt(new Date(startDate).getTime() * 1000000),
      endDate: BigInt(new Date(endDate).getTime() * 1000000),
      status,
      participantLimit: participantLimit ? BigInt(participantLimit) : undefined,
      feeMode,
      events: selectedEvents,
      scrambles: selectedEvents.map((event) => [scrambles[event] || [], event]),
      registrationStartDate: registrationStartDate ? BigInt(new Date(registrationStartDate).getTime() * 1000000) : undefined,
    };

    try {
      await updateCompetitionMutation.mutateAsync({
        id: BigInt(competitionId),
        competition: competitionInput,
      });
      toast.success('Competition updated successfully');
      navigate({ to: '/admin/competitions' });
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  if (loadingCompetitions) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Edit Competition</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Competition Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(val) => setStatus(val as CompetitionStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="registrationStartDate">Registration Start Date (optional)</Label>
                  <Input
                    id="registrationStartDate"
                    type="datetime-local"
                    value={registrationStartDate}
                    onChange={(e) => setRegistrationStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="participantLimit">Participant Limit (optional)</Label>
                  <Input
                    id="participantLimit"
                    type="number"
                    value={participantLimit}
                    onChange={(e) => setParticipantLimit(e.target.value)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <CompetitionPricingFields value={feeMode} onChange={setFeeMode} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Events & Scrambles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Events</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(EVENT_LABELS) as Event[]).map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Checkbox
                          id={event}
                          checked={selectedEvents.includes(event)}
                          onCheckedChange={() => handleEventToggle(event)}
                        />
                        <label htmlFor={event} className="text-sm cursor-pointer">
                          {EVENT_LABELS[event]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedEvents.map((event) => (
                  <div key={event} className="space-y-2">
                    <Label>{EVENT_LABELS[event]} - Scrambles (5 required)</Label>
                    {[0, 1, 2, 3, 4].map((index) => (
                      <Textarea
                        key={index}
                        placeholder={`Scramble ${index + 1}`}
                        value={scrambles[event]?.[index] || ''}
                        onChange={(e) => handleScrambleChange(event, index, e.target.value)}
                        rows={2}
                        required
                      />
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/admin/competitions' })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCompetitionMutation.isPending}>
                {updateCompetitionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}
