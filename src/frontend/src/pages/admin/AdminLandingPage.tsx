import { useNavigate } from '@tanstack/react-router';
import { AdminGuard } from '../../components/auth/AdminGuard';
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
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
              <p className="text-muted-foreground text-lg">
                Manage competitions, users, and results
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {adminSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.path}
                    onClick={() => navigate({ to: section.path })}
                    className="group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-lg transition-all"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    <div className="relative">
                      <Icon className="h-12 w-12 mb-4 text-primary" />
                      <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
