import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  UserCircle, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { format } from 'date-fns';
import type { Activity } from '../types';

function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'call': return Phone;
    case 'email': return Mail;
    case 'meeting': return Calendar;
    case 'task': return CheckCircle;
    case 'note': return FileText;
    default: return FileText;
  }
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { name: 'Total Leads', value: stats?.totalLeads || 0, icon: Users, color: 'bg-blue-500', link: '/leads' },
    { name: 'Total Contacts', value: stats?.totalContacts || 0, icon: UserCircle, color: 'bg-green-500', link: '/contacts' },
    { name: 'Total Companies', value: stats?.totalCompanies || 0, icon: Building2, color: 'bg-purple-500', link: '/companies' },
    { name: 'Open Deals', value: stats?.totalDeals || 0, icon: DollarSign, color: 'bg-yellow-500', link: '/deals' },
    { name: 'Pipeline Value', value: formatCurrency(stats?.totalValue || 0), icon: TrendingUp, color: 'bg-indigo-500', link: '/pipeline' },
    { name: 'Won Revenue', value: formatCurrency(stats?.wonValue || 0), icon: CheckCircle, color: 'bg-emerald-500', link: '/deals?status=won' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back! Here's what's happening with your sales.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Overview */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pipeline Overview</h2>
            <Link to="/pipeline" className="text-sm text-primary-600 hover:text-primary-700">
              View Pipeline →
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.dealsByStage?.map((stage) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: stage.color }}
                />
                <span className="flex-1 text-sm text-gray-600">{stage.stage}</span>
                <span className="text-sm font-medium text-gray-900">{stage.count} deals</span>
                <span className="text-sm text-gray-500">{formatCurrency(stage.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Activities */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Activities
              {(stats?.overdueActivities || 0) > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {stats?.overdueActivities} overdue
                </span>
              )}
            </h2>
            <Link to="/activities" className="text-sm text-primary-600 hover:text-primary-700">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.upcomingActivities?.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No upcoming activities</p>
            ) : (
              stats?.upcomingActivities?.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.subject}</p>
                      <p className="text-xs text-gray-500">
                        {activity.contact_first_name && `${activity.contact_first_name} ${activity.contact_last_name}`}
                        {activity.deal_name && ` • ${activity.deal_name}`}
                      </p>
                    </div>
                    {activity.due_date && (
                      <span className="text-xs text-gray-500">
                        {format(new Date(activity.due_date), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {stats?.recentActivities?.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No recent activities</p>
            ) : (
              stats?.recentActivities?.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        activity.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          activity.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      {index < (stats?.recentActivities?.length || 0) - 1 && (
                        <div className="w-px flex-1 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                          <p className="text-sm text-gray-500">
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                            {activity.contact_first_name && ` with ${activity.contact_first_name} ${activity.contact_last_name}`}
                            {activity.deal_name && ` • ${activity.deal_name}`}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{activity.description}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
