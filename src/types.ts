export type Dog = {
  id: string;
  userId?: string;
  name: string;
  birth: string;
  gender: 'male' | 'female';
  pedigree: string;
  chip: string;
  workbook?: string;
  breed?: string;
};

export type UserRole = 'user' | 'organizer' | 'admin';

export type UserProfile = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phone?: string;
  city?: string;
  club?: string;
  team?: string;
};

export type Competition = {
  id: string;
  name: string;
  date?: string; // Legacy
  startDate?: string;
  endDate?: string;
  location: string;
  level: string;
  description: string;
  maxParticipants: number;
  // price: number; // Removed per requirements, kept as optional/legacy if needed or just removed
  organizerId: string;
  organizerName?: string;
  status: 'open' | 'closed' | 'completed';
  participants?: { 
    userId: string; 
    dogId: string; 
    status: 'registered' | 'confirmed' | 'rejected'; 
    date?: string;
    results?: {
      place?: number;
      score?: number;
      qualification?: string;
      notes?: string;
    }
  }[];
  judges?: string[];
  categories?: string[];
};
