import { create } from 'zustand';
import type { User, Lead, Contact, Deal, Activity } from '../types';

interface AppState {
  // User
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Selected items
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;

  // Modals
  isLeadModalOpen: boolean;
  setLeadModalOpen: (open: boolean) => void;
  isContactModalOpen: boolean;
  setContactModalOpen: (open: boolean) => void;
  isDealModalOpen: boolean;
  setDealModalOpen: (open: boolean) => void;
  isActivityModalOpen: boolean;
  setActivityModalOpen: (open: boolean) => void;

  // Edit items
  editingLead: Lead | null;
  setEditingLead: (lead: Lead | null) => void;
  editingContact: Contact | null;
  setEditingContact: (contact: Contact | null) => void;
  editingDeal: Deal | null;
  setEditingDeal: (deal: Deal | null) => void;
  editingActivity: Activity | null;
  setEditingActivity: (activity: Activity | null) => void;

  // Context for new activity
  activityContext: {
    leadId?: string;
    contactId?: string;
    dealId?: string;
    companyId?: string;
  } | null;
  setActivityContext: (context: { leadId?: string; contactId?: string; dealId?: string; companyId?: string } | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User
  currentUser: {
    id: 'user_1',
    email: 'zane@example.com',
    name: 'Zane',
    avatar_url: null,
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  setCurrentUser: (user) => set({ currentUser: user }),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Selected items
  selectedLeadId: null,
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
  selectedContactId: null,
  setSelectedContactId: (id) => set({ selectedContactId: id }),
  selectedDealId: null,
  setSelectedDealId: (id) => set({ selectedDealId: id }),

  // Modals
  isLeadModalOpen: false,
  setLeadModalOpen: (open) => set({ isLeadModalOpen: open }),
  isContactModalOpen: false,
  setContactModalOpen: (open) => set({ isContactModalOpen: open }),
  isDealModalOpen: false,
  setDealModalOpen: (open) => set({ isDealModalOpen: open }),
  isActivityModalOpen: false,
  setActivityModalOpen: (open) => set({ isActivityModalOpen: open }),

  // Edit items
  editingLead: null,
  setEditingLead: (lead) => set({ editingLead: lead }),
  editingContact: null,
  setEditingContact: (contact) => set({ editingContact: contact }),
  editingDeal: null,
  setEditingDeal: (deal) => set({ editingDeal: deal }),
  editingActivity: null,
  setEditingActivity: (activity) => set({ editingActivity: activity }),

  // Context
  activityContext: null,
  setActivityContext: (context) => set({ activityContext: context }),
}));
