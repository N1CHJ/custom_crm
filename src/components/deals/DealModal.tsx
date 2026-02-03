import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { dealsApi, contactsApi, companiesApi, pipelineApi } from '../../services/api';
import toast from 'react-hot-toast';
import type { Deal } from '../../types';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal?: Deal | null;
}

interface FormData {
  name: string;
  value: number;
  currency: string;
  probability: number;
  expected_close_date: string;
  stage_id: string;
  contact_id: string;
  company_id: string;
  notes: string;
}

export default function DealModal({ isOpen, onClose, deal }: DealModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!deal;

  const { data: contacts } = useQuery({
    queryKey: ['contacts-dropdown'],
    queryFn: () => contactsApi.getAll({ limit: '100' }),
    enabled: isOpen,
  });

  const { data: companies } = useQuery({
    queryKey: ['companies-dropdown'],
    queryFn: () => companiesApi.getAll({ limit: '100' }),
    enabled: isOpen,
  });

  const { data: stages } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: () => pipelineApi.getStages(),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      value: 0,
      currency: 'USD',
      probability: 50,
      expected_close_date: '',
      stage_id: '',
      contact_id: '',
      company_id: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (deal) {
      reset({
        name: deal.name || '',
        value: deal.value || 0,
        currency: deal.currency || 'USD',
        probability: deal.probability || 50,
        expected_close_date: deal.expected_close_date?.split('T')[0] || '',
        stage_id: deal.stage_id || '',
        contact_id: deal.contact_id || '',
        company_id: deal.company_id || '',
        notes: deal.notes || '',
      });
    } else {
      reset({
        name: '',
        value: 0,
        currency: 'USD',
        probability: 50,
        expected_close_date: '',
        stage_id: stages?.data?.[0]?.id || '',
        contact_id: '',
        company_id: '',
        notes: '',
      });
    }
  }, [deal, reset, stages]);

  const createMutation = useMutation({
    mutationFn: dealsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Deal created successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to create deal');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('../../types').Deal> }) =>
      dealsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', deal?.id] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Deal updated successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to update deal');
    },
  });

  const onSubmit = (data: FormData) => {
    const submitData: Partial<import('../../types').Deal> = {
      ...data,
      contact_id: data.contact_id || null,
      company_id: data.company_id || null,
      expected_close_date: data.expected_close_date || null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: deal.id, data: submitData });
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
            {isEditing ? 'Edit Deal' : 'Add New Deal'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Deal Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Deal name is required' })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Enterprise Software License"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Value *
                </label>
                <div className="mt-1 flex">
                  <input
                    type="number"
                    {...register('value', { 
                      required: 'Value is required',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Value must be positive' }
                    })}
                    className="w-full rounded-l-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="10000"
                  />
                  <select
                    {...register('currency')}
                    className="rounded-r-lg border border-l-0 border-gray-200 px-2 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                {errors.value && (
                  <p className="mt-1 text-sm text-red-500">{errors.value.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Probability (%)
                </label>
                <input
                  type="number"
                  {...register('probability', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Min is 0' },
                    max: { value: 100, message: 'Max is 100' }
                  })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pipeline Stage
                </label>
                <select
                  {...register('stage_id')}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select Stage</option>
                  {stages?.data?.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  {...register('expected_close_date')}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <select
                {...register('company_id')}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">No Company</option>
                {companies?.data?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Additional notes about this deal..."
              />
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Deal' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
