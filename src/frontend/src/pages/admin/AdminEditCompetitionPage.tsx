import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import AdminGuard from '../../components/auth/AdminGuard';
import { useGetCompetition, useAdminUpdateCompetition } from '../../hooks/useQueries';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { normalizeError } from '../../api/errors';
import { EVENT_LABELS, ALL_EVENTS } from '../../types/domain';
import type { Event, CompetitionStatus, CompetitionInput } from '../../backend';

export default function AdminEditCompetitionPage() {
  const navigate = useNavigate();
  const { competitionId } = useParams({ strict: false }) as { competitionId: string };
  const { data: competition, isLoading } = useGetCompetition(BigInt(competitionId));
  const updateCompetitionMutation = useAdminUpdateCompetition();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<CompetitionStatus>('upcoming' as CompetitionStatus);
  const [participantLimit, setParticipantLimit] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [scramblesByEvent, setScramblesByEvent] = useState<Partial<Record<Event, string[]>>>({});

  useEffect(() => {
    if (competition) {
      setName(competition.name);
      setSlug(competition.slug);
      setStartDate(new Date(Number(competition.startDate) / 1000000).toISOString().slice(0, 16));
      setEndDate(new Date(Number(competition.endDate) / 1000000).toISOString().slice(0, 16));
      setStatus(competition.status);
      setParticipantLimit(competition.participantLimit ? competition.participantLimit.toString() : '');
      setEntryFee(competition.entryFee ? competition.entryFee.toString() : '');
      setSelectedEvents(competition.events);

      // Load existing scrambles
      const scrambles: Partial<Record<Event, string[]>> = {};
      for (const [scrambleList, event] of competition.scrambles) {
        scrambles[event] = scrambleList;
      }
      setScramblesByEvent(scrambles);
    }
  }, [competition]);

  const handleEventToggle = (event: Event, checked: boolean) => {
    if (checked) {
      setSelectedEvents([...selectedEvents, event]);
      if (!scramblesByEvent[event]) {
        setScramblesByEvent({ ...scramblesByEvent, [event]: ['', '', '', '', ''] });
      }
    } else {
      setSelectedEvents(selectedEvents.filter(e => e !== event));
      const newScrambles = { ...scramblesByEvent };
      delete newScrambles[event];
      setScramblesByEvent(newScrambles);
    }
  };

  const handleScrambleChange = (event: Event, index: number, value: string) => {
    const eventScrambles = scramblesByEvent[event] || ['', '', '', '', ''];
    const newScrambles = [...eventScrambles];
    newScrambles[index] = value;
    setScramblesByEvent({ ...scramblesByEvent, [event]: newScrambles });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEvents.length === 0) {
      toast.error('Please select at least one event');
      return;
    }

    // Validate scrambles
    for (const event of selectedEvents) {
      const eventScrambles = scramblesByEvent[event] || [];
      if (eventScrambles.length !== 5) {
        toast.error(`Event ${EVENT_LABELS[event]} must have exactly 5 scrambles`);
        return;
      }
      if (eventScrambles.some(s => !s.trim())) {
        toast.error(`All scrambles for ${EVENT_LABELS[event]} must be filled`);
        return;
      }
    }

    const scrambles: [string[], Event][] = selectedEvents.map(event => [
      scramblesByEvent[event] || [],
      event,
    ]);

    const competitionInput: CompetitionInput = {
      name,
      slug,
      startDate: BigInt(new Date(startDate).getTime() * 1000000),
      endDate: BigInt(new Date(endDate).getTime() * 1000000),
      status,
      participantLimit: participantLimit ? BigInt(participantLimit) : undefined,
      entryFee: entryFee ? BigInt(entryFee) : undefined,
      events: selectedEvents,
      scrambles,
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

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminGuard>
    );
  }

  if (!competition) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Competition not found</p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/admin/competitions' })}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Competitions
          </Button>

          <h1 className="text-4xl font-bold mb-8">Edit Competition</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>

              <div className="space-y-2">
                <Label htmlFor="name">Competition Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL-friendly identifier)</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="participantLimit">Participant Limit (optional)</Label>
                  <Input
                    id="participantLimit"
                    type="number"
                    value={participantLimit}
                    onChange={(e) => setParticipantLimit(e.target.value)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryFee">Entry Fee in INR (optional)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    placeholder="Leave empty for free"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Events</h2>
              <div className="space-y-2">
                {ALL_EVENTS.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={(checked) => handleEventToggle(event, checked as boolean)}
                    />
                    <Label htmlFor={event} className="cursor-pointer">
                      {EVENT_LABELS[event]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {selectedEvents.length > 0 && (
              <div className="bg-card rounded-lg border p-6 space-y-6">
                <h2 className="text-xl font-semibold">Scrambles (5 per event)</h2>
                {selectedEvents.map((event) => (
                  <div key={event} className="space-y-3">
                    <h3 className="font-medium">{EVENT_LABELS[event]}</h3>
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div key={index} className="space-y-1">
                        <Label htmlFor={`${event}-${index}`}>Scramble {index + 1}</Label>
                        <Textarea
                          id={`${event}-${index}`}
                          value={scramblesByEvent[event]?.[index] || ''}
                          onChange={(e) => handleScrambleChange(event, index, e.target.value)}
                          placeholder={`Enter scramble ${index + 1}`}
                          rows={2}
                          required
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={updateCompetitionMutation.isPending}
                className="flex-1"
              >
                {updateCompetitionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Competition
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/admin/competitions' })}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}
