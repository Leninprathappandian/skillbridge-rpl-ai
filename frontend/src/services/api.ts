const API_BASE_URL = 'http://localhost:8000/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('skillbridge_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('skillbridge_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('skillbridge_token');
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `API Request failed with status ${response.status}`);
  }

  return response.json();
}

// Service API Helpers
export const authApi = {
  login: (username: string, password: string) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  getMe: () => apiRequest('/auth/me'),
};

export const workerApi = {
  register: (data: any) => apiRequest('/workers', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: (id: string) => apiRequest(`/workers/${id}`),
  listWorkers: () => apiRequest('/workers'),
  submitDeclaration: (workerId: string, data: any) => apiRequest(`/workers/${workerId}/declaration`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
};

export const qualApi = {
  list: (params?: { q?: string; sector?: string; level?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/qualifications${query ? `?${query}` : ''}`);
  },
  getOne: (qpId: string) => apiRequest(`/qualifications/${qpId}`),
  match: (data: any) => apiRequest('/qualifications/match', { method: 'POST', body: JSON.stringify(data) }),
  importQps: (qps: any[]) => apiRequest('/qualifications/import', { method: 'POST', body: JSON.stringify(qps) }),
};

export const assessmentApi = {
  create: (workerId: string, qpId: string, declarationId?: string) => apiRequest('/assessments', {
    method: 'POST',
    body: JSON.stringify({ worker_id: workerId, qp_id: qpId, declaration_id: declarationId })
  }),
  list: (status?: string) => apiRequest(`/assessments${status ? `?status=${status}` : ''}`),
  getOne: (id: string) => apiRequest(`/assessments/${id}`),
  updateResults: (id: string, results: any[], status = 'in_progress') => apiRequest(`/assessments/${id}/results`, {
    method: 'PUT',
    body: JSON.stringify({ results, status })
  }),
  getScoring: (id: string) => apiRequest(`/assessments/${id}/scoring`),
  recordDecision: (id: string, decision: string, reason: string) => apiRequest(`/assessments/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, decision_reason: reason })
  }),
  getReportPdfUrl: (id: string) => `${API_BASE_URL}/assessments/${id}/report`,
};

export const syncApi = {
  processQueue: (operations: any[]) => apiRequest('/sync', {
    method: 'POST',
    body: JSON.stringify({ operations })
  }),
  getStatus: () => apiRequest('/sync/status'),
};

export const analyticsApi = {
  getOverview: () => apiRequest('/analytics/overview'),
  getAuditLogs: (params?: { action?: string; resource_type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/analytics/audit${query ? `?${query}` : ''}`);
  },
  getEvaluation: () => apiRequest('/analytics/evaluation'),
};
