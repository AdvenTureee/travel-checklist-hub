
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
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  items: ChecklistItem[];
  pointId?: string;
  createdAt: string;
  isComplete: boolean;
}

export interface User {
  token: string;
  isAuthenticated: boolean;
}
