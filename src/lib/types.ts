
import type { OpeningHours } from '@/components/points/AddPointDialog';

export interface Point {
  id: string;
  name: string;
  description: string;
  address: string;
  type: 'tourist' | 'shopping' | 'restaurant' | 'accommodation' | 'other';
  image_url?: string;
  imageUrl?: string;
  created_at: string;
  createdAt?: string;
  user_id: string;
  googleMapsUrl?: string;
  google_maps_url?: string;
  openingHours?: OpeningHours;
  opening_hours?: OpeningHours;
  plannedVisitDate?: string | null;
  planned_visit_date?: string | null;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  checklist_id: string;
  created_at: string;
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  point_id?: string | null;
  pointId?: string | null;
  created_at: string;
  createdAt?: string;
  is_complete: boolean;
  isComplete?: boolean;
  user_id: string;
  items?: ChecklistItem[];
}

export interface User {
  token: string;
  isAuthenticated: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  point_id?: string | null;
  checklist_id?: string | null;
  currency: string;
  purchased: boolean;
  created_at: string;
  user_id: string;
}

export interface UserBudget {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}
