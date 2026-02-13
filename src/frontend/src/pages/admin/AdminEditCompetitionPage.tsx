import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useAdminGetCompetition, useAdminUpdateCompetition } from '../../hooks/useQueries';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { normalizeError } from '../../api/errors';
import { Event, CompetitionStatus as BackendCompetitionStatus } from '../../backend';
import { EVENT_LABELS } from '../../types/domain';
import CompetitionPricingFields from '../../components/admin/CompetitionPricingFields';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { FeeMode } from '../../backend';

export default function AdminEditCompetitionPage() {
  const navigate = useNavigate();
  const { competitionId: competitionIdParam } = useParams({ from: '/admin/competitions/$competitionId/edit' });
  const competitionId = competitionIdParam ? BigInt(competitionIdParam) : null;

  const { data: competition, isLoading, isError, error } = useAdminGetCompetition(competitionId);
  const updateMutation = useAdminUpdateCompetition();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<string>('upcoming');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationStartDate, setRegistrationStartDate] = useState('');
  const [participantLimit, setParticipantLimit] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [feeMode, setFeeMode] = useState<FeeMode | undefined>(undefined);
  const [scrambles, setScrambles] = useState<Map<Event, string[]>>(new Map());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load competition data when available
  useEffect(() => {
    if (competition) {
      setName(competition.name);
      setSlug(competition.slug);
      setStatus(competition.status.toString());
      setStartDate(new Date(Number(competition.startDate) / 1_000_000).toISOString().slice(0, 16));
      setEndDate(new Date(Number(competition.endDate) / 1_000_000).toISOString().slice(0, 16));
      
      if (competition.registrationStartDate) {
        setRegistrationStartDate(
          new Date(Number(competition.registrationStartDate) / 1_000_000).toISOString().slice(0, 16)
        );
      }
      
      if (competition.participantLimit) {
        setParticipantLimit(competition.participantLimit.toString());
      }
      
      setSelectedEvents(competition.events);
      setFeeMode(competition.feeMode);

      // Build scrambles map from competition data
      const scramblesMap = new Map<Event, string[]>();
      if (competition.scrambles && Array.isArray(competition.scrambles)) {
        competition.scrambles.forEach(([scrambleArray, event]) => {
          if (Array.isArray(scrambleArray) && scrambleArray.length > 0) {
            scramblesMap.set(event, scrambleArray);
          }
        });
      }
      setScrambles(scramblesMap);
    }
  }, [competition]);

  // Validate scrambles
  useEffect(() => {
    if (selectedEvents.length === 0) {
      setValidationError(null);
      return;
    }

    const missingScrambles: string[] = [];
    const invalidScrambles: string[] = [];

    selectedEvents.forEach(event => {
      const eventScrambles = scrambles.get(event);
      if (!eventScrambles || eventScrambles.length === 0) {
        missingScrambles.push(EVENT_LABELS[event]);
      } else if (eventScrambles.length !== 5) {
        invalidScrambles.push(`${EVENT_LABELS[event]} (has ${eventScrambles.length}, needs 5)`);
      } else if (eventScrambles.some(s => !s || s.trim() === '')) {
        invalidScrambles.push(`${EVENT_LABELS[event]} (contains empty scrambles)`);
      }
    });

    if (missingScrambles.length > 0) {
      setValidationError(`Missing scrambles for: ${missingScrambles.join(', ')}`);
    } else if (invalidScrambles.length > 0) {
      setValidationError(`Invalid scrambles for: ${invalidScrambles.join(', ')}`);
    } else {
      setValidationError(null);
    }
  }, [selectedEvents, scrambles]);

  const handleEventToggle = (event: Event, checked: boolean) => {
    if (checked) {
      setSelectedEvents([...selectedEvents, event]);
    } else {
      setSelectedEvents(selectedEvents.filter(e => e !== event));
      // Remove scrambles for unchecked event
      const newScrambles = new Map(scrambles);
      newScrambles.delete(event);
      setScrambles(newScrambles);
    }
  };

  const handleScrambleChange = (event: Event, index: number, value: string) => {
    const newScrambles = new Map(scrambles);
    const eventScrambles = newScrambles.get(event) || ['', '', '', '', ''];
    eventScrambles[index] = value;
    newScrambles.set(event, eventScrambles);
    setScrambles(newScrambles);
  };

  const handleFeeModeChange = (newFeeMode?: FeeMode) => {
    setFeeMode(newFeeMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationError) {
      return;
    }

    if (!competitionId) {
      return;
    }

    try {
      const scramblesArray: [string[], Event][] = selectedEvents.map(event => {
        const eventScrambles = scrambles.get(event) || ['', '', '', '', ''];
        return [eventScrambles, event];
      });

      await updateMutation.mutateAsync({
        id: competitionId,
        updates: {
          name,
          slug,
          status: status as any,
          startDate: BigInt(new Date(startDate).getTime() * 1_000_000),
          endDate: BigInt(new Date(endDate).getTime() * 1_000_000),
          registrationStartDate: registrationStartDate
            ? BigInt(new Date(registrationStartDate).getTime() * 1_000_000)
            : undefined,
          participantLimit: participantLimit ? BigInt(participantLimit) : undefined,
          feeMode: feeMode,
          events: selectedEvents,
          scrambles: scramblesArray,
        },
      });

      navigate({ to: '/admin/competitions' });
    } catch (err) {
      console.error('Failed to update competition:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {normalizeError(error)}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate({ to: '/admin/competitions' })}>
            Back to Competitions
          </Button>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Competition not found
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate({ to: '/admin/competitions' })}>
            Back to Competitions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate({ to: '/admin/competitions' })}>
          ← Back to Competitions
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Competition</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {updateMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {normalizeError(updateMutation.error)}
                </AlertDescription>
              </Alert>
            )}

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
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value)}>
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
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="registrationStartDate">Registration Start Date (Optional)</Label>
              <Input
                id="registrationStartDate"
                type="datetime-local"
                value={registrationStartDate}
                onChange={(e) => setRegistrationStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participantLimit">Participant Limit (Optional)</Label>
              <Input
                id="participantLimit"
                type="number"
                value={participantLimit}
                onChange={(e) => setParticipantLimit(e.target.value)}
                min="1"
              />
            </div>

            <CompetitionPricingFields value={feeMode} onChange={handleFeeModeChange} />

            <div className="space-y-4">
              <Label>Events</Label>
              <div className="space-y-2">
                {Object.entries(EVENT_LABELS).map(([eventKey, label]) => {
                  const event = eventKey as Event;
                  const isChecked = selectedEvents.includes(event);
                  return (
                    <div key={event} className="flex items-center space-x-2">
                      <Checkbox
                        id={event}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleEventToggle(event, checked as boolean)}
                      />
                      <Label htmlFor={event} className="font-normal cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedEvents.length > 0 && (
              <div className="space-y-4">
                <Label>Scrambles (5 per event)</Label>
                {selectedEvents.map(event => {
                  const eventScrambles = scrambles.get(event) || ['', '', '', '', ''];
                  return (
                    <Card key={event}>
                      <CardHeader>
                        <CardTitle className="text-base">{EVENT_LABELS[event]}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {eventScrambles.map((scramble, index) => (
                          <div key={index} className="space-y-1">
                            <Label htmlFor={`${event}-${index}`}>Scramble {index + 1}</Label>
                            <Input
                              id={`${event}-${index}`}
                              value={scramble}
                              onChange={(e) => handleScrambleChange(event, index, e.target.value)}
                              placeholder={`Enter scramble ${index + 1}`}
                              required
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending || !!validationError}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
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
        </CardContent>
      </Card>
    </div>
  );
}
