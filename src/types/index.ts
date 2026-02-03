// Shared types for the CRM

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'member';
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: '1-10' | '11-50' | '51-200' | '201-500' | '500+' | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  company_id: string | null;
  company_name?: string;
  title: string | null;
  department: string | null;
  linkedin_url: string | null;
  notes: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  title: string | null;
  status: LeadStatus;
  source: LeadSource | null;
  score: number;
  assigned_to: string | null;
  notes: string | null;
  converted_contact_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'cold_email' | 'linkedin' | 'advertisement' | 'event' | 'other';

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  color: string;
  probability: number;
  created_at: string;
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  currency: string;
  stage_id: string | null;
  stage_name?: string;
  stage_color?: string;
  probability: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  contact_id: string | null;
  contact_first_name?: string;
  contact_last_name?: string;
  company_id: string | null;
  company_name?: string;
  assigned_to: string | null;
  status: 'open' | 'won' | 'lost';
  loss_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string | null;
  description: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  outcome: string | null;
  lead_id: string | null;
  lead_name?: string;
  contact_id: string | null;
  contact_first_name?: string;
  contact_last_name?: string;
  deal_id: string | null;
  deal_name?: string;
  company_id: string | null;
  user_id: string | null;
  user_name?: string;
  created_at: string;
  updated_at: string;
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalLeads: number;
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  totalValue: number;
  wonDeals: number;
  wonValue: number;
  pendingActivities: number;
  overdueActivities: number;
  dealsByStage: { stage: string; color: string; count: number; value: number }[];
  leadsByStatus: { status: string; count: number }[];
  recentActivities: Activity[];
  upcomingActivities: Activity[];
}

export interface PipelineView {
  pipeline: (PipelineStage & { deals: Deal[]; totalValue: number })[];
}
