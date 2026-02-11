import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateCompetition } from '../../hooks/useQueries';
import AdminGuard from '../../components/auth/AdminGuard';
import { Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { CompetitionStatus, Event } from '../../backend';
import { ALL_EVENTS, EVENT_LABELS } from '../../types/domain';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function AdminCreateCompetitionPage() {
  const navigate = useNavigate();
  const createCompetition = useCreateCompetition();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<CompetitionStatus>(CompetitionStatus.upcoming);
  const [participantLimit, setParticipantLimit] = useState('');
  const [isPaid, setIsPaid] = useState<'free' | 'paid'>('free');
  const [entryFee, setEntryFee] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([Event.threeByThree]);
  const [scramblesByEvent, setScramblesByEvent] = useState<Partial<Record<Event, string[]>>>({
    [Event.threeByThree]: ['', '', '', '', ''],
  });

  const handleEventToggle = (event: Event, checked: boolean) => {
    if (checked) {
      setSelectedEvents([...selectedEvents, event]);
      setScramblesByEvent({
        ...scramblesByEvent,
        [event]: ['', '', '', '', ''],
      });
    } else {
      setSelectedEvents(selectedEvents.filter((e) => e !== event));
      const newScrambles = { ...scramblesByEvent };
      delete newScrambles[event];
      setScramblesByEvent(newScrambles);
    }
  };

  const handleScrambleChange = (event: Event, index: number, value: string) => {
    const currentScrambles = scramblesByEvent[event] || ['', '', '', '', ''];
    const newScrambles = [...currentScrambles];
    newScrambles[index] = value;
    setScramblesByEvent({
      ...scramblesByEvent,
      [event]: newScrambles,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEvents.length === 0) {
      alert('Please select at least one event');
      return;
    }

    // Validate scrambles
    for (const event of selectedEvents) {
      const scrambles = scramblesByEvent[event] || [];
      const validScrambles = scrambles.filter((s) => s.trim() !== '');
      if (validScrambles.length !== 5) {
        alert(`Please provide exactly 5 scrambles for ${EVENT_LABELS[event]}`);
        return;
      }
    }

    if (isPaid === 'paid' && (!entryFee || Number(entryFee) <= 0)) {
      alert('Please enter a valid entry fee amount');
      return;
    }

    const scrambles: Array<[string[], Event]> = selectedEvents.map((event) => [
      (scramblesByEvent[event] || []).filter((s) => s.trim() !== ''),
      event,
    ]);

    const competition = {
      name,
      slug,
      startDate: BigInt(new Date(startDate).getTime() * 1_000_000),
      endDate: BigInt(new Date(endDate).getTime() * 1_000_000),
      status,
      participantLimit: participantLimit ? BigInt(participantLimit) : undefined,
      entryFee: isPaid === 'paid' ? BigInt(entryFee) : undefined,
      events: selectedEvents,
      scrambles,
    };

    try {
      const id = await createCompetition.mutateAsync(competition);
      navigate({ to: '/competition/$competitionId', params: { competitionId: id.toString() } });
    } catch (error) {
      console.error('Failed to create competition:', error);
      alert('Failed to create competition. Please try again.');
    }
  };

  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Create Competition</h1>
            <p className="text-muted-foreground">Set up a new speedcubing competition with multiple events</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Competition Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Weekly Multi-Event Championship"
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1"
                  required
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-2">
                  Slug (URL-friendly) *
                </label>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="e.g., weekly-multi-event-championship"
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium mb-2">
                    Start Date *
                  </label>
                  <input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium mb-2">
                    End Date *
                  </label>
                  <input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CompetitionStatus)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="participantLimit" className="block text-sm font-medium mb-2">
                    Participant Limit (optional)
                  </label>
                  <input
                    id="participantLimit"
                    type="number"
                    value={participantLimit}
                    onChange={(e) => setParticipantLimit(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    min="1"
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Entry Type *</label>
                <RadioGroup value={isPaid} onValueChange={(value) => setIsPaid(value as 'free' | 'paid')}>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="free" id="free" />
                    <Label htmlFor="free" className="cursor-pointer">
                      Free Competition
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid" className="cursor-pointer">
                      Paid Competition
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {isPaid === 'paid' && (
                <div>
                  <label htmlFor="entryFee" className="block text-sm font-medium mb-2">
                    Entry Fee (INR) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="entryFee"
                      type="number"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      placeholder="e.g., 100"
                      min="1"
                      className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1"
                      required={isPaid === 'paid'}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Payment will be collected via Razorpay (test mode)
                  </p>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold mb-4">Select Events *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
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
              {selectedEvents.length === 0 && (
                <p className="text-sm text-destructive">Please select at least one event</p>
              )}
            </div>

            {selectedEvents.map((event) => (
              <div key={event} className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold mb-4">{EVENT_LABELS[event]} - Scrambles (5 required)</h3>
                <div className="space-y-4">
                  {(scramblesByEvent[event] || ['', '', '', '', '']).map((scramble, index) => (
                    <div key={index}>
                      <label htmlFor={`scramble-${event}-${index}`} className="block text-sm font-medium mb-2">
                        Scramble {index + 1} *
                      </label>
                      <input
                        id={`scramble-${event}-${index}`}
                        type="text"
                        value={scramble}
                        onChange={(e) => handleScrambleChange(event, index, e.target.value)}
                        placeholder="e.g., R U R' U' F2 D L2 B2..."
                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1 font-mono text-sm"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createCompetition.isPending}
                className="flex-1 px-8 py-3 bg-chart-1 hover:bg-chart-1/90 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createCompetition.isPending ? 'Creating...' : 'Create Competition'}
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: '/' })}
                className="px-8 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}
