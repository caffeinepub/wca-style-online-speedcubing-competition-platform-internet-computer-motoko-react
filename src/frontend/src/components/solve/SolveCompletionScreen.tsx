import { useNavigate } from '@tanstack/react-router';
import { Trophy, BarChart3, ArrowRight, Home, Mail } from 'lucide-react';
import { Event } from '../../backend';
import { Button } from '@/components/ui/button';

interface SolveCompletionScreenProps {
  competitionId: bigint;
  event: Event;
}

export default function SolveCompletionScreen({ competitionId, event }: SolveCompletionScreenProps) {
  const navigate = useNavigate();

  const handleViewLeaderboard = () => {
    navigate({
      to: '/competitions/$competitionId/leaderboard',
      params: { competitionId: competitionId.toString() },
      search: { event },
    });
  };

  const handleChooseAnotherEvent = () => {
    navigate({
      to: '/competitions/$competitionId',
      params: { competitionId: competitionId.toString() },
    });
  };

  const handleFinishCompetition = () => {
    navigate({ to: '/competitions' });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-chart-1 to-chart-2 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-chart-1/20">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold mb-4">Congratulations!</h1>
          <p className="text-xl text-muted-foreground mb-8">
            You've completed all 5 solves. Your results have been submitted to the leaderboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={handleViewLeaderboard}
              size="lg"
              className="px-8 py-6 text-lg shadow-lg shadow-chart-1/20"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Leaderboard
            </Button>
            <Button
              onClick={handleChooseAnotherEvent}
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Choose Another Event
            </Button>
            <Button
              onClick={handleFinishCompetition}
              variant="secondary"
              size="lg"
              className="px-8 py-6 text-lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Finish Competition
            </Button>
          </div>
        </div>

        {/* Video Evidence Section */}
        <div className="bg-card border rounded-lg p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-chart-2" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Video Evidence Submission</h2>
              <p className="text-muted-foreground">
                To validate your results, please submit video evidence of your solves.
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-lg">How to Submit:</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-chart-1 flex-shrink-0">1.</span>
                  <span>Record a video of all your solves for this event</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-chart-1 flex-shrink-0">2.</span>
                  <span>Upload your video to one of the following:</span>
                </li>
                <li className="ml-8 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-chart-1"></div>
                    <span className="font-medium">Google Drive</span>
                    <span className="text-muted-foreground">(set as public link)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-chart-1"></div>
                    <span className="font-medium">YouTube</span>
                    <span className="text-muted-foreground">(unlisted video)</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-chart-1 flex-shrink-0">3.</span>
                  <span>Email the link to:</span>
                </li>
              </ol>

              <div className="mt-4 p-4 bg-background rounded-lg border-2 border-chart-1/20">
                <a
                  href="mailto:hellobugentertainment@gmail.com"
                  className="text-chart-1 font-mono text-lg hover:underline break-all"
                >
                  hellobugentertainment@gmail.com
                </a>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Include your competition name and event in the email subject line for faster processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
