import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Globe, Phone, MapPin, Users, Edit, Trash2, Plus } from 'lucide-react';
import { companiesApi } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ActivityTimeline from '../components/common/ActivityTimeline';
import CompanyModal from '../components/companies/CompanyModal';
import ActivityModal from '../components/activities/ActivityModal';
import { useState } from 'react';
import { useAppStore } from '../stores/appStore';

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isActivityModalOpen, setActivityModalOpen, setActivityContext } = useAppStore();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companiesApi.getOne(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: companiesApi.delete,
    onSuccess: () => {
      toast.success('Company deleted successfully');
      navigate('/companies');
    },
    onError: () => {
      toast.error('Failed to delete company');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-gray-500">Company not found</p>
        <Link to="/companies" className="text-sm text-primary-600 hover:text-primary-700">
          Back to companies
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this company?')) {
      deleteMutation.mutate(company.id);
    }
  };

  const handleAddActivity = () => {
    setActivityContext({ companyId: company.id });
    setActivityModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/companies"
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              {company.industry && (
                <p className="text-sm text-gray-500">{company.industry}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
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
        {/* Company Info */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Company Information</h2>
            <div className="space-y-4">
              {company.domain && (
                <a
                  href={`https://${company.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-primary-600 hover:text-primary-700"
                >
                  <Globe className="h-5 w-5" />
                  <span className="text-sm">{company.domain}</span>
                </a>
              )}
              {company.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a href={`tel:${company.phone}`} className="text-sm text-primary-600 hover:text-primary-700">
                    {company.phone}
                  </a>
                </div>
              )}
              {(company.city || company.state || company.country) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {[company.city, company.state, company.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {company.size && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{company.size} employees</span>
                </div>
              )}
            </div>
          </div>

          {/* Contacts */}
          {company.contacts && company.contacts.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Contacts ({company.contacts.length})</h2>
              <div className="space-y-3">
                {company.contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    to={`/contacts/${contact.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                      {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {contact.title && (
                        <p className="text-xs text-gray-500">{contact.title}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Deals */}
          {company.deals && company.deals.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Deals ({company.deals.length})</h2>
              <div className="space-y-3">
                {company.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    to={`/deals/${deal.id}`}
                    className="block rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                  >
                    <p className="font-medium text-gray-900">{deal.name}</p>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-gray-500">{deal.stage_name}</span>
                      <span className="font-medium text-gray-900">
                        ${deal.value.toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {company.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{company.notes}</p>
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
            <ActivityTimeline activities={company.activities || []} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        company={company}
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
