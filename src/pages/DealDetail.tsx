import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, Calendar, Building2, User, Edit, Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';
import { dealsApi } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAppStore } from '../stores/appStore';
import ActivityTimeline from '../components/common/ActivityTimeline';
import DealModal from '../components/deals/DealModal';
import ActivityModal from '../components/activities/ActivityModal';

const statusColors = {
  open: 'bg-blue-100 text-blue-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { 
    isDealModalOpen, setDealModalOpen, 
    isActivityModalOpen, setActivityModalOpen,
    setEditingDeal,
    setActivityContext
  } = useAppStore();

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => dealsApi.getOne(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: dealsApi.delete,
    onSuccess: () => {
      toast.success('Deal deleted successfully');
      navigate('/deals');
    },
    onError: () => {
      toast.error('Failed to delete deal');
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => dealsApi.updateStage(id, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
      toast.success('Deal updated successfully');
    },
    onError: () => {
      toast.error('Failed to update deal');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-gray-500">Deal not found</p>
        <Link to="/deals" className="text-sm text-primary-600 hover:text-primary-700">
          Back to deals
        </Link>
      </div>
    );
  }

  const handleEdit = () => {
    setEditingDeal(deal);
    setDealModalOpen(true);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this deal?')) {
      deleteMutation.mutate(deal.id);
    }
  };

  const handleAddActivity = () => {
    setActivityContext({ dealId: deal.id });
    setActivityModalOpen(true);
  };

  const handleMarkWon = () => {
    updateStageMutation.mutate({ id: deal.id, stageId: 'stage_5' });
  };

  const handleMarkLost = () => {
    updateStageMutation.mutate({ id: deal.id, stageId: 'stage_6' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/deals"
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{deal.name}</h1>
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[deal.status]}`}>
              {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
            {deal.stage_name && (
              <span className="flex items-center gap-1">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: deal.stage_color || '#6366f1' }}
                />
                {deal.stage_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {deal.value.toLocaleString()} {deal.currency}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deal.status === 'open' && (
            <>
              <button
                onClick={handleMarkWon}
                className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Won
              </button>
              <button
                onClick={handleMarkLost}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <XCircle className="h-4 w-4" />
                Mark Lost
              </button>
            </>
          )}
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deal Info */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Deal Information</h2>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Value</dt>
                <dd className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  {deal.value.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Probability</dt>
                <dd className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full bg-primary-500" style={{ width: `${deal.probability}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{deal.probability}%</span>
                </dd>
              </div>
              {deal.expected_close_date && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Expected Close</dt>
                  <dd className="flex items-center gap-1 text-sm font-medium text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {format(new Date(deal.expected_close_date), 'MMM d, yyyy')}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {format(new Date(deal.created_at), 'MMM d, yyyy')}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Related</h2>
            <div className="space-y-4">
              {deal.contact_first_name && (
                <Link 
                  to={`/contacts/${deal.contact_id}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {deal.contact_first_name} {deal.contact_last_name}
                    </p>
                    <p className="text-xs text-gray-500">Contact</p>
                  </div>
                </Link>
              )}
              {deal.company_name && (
                <Link 
                  to={`/companies/${deal.company_id}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{deal.company_name}</p>
                    <p className="text-xs text-gray-500">Company</p>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {deal.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </div>

        {/* Activities */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
              <button
                onClick={handleAddActivity}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </button>
            </div>
            <ActivityTimeline activities={deal.activities || []} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <DealModal
        isOpen={isDealModalOpen}
        onClose={() => {
          setDealModalOpen(false);
          setEditingDeal(null);
        }}
        deal={deal}
      />
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setActivityModalOpen(false);
          setActivityContext(null);
        }}
      />
    </div>
  );
}
