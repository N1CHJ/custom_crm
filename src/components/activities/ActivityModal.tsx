import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { activitiesApi, contactsApi, dealsApi, leadsApi } from '../../services/api';
import toast from 'react-hot-toast';
import type { Activity, ActivityType } from '../../types';
import { useAppStore } from '../../stores/appStore';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: Activity | null;
}

interface FormData {
  type: ActivityType;
  subject: string;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  due_date: string;
  lead_id: string;
  contact_id: string;
  deal_id: string;
}

export default function ActivityModal({ isOpen, onClose, activity }: ActivityModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!activity;
  const { activityContext } = useAppStore();

  const { data: contacts } = useQuery({
    queryKey: ['contacts-dropdown'],
    queryFn: () => contactsApi.getAll({ limit: '100' }),
    enabled: isOpen,
  });

  const { data: deals } = useQuery({
    queryKey: ['deals-dropdown'],
    queryFn: () => dealsApi.getAll({ limit: '100' }),
    enabled: isOpen,
  });

  const { data: leads } = useQuery({
    queryKey: ['leads-dropdown'],
    queryFn: () => leadsApi.getAll({ limit: '100' }),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      type: 'task',
      subject: '',
      description: '',
      status: 'pending',
      due_date: '',
      lead_id: '',
      contact_id: '',
      deal_id: '',
    },
  });

  useEffect(() => {
    if (activity) {
      reset({
        type: activity.type || 'task',
        subject: activity.subject || '',
        description: activity.description || '',
        status: activity.status || 'pending',
        due_date: activity.due_date?.split('T')[0] || '',
        lead_id: activity.lead_id || '',
        contact_id: activity.contact_id || '',
        deal_id: activity.deal_id || '',
      });
    } else {
      reset({
        type: 'task',
        subject: '',
        description: '',
        status: 'pending',
        due_date: '',
        lead_id: activityContext?.leadId || '',
        contact_id: activityContext?.contactId || '',
        deal_id: activityContext?.dealId || '',
      });
    }
  }, [activity, reset, activityContext]);

  const createMutation = useMutation({
    mutationFn: activitiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['contact'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
      toast.success('Activity created successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to create activity');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Activity> }) =>
      activitiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['contact'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
      toast.success('Activity updated successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to update activity');
    },
  });

  const onSubmit = (data: FormData) => {
    const submitData: Partial<Activity> = {
      type: data.type,
      subject: data.subject,
      description: data.description,
      status: data.status,
      lead_id: data.lead_id || null,
      contact_id: data.contact_id || null,
      deal_id: data.deal_id || null,
      due_date: data.due_date || null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: activity.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Activity' : 'Add New Activity'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type *
                </label>
                <select
                  {...register('type', { required: 'Type is required' })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="task">Task</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject *
              </label>
              <input
                type="text"
                {...register('subject', { required: 'Subject is required' })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Follow up on proposal"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Activity details..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="datetime-local"
                {...register('due_date')}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="mb-3 text-sm font-medium text-gray-700">Link to (optional)</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">Lead</label>
                  <select
                    {...register('lead_id')}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">No Lead</option>
                    {leads?.data?.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Contact</label>
                  <select
                    {...register('contact_id')}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">No Contact</option>
                    {contacts?.data?.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Deal</label>
                  <select
                    {...register('deal_id')}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">No Deal</option>
                    {deals?.data?.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Activity' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
