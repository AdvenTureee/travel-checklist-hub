
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
