const API_BASE = '/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Leads API
export const leadsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<import('../types').PaginatedResponse<import('../types').Lead>>(`/leads${query}`);
  },
  getOne: (id: string) => fetchApi<import('../types').Lead & { activities: import('../types').Activity[] }>(`/leads/${id}`),
  create: (data: Partial<import('../types').Lead>) => fetchApi<import('../types').Lead>('/leads', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<import('../types').Lead>) => fetchApi<import('../types').Lead>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<{ message: string }>(`/leads/${id}`, { method: 'DELETE' }),
  convert: (id: string) => fetchApi<{ message: string; contact: import('../types').Contact }>(`/leads/${id}/convert`, { method: 'POST' }),
};

// Contacts API
export const contactsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<import('../types').PaginatedResponse<import('../types').Contact>>(`/contacts${query}`);
  },
  getOne: (id: string) => fetchApi<import('../types').Contact & { activities: import('../types').Activity[]; deals: import('../types').Deal[] }>(`/contacts/${id}`),
  create: (data: Partial<import('../types').Contact>) => fetchApi<import('../types').Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<import('../types').Contact>) => fetchApi<import('../types').Contact>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<{ message: string }>(`/contacts/${id}`, { method: 'DELETE' }),
};

// Companies API
export const companiesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<import('../types').PaginatedResponse<import('../types').Company>>(`/companies${query}`);
  },
  getOne: (id: string) => fetchApi<import('../types').Company & { contacts: import('../types').Contact[]; deals: import('../types').Deal[]; activities: import('../types').Activity[] }>(`/companies/${id}`),
  create: (data: Partial<import('../types').Company>) => fetchApi<import('../types').Company>('/companies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<import('../types').Company>) => fetchApi<import('../types').Company>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<{ message: string }>(`/companies/${id}`, { method: 'DELETE' }),
};

// Deals API
export const dealsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<import('../types').PaginatedResponse<import('../types').Deal>>(`/deals${query}`);
  },
  getPipeline: (params?: Record<string, string>) => {
    const query = new URLSearchParams({ view: 'pipeline', ...params });
    return fetchApi<import('../types').PipelineView>(`/deals?${query}`);
  },
  getOne: (id: string) => fetchApi<import('../types').Deal & { activities: import('../types').Activity[] }>(`/deals/${id}`),
  create: (data: Partial<import('../types').Deal>) => fetchApi<import('../types').Deal>('/deals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<import('../types').Deal>) => fetchApi<import('../types').Deal>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStage: (id: string, stageId: string) => fetchApi<import('../types').Deal>(`/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage_id: stageId }) }),
  delete: (id: string) => fetchApi<{ message: string }>(`/deals/${id}`, { method: 'DELETE' }),
};

// Activities API
export const activitiesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<import('../types').PaginatedResponse<import('../types').Activity>>(`/activities${query}`);
  },
  getOne: (id: string) => fetchApi<import('../types').Activity>(`/activities/${id}`),
  create: (data: Partial<import('../types').Activity>) => fetchApi<import('../types').Activity>('/activities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<import('../types').Activity>) => fetchApi<import('../types').Activity>(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  complete: (id: string, outcome?: string) => fetchApi<import('../types').Activity>(`/activities/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ outcome }) }),
  delete: (id: string) => fetchApi<{ message: string }>(`/activities/${id}`, { method: 'DELETE' }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => fetchApi<import('../types').DashboardStats>('/dashboard/stats'),
  getMetrics: (period?: number) => {
    const query = period ? `?period=${period}` : '';
    return fetchApi<{
      period: number;
      closedDeals: { won: number; lost: number; wonValue: number; lostValue: number };
      conversionRate: number;
      avgDealValue: number;
      avgDaysToClose: number;
    }>(`/dashboard/metrics${query}`);
  },
};

// Pipeline API
export const pipelineApi = {
  getStages: () => fetchApi<{ data: import('../types').PipelineStage[] }>('/pipeline/stages'),
  createStage: (data: Partial<import('../types').PipelineStage>) => fetchApi<import('../types').PipelineStage>('/pipeline/stages', { method: 'POST', body: JSON.stringify(data) }),
  updateStage: (id: string, data: Partial<import('../types').PipelineStage>) => fetchApi<import('../types').PipelineStage>(`/pipeline/stages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorderStages: (stageIds: string[]) => fetchApi<import('../types').PipelineStage[]>('/pipeline/stages/reorder', { method: 'POST', body: JSON.stringify({ stageIds }) }),
  deleteStage: (id: string) => fetchApi<{ message: string }>(`/pipeline/stages/${id}`, { method: 'DELETE' }),
};
