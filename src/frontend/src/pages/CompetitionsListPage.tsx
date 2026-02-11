import { useGetCompetitions } from '../hooks/useQueries';
import CompetitionCard from '../components/competition/CompetitionCard';
import { Trophy, Loader2 } from 'lucide-react';

export default function CompetitionsListPage() {
  const { data: competitions, isLoading } = useGetCompetitions();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-chart-1 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading competitions...</p>
          </div>
        </div>
      </div>
    );
  }

  const runningCompetitions = competitions?.filter((c) => c.status === 'running') || [];
  const upcomingCompetitions = competitions?.filter((c) => c.status === 'upcoming') || [];
  const completedCompetitions = competitions?.filter((c) => c.status === 'completed') || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-chart-1 to-chart-2 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Online Competitions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compete with speedcubers worldwide in official-style online competitions. Test your skills and climb the leaderboard!
          </p>
        </div>

        {runningCompetitions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-chart-1 rounded-full animate-pulse" />
              Live Competitions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {runningCompetitions.map((comp) => (
                <CompetitionCard key={comp.id.toString()} competition={comp} />
              ))}
            </div>
          </section>
        )}

        {upcomingCompetitions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Upcoming Competitions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingCompetitions.map((comp) => (
                <CompetitionCard key={comp.id.toString()} competition={comp} />
              ))}
            </div>
          </section>
        )}

        {completedCompetitions.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Past Competitions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCompetitions.map((comp) => (
                <CompetitionCard key={comp.id.toString()} competition={comp} />
              ))}
            </div>
          </section>
        )}

        {competitions?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No competitions available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
