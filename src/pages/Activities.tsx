import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Phone, Mail, Calendar, FileText, CheckCircle, Clock, AlertCircle, Trash2, Edit } from 'lucide-react';
import { activitiesApi } from '../services/api';
import { format, isPast, isToday } from 'date-fns';
import toast from 'react-hot-toast';
import type { Activity, ActivityType } from '../types';
import ActivityModal from '../components/activities/ActivityModal';
import { useAppStore } from '../stores/appStore';
import { Link } from 'react-router-dom';

const activityIcons: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle,
  note: FileText,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function Activities() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { isActivityModalOpen, setActivityModalOpen, editingActivity, setEditingActivity } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ['activities', { search, type: typeFilter, status: statusFilter }],
    queryFn: () => activitiesApi.getAll({ 
      ...(typeFilter && { type: typeFilter }),
      ...(statusFilter && { status: statusFilter }),
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: activitiesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Activity deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete activity');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => activitiesApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Activity marked as completed');
    },
    onError: () => {
      toast.error('Failed to complete activity');
    },
  });

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setActivityModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
  };

  const isOverdue = (activity: Activity) => {
    return activity.status === 'pending' && activity.due_date && isPast(new Date(activity.due_date)) && !isToday(new Date(activity.due_date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data?.total || 0} total activities
          </p>
        </div>
        <button
          onClick={() => {
            setEditingActivity(null);
            setActivityModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Activity
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All Types</option>
          <option value="call">Calls</option>
          <option value="email">Emails</option>
          <option value="meeting">Meetings</option>
          <option value="task">Tasks</option>
          <option value="note">Notes</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Activity List */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <p className="text-gray-500">No activities found</p>
            <button
              onClick={() => {
                setEditingActivity(null);
                setActivityModalOpen(true);
              }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Create your first activity
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data?.data?.map((activity) => {
              const Icon = activityIcons[activity.type];
              const overdue = isOverdue(activity);

              return (
                <div
                  key={activity.id}
                  className={`flex items-start gap-4 p-4 hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    activity.status === 'completed' ? 'bg-green-100' : overdue ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      activity.status === 'completed' ? 'text-green-600' : overdue ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{activity.subject || `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}`}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          <span className="capitalize">{activity.type}</span>
                          {activity.contact_first_name && (
                            <Link 
                              to={`/contacts/${activity.contact_id}`}
                              className="hover:text-primary-600"
                            >
                              • {activity.contact_first_name} {activity.contact_last_name}
                            </Link>
                          )}
                          {activity.deal_name && (
                            <Link 
                              to={`/deals/${activity.deal_id}`}
                              className="hover:text-primary-600"
                            >
                              • {activity.deal_name}
                            </Link>
                          )}
                          {activity.lead_name && (
                            <Link 
                              to={`/leads/${activity.lead_id}`}
                              className="hover:text-primary-600"
                            >
                              • {activity.lead_name}
                            </Link>
                          )}
                        </div>
                        {activity.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{activity.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[activity.status]}`}>
                          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {activity.due_date && (
                          <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : ''}`}>
                            {overdue ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            {format(new Date(activity.due_date), 'MMM d, yyyy h:mm a')}
                          </span>
                        )}
                        {activity.user_name && (
                          <span>Assigned to {activity.user_name}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {activity.status === 'pending' && (
                          <button
                            onClick={() => handleComplete(activity.id)}
                            className="rounded p-1 text-gray-400 hover:bg-green-50 hover:text-green-600"
                            title="Mark as completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(activity)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setActivityModalOpen(false);
          setEditingActivity(null);
        }}
        activity={editingActivity}
      />
    </div>
  );
}
