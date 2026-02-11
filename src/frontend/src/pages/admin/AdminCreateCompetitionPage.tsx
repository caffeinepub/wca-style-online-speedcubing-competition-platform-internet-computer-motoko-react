import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateCompetition } from '../../hooks/useQueries';
import AdminGuard from '../../components/auth/AdminGuard';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { CompetitionStatus } from '../../backend';

export default function AdminCreateCompetitionPage() {
  const navigate = useNavigate();
  const createCompetition = useCreateCompetition();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<CompetitionStatus>(CompetitionStatus.upcoming);
  const [participantLimit, setParticipantLimit] = useState('');
  const [scrambles, setScrambles] = useState<string[]>(['', '', '', '', '']);

  const handleScrambleChange = (index: number, value: string) => {
    const newScrambles = [...scrambles];
    newScrambles[index] = value;
    setScrambles(newScrambles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const competition = {
      id: BigInt(0),
      name,
      slug,
      startDate: BigInt(new Date(startDate).getTime() * 1_000_000),
      endDate: BigInt(new Date(endDate).getTime() * 1_000_000),
      status,
      participantLimit: participantLimit ? BigInt(participantLimit) : undefined,
      scrambles: scrambles.filter((s) => s.trim() !== ''),
    };

    try {
      const id = await createCompetition.mutateAsync(competition);
      navigate({ to: '/competition/$competitionId', params: { competitionId: id.toString() } });
    } catch (error) {
      console.error('Failed to create competition:', error);
    }
  };

  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Create Competition</h1>
            <p className="text-muted-foreground">Set up a new speedcubing competition</p>
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
                  placeholder="e.g., Weekly 3x3 Championship"
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
                  placeholder="e.g., weekly-3x3-championship"
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
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold mb-4">Scrambles (5 required)</h3>
              <div className="space-y-4">
                {scrambles.map((scramble, index) => (
                  <div key={index}>
                    <label htmlFor={`scramble-${index}`} className="block text-sm font-medium mb-2">
                      Scramble {index + 1} *
                    </label>
                    <input
                      id={`scramble-${index}`}
                      type="text"
                      value={scramble}
                      onChange={(e) => handleScrambleChange(index, e.target.value)}
                      placeholder="e.g., R U R' U' F2 D L2 B2..."
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-chart-1 font-mono text-sm"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

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
