import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Mail, Phone, Building2, Trash2, Edit } from 'lucide-react';
import { contactsApi } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { Contact } from '../types';
import ContactModal from '../components/contacts/ContactModal';
import { useAppStore } from '../stores/appStore';

export default function Contacts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { isContactModalOpen, setContactModalOpen, editingContact, setEditingContact } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search }],
    queryFn: () => contactsApi.getAll({ search }),
  });

  const deleteMutation = useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete contact');
    },
  });

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setContactModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data?.total || 0} total contacts
          </p>
        </div>
        <button
          onClick={() => {
            setEditingContact(null);
            setContactModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white">
          <p className="text-gray-500">No contacts found</p>
          <button
            onClick={() => {
              setEditingContact(null);
              setContactModalOpen(true);
            }}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Add your first contact
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data?.map((contact) => (
            <div
              key={contact.id}
              className="group rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <Link to={`/contacts/${contact.id}`} className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-600">
                    {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                      {contact.first_name} {contact.last_name}
                    </h3>
                    {contact.title && (
                      <p className="text-sm text-gray-500">{contact.title}</p>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
                  >
                    <Mail className="h-4 w-4 text-gray-400" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
                  >
                    <Phone className="h-4 w-4 text-gray-400" />
                    {contact.phone}
                  </a>
                )}
                {contact.company_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {contact.company_name}
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400">
                  Added {format(new Date(contact.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setEditingContact(null);
        }}
        contact={editingContact}
      />
    </div>
  );
}
