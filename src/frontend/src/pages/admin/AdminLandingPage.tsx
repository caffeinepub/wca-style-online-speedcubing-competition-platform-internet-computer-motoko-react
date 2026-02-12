import { useNavigate } from '@tanstack/react-router';
import AdminGuard from '../../components/auth/AdminGuard';
import { Users, Trophy, BarChart3, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLandingPage() {
  const navigate = useNavigate();

  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage user accounts, permissions, and competition status',
      icon: Users,
      path: '/admin/users',
      color: 'from-chart-1 to-chart-2',
    },
    {
      title: 'Competition Management',
      description: 'Create, edit, and manage competitions',
      icon: Trophy,
      path: '/admin/competitions',
      color: 'from-chart-2 to-chart-3',
    },
    {
      title: 'Results Management',
      description: 'View and manage competition results',
      icon: BarChart3,
      path: '/admin/results',
      color: 'from-chart-3 to-chart-4',
    },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-4">Admin Dashboard</h1>
            <p className="text-xl text-muted-foreground">
              Manage competitions, users, and results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {adminSections.map((section) => (
              <button
                key={section.path}
                onClick={() => navigate({ to: section.path })}
                className="bg-card border border-border rounded-xl p-8 hover:border-chart-1/50 hover:shadow-lg hover:shadow-chart-1/5 transition-all text-left group"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <section.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-chart-1 transition-colors">
                  {section.title}
                </h3>
                <p className="text-muted-foreground">{section.description}</p>
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => navigate({ to: '/admin/competitions/create' })}>Create Competition</Button>
              <Button variant="outline" onClick={() => navigate({ to: '/admin/go-live' })}>
                <Rocket className="mr-2 h-4 w-4" />
                Go Live
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
