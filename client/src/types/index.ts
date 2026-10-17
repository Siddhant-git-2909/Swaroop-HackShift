export interface User {
  id: string;
  phone: string;
  role: 'worker' | 'customer' | 'contractor' | 'facilitator' | 'admin';
  name: string;
  language?: string;
  status?: string;
}

export interface Area {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  city: string;
  lat: number;
  lng: number;
}

export interface Skill {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  aliases: string[];
}

export interface WorkerProfile {
  user_id: string;
  slug: string;
  name: string;
  headline: string;
  core_skills: string[];
  secondary_skills: string[];
  experience_years?: number;
  area_id?: string;
  area_text?: string;
  trust_level: 1 | 2 | 3;
  source?: string;
  identity_check_status?: string;
  human_verified_by?: string | null;
  human_verified_at?: string | null;
  availability?: {
    today: boolean;
    days: string[];
    from: string;
    to: string;
  };
  public_fields?: {
    experience: boolean;
    area: boolean;
    reviews: boolean;
    skills: boolean;
  };
}

export interface Claim {
  id: string;
  worker_id: string;
  type: 'skill' | 'identity' | 'work_history';
  subject: string;
  status: 'self_declared' | 'evidence_added' | 'customer_confirmed' | 'independently_assessed' | 'simulated_check';
  source_label: string;
  scope: string;
  assessed_by?: string | null;
  assessed_at?: string | null;
  note?: string | null;
}

export interface EvidenceItem {
  id: string;
  worker_id: string;
  claim_id?: string;
  kind: 'photo' | 'note';
  image_url: string;
  caption: string;
  source_label: string;
  is_public: boolean;
  ai_score: number;
  ai_note: string;
  status: 'pending_review' | 'ai_consistent' | 'human_accepted' | 'rejected';
  created_at: string;
}

export interface QuoteItem {
  label: string;
  qty: number;
  unit_paise: number;
}

export interface Quotation {
  id: string;
  booking_id: string;
  version: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'superseded';
  total_paise: number;
  note: string;
  created_by: string;
  created_at: string;
  items: QuoteItem[];
}

export interface Booking {
  id: string;
  customer_id: string;
  worker_id: string;
  contractor_id?: string | null;
  booking_type?: 'direct' | 'contractor_dispatch';
  worker_name?: string;
  worker_slug?: string;
  customer_name?: string;
  category: string;
  description: string;
  area_id?: string;
  area_text?: string;
  requested_for?: string;
  status: 'requested' | 'worker_accepted' | 'quoted' | 'accepted' | 'in_progress' | 'work_done' | 'completed' | 'cancelled';
  amount_paise?: number | null;
  current_quotation_id?: string | null;
  quotation?: Quotation | null;
  started_at?: string | null;
  work_done_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewer_name: string;
  worker_id: string;
  rating: number;
  text: string;
  created_at: string;
}

export interface MatchedWorkerResult {
  worker: WorkerProfile;
  user: {
    id: string;
    name: string;
    status: string;
  };
  score: number;
  breakdown: {
    skill: number;
    location: number;
    availability: number;
    trust: number;
  };
  distance_km?: number | null;
  reason_en: string;
  reason_hi: string;
  rating: number;
  reviews_count: number;
  claims: Claim[];
  evidence_count: number;
}

export interface ContractorProject {
  id: string;
  contractor_id: string;
  title: string;
  category: string;
  trade_needed: string;
  workers_needed: number;
  area_id: string;
  area_text: string;
  budget_rs: number;
  status: 'recruiting' | 'in_progress' | 'completed';
  assigned_worker_ids: string[];
  description: string;
  created_at: string;
}
