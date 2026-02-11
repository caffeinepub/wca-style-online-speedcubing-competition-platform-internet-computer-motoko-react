import { useNavigate } from '@tanstack/react-router';
import { Trophy, BarChart3, Home } from 'lucide-react';

interface SolveCompletionScreenProps {
  competitionId: string;
}

export default function SolveCompletionScreen({ competitionId }: SolveCompletionScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] space-y-8 px-4">
      <div className="w-24 h-24 bg-gradient-to-br from-chart-1 to-chart-2 rounded-full flex items-center justify-center shadow-lg shadow-chart-1/20">
        <Trophy className="w-12 h-12 text-white" />
      </div>

      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-4xl font-bold">Competition Complete!</h2>
        <p className="text-lg text-muted-foreground">
          You've successfully completed all 5 solves. Your results have been submitted to the leaderboard.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() =>
            navigate({ to: '/competition/$competitionId/leaderboard', params: { competitionId } })
          }
          className="px-8 py-4 bg-chart-1 hover:bg-chart-1/90 text-white font-bold rounded-xl transition-colors shadow-lg shadow-chart-1/20 flex items-center gap-3"
        >
          <BarChart3 className="w-5 h-5" />
          View Leaderboard
        </button>
        <button
          onClick={() => navigate({ to: '/competition/$competitionId', params: { competitionId } })}
          className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl transition-colors flex items-center gap-3"
        >
          <Home className="w-5 h-5" />
          Competition Home
        </button>
      </div>
    </div>
  );
}
