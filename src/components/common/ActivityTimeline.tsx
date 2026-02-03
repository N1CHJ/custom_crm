import { Phone, Mail, Calendar, FileText, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Activity, ActivityType } from '../../types';

const activityIcons: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle,
  note: FileText,
};

const activityColors: Record<ActivityType, string> = {
  call: 'bg-green-100 text-green-600',
  email: 'bg-blue-100 text-blue-600',
  meeting: 'bg-purple-100 text-purple-600',
  task: 'bg-orange-100 text-orange-600',
  note: 'bg-gray-100 text-gray-600',
};

interface ActivityTimelineProps {
  activities: Activity[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-sm text-gray-500">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type];
          const colorClass = activityColors[activity.type];

          return (
            <div key={activity.id} className="relative flex gap-4">
              {/* Icon */}
              <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {activity.subject || `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {activity.user_name && `${activity.user_name} • `}
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    activity.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : activity.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {activity.status}
                  </span>
                </div>

                {activity.description && (
                  <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                    {activity.description}
                  </p>
                )}

                {activity.due_date && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    Due: {format(new Date(activity.due_date), 'MMM d, yyyy h:mm a')}
                  </p>
                )}

                {activity.outcome && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Outcome:</span> {activity.outcome}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
