import {
  Area, Skill, WorkerProfile, Claim, EvidenceItem,
  Booking, Quotation, Review, MatchedWorkerResult, User, ContractorProject
} from '../types';

const API_BASE = '/api/v1';

export const api = {
  // Reference
  getAreas: async (): Promise<Area[]> => {
    const res = await fetch(`${API_BASE}/areas`);
    return res.json();
  },

  getSkills: async (): Promise<Skill[]> => {
    const res = await fetch(`${API_BASE}/skills`);
    return res.json();
  },

  // Auth
  requestOtp: async (phone: string, role = 'worker', name?: string) => {
    const res = await fetch(`${API_BASE}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role, name }),
    });
    return res.json();
  },

  verifyOtp: async (phone: string, otp: string, role = 'worker', name?: string) => {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, role, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'OTP Verification failed');
    }
    return res.json();
  },

  // Workers & Onboarding
  textDraft: async (text: string) => {
    const res = await fetch(`${API_BASE}/workers/text-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  voiceDraftSample: async () => {
    const res = await fetch(`${API_BASE}/workers/voice-draft`, {
      method: 'POST',
    });
    return res.json();
  },

  voiceTranscribe: async (audioBlob: Blob): Promise<{ success: boolean; transcript: string; note: string; draft: any }> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'speech_recording.wav');
    const res = await fetch(`${API_BASE}/workers/voice-transcribe`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  confirmProfile: async (profile: Partial<WorkerProfile> & { name: string; user_id: string }) => {
    const res = await fetch(`${API_BASE}/workers/profile/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return res.json();
  },

  getWorkerMe: async (workerId: string): Promise<{ profile: WorkerProfile; claims: Claim[]; evidence: EvidenceItem[] }> => {
    const res = await fetch(`${API_BASE}/workers/me?worker_id=${workerId}`);
    return res.json();
  },

  getPublicPassport: async (slug: string): Promise<{ worker: WorkerProfile; claims: Claim[]; evidence: EvidenceItem[]; reviews: Review[]; public_url?: string }> => {
    const res = await fetch(`${API_BASE}/public/workers/${slug}`);
    return res.json();
  },

  // Evidence & Trust
  uploadEvidence: async (formData: FormData): Promise<EvidenceItem> => {
    const res = await fetch(`${API_BASE}/evidence`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload evidence');
    }
    return res.json();
  },

  getTrustStatus: async (workerId: string) => {
    const res = await fetch(`${API_BASE}/workers/me/trust?worker_id=${workerId}`);
    return res.json();
  },

  // Search & Matching (Direct MongoDB query)
  searchMatching: async (category?: string, areaId?: string, query?: string): Promise<{ total: number; results: MatchedWorkerResult[] }> => {
    const res = await fetch(`${API_BASE}/matching/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, area_id: areaId, query }),
    });
    return res.json();
  },

  // Bookings
  createBooking: async (data: { customer_id: string; worker_id: string; contractor_id?: string; booking_type?: string; category: string; description: string; area_id?: string; requested_for?: string }): Promise<Booking> => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getBookings: async (userId: string, role = 'customer'): Promise<Booking[]> => {
    const res = await fetch(`${API_BASE}/bookings?user_id=${userId}&role=${role}`);
    return res.json();
  },

  getBookingDetail: async (id: string): Promise<Booking> => {
    const res = await fetch(`${API_BASE}/bookings/${id}`);
    return res.json();
  },

  updateBookingStatus: async (id: string, status: string): Promise<Booking> => {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Quotations
  createQuote: async (bookingId: string, createdBy: string, note: string, items: { label: string; qty: number; unit_paise: number }[]): Promise<Quotation> => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ created_by: createdBy, note, items }),
    });
    return res.json();
  },

  acceptQuote: async (quoteId: string, customerId: string): Promise<Quotation> => {
    const res = await fetch(`${API_BASE}/quotations/${quoteId}/accept?customer_id=${customerId}`, {
      method: 'POST',
    });
    return res.json();
  },

  // Reviews
  submitReview: async (bookingId: string, reviewer_id: string, rating: number, text: string): Promise<Review> => {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, reviewer_id, rating, text }),
    });
    return res.json();
  },

  // Facilitator
  assessClaim: async (claimId: string, facilitatorId: string, scope: string, note: string) => {
    const res = await fetch(`${API_BASE}/facilitator/claims/${claimId}/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilitator_id: facilitatorId, scope, note }),
    });
    return res.json();
  },

  getFacilitatorWorkers: async () => {
    const res = await fetch(`${API_BASE}/facilitator/workers`);
    return res.json();
  },

  // Contractor Projects & Squads
  contractorCreateProject: async (data: { contractor_id: string; title: string; category: string; workers_needed: number; area_id: string; budget_rs: number; description: string }): Promise<ContractorProject> => {
    const res = await fetch(`${API_BASE}/contractor/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  contractorListProjects: async (contractorId?: string): Promise<ContractorProject[]> => {
    const url = contractorId ? `${API_BASE}/contractor/projects?contractor_id=${contractorId}` : `${API_BASE}/contractor/projects`;
    const res = await fetch(url);
    return res.json();
  },

  contractorAssignWorker: async (projectId: string, workerId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/contractor/projects/${projectId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_id: workerId }),
    });
    return res.json();
  },

  // Demo reset
  demoReset: async () => {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    return res.json();
  }
};
