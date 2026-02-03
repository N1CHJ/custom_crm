import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Building2, Edit, Trash2, ArrowUpRight, Plus, Clock, CheckCircle } from 'lucide-react';
import { leadsApi, activitiesApi } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { LeadStatus } from '../types';
import { useAppStore } from '../stores/appStore';
import ActivityTimeline from '../components/common/ActivityTimeline';
import LeadModal from '../components/leads/LeadModal';
import ActivityModal from '../components/activities/ActivityModal';

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-green-100 text-green-700',
  unqualified: 'bg-red-100 text-red-700',
  converted: 'bg-purple-100 text-purple-700',
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { 
    isLeadModalOpen, setLeadModalOpen, 
    isActivityModalOpen, setActivityModalOpen,
    setEditingLead,
    setActivityContext
  } = useAppStore();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.getOne(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: leadsApi.delete,
    onSuccess: () => {
      toast.success('Lead deleted successfully');
      navigate('/leads');
    },
    onError: () => {
      toast.error('Failed to delete lead');
    },
  });

  const convertMutation = useMutation({
    mutationFn: leadsApi.convert,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Lead converted to contact successfully');
      navigate(`/contacts/${data.contact.id}`);
    },
    onError: () => {
      toast.error('Failed to convert lead');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-gray-500">Lead not found</p>
        <Link to="/leads" className="text-sm text-primary-600 hover:text-primary-700">
          Back to leads
        </Link>
      </div>
    );
  }

  const handleEdit = () => {
    setEditingLead(lead);
    setLeadModalOpen(true);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate(lead.id);
    }
  };

  const handleConvert = () => {
    if (confirm('Convert this lead to a contact?')) {
      convertMutation.mutate(lead.id);
    }
  };

  const handleAddActivity = () => {
    setActivityContext({ leadId: lead.id });
    setActivityModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/leads"
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[lead.status]}`}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </span>
          </div>
          {lead.title && (
            <p className="mt-1 text-sm text-gray-500">{lead.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lead.status !== 'converted' && (
            <button
              onClick={handleConvert}
              className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              <ArrowUpRight className="h-4 w-4" />
              Convert
            </button>
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
        {/* Lead Info */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Lead Information</h2>
            <div className="space-y-4">
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a href={`mailto:${lead.email}`} className="text-sm text-primary-600 hover:text-primary-700">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a href={`tel:${lead.phone}`} className="text-sm text-primary-600 hover:text-primary-700">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.company_name && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{lead.company_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Source</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {lead.source?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Score</dt>
                <dd className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full bg-primary-500" style={{ width: `${lead.score}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{lead.score}</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {format(new Date(lead.created_at), 'MMM d, yyyy')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Last Updated</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {format(new Date(lead.updated_at), 'MMM d, yyyy')}
                </dd>
              </div>
            </dl>
          </div>

          {lead.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
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
            <ActivityTimeline activities={lead.activities || []} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => {
          setLeadModalOpen(false);
          setEditingLead(null);
        }}
        lead={lead}
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
