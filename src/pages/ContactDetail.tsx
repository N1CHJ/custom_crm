import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Building2, Edit, Trash2, Plus, Linkedin, Globe } from 'lucide-react';
import { contactsApi } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAppStore } from '../stores/appStore';
import ActivityTimeline from '../components/common/ActivityTimeline';
import ContactModal from '../components/contacts/ContactModal';
import ActivityModal from '../components/activities/ActivityModal';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { 
    isContactModalOpen, setContactModalOpen, 
    isActivityModalOpen, setActivityModalOpen,
    setEditingContact,
    setActivityContext
  } = useAppStore();

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactsApi.getOne(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: () => {
      toast.success('Contact deleted successfully');
      navigate('/contacts');
    },
    onError: () => {
      toast.error('Failed to delete contact');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-gray-500">Contact not found</p>
        <Link to="/contacts" className="text-sm text-primary-600 hover:text-primary-700">
          Back to contacts
        </Link>
      </div>
    );
  }

  const handleEdit = () => {
    setEditingContact(contact);
    setContactModalOpen(true);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate(contact.id);
    }
  };

  const handleAddActivity = () => {
    setActivityContext({ contactId: contact.id });
    setActivityModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/contacts"
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-600">
              {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {contact.first_name} {contact.last_name}
              </h1>
              {contact.title && (
                <p className="text-sm text-gray-500">{contact.title}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        {/* Contact Info */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact Information</h2>
            <div className="space-y-4">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a href={`mailto:${contact.email}`} className="text-sm text-primary-600 hover:text-primary-700">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a href={`tel:${contact.phone}`} className="text-sm text-primary-600 hover:text-primary-700">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.mobile && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a href={`tel:${contact.mobile}`} className="text-sm text-primary-600 hover:text-primary-700">
                    {contact.mobile} (Mobile)
                  </a>
                </div>
              )}
              {contact.company_name && (
                <Link to={`/companies/${contact.company_id}`} className="flex items-center gap-3 hover:text-primary-600">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{contact.company_name}</span>
                </Link>
              )}
              {contact.linkedin_url && (
                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary-600 hover:text-primary-700">
                  <Linkedin className="h-5 w-5" />
                  <span className="text-sm">LinkedIn Profile</span>
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
            <dl className="space-y-3">
              {contact.department && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Department</dt>
                  <dd className="text-sm font-medium text-gray-900">{contact.department}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {format(new Date(contact.created_at), 'MMM d, yyyy')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Last Updated</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {format(new Date(contact.updated_at), 'MMM d, yyyy')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Deals */}
          {contact.deals && contact.deals.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Deals</h2>
              <div className="space-y-3">
                {contact.deals.map((deal) => (
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

          {contact.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
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
            <ActivityTimeline activities={contact.activities || []} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setEditingContact(null);
        }}
        contact={contact}
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
