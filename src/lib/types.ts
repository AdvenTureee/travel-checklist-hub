
export interface Point {
  id: string;
  name: string;
  description: string;
  address: string;
  type: 'tourist' | 'shopping' | 'restaurant' | 'accommodation' | 'other';
  imageUrl?: string;
  createdAt: string;
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
