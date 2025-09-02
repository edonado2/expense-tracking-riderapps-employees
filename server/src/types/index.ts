export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: number;
  user_id: number;
  app_name: 'uber' | 'lyft' | 'didi';
  pickup_location: string;
  destination: string;
  distance_km: number;
  duration_minutes: number;
  cost_usd: number;
  ride_date: string;
  notes?: string;
  created_at: string;
}

export interface CreateRideRequest {
  app_name: 'uber' | 'lyft' | 'didi';
  pickup_location: string;
  destination: string;
  distance_km: number;
  duration_minutes: number;
  cost_usd: number;
  ride_date: string;
  notes?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  department?: string;
}

export interface SpendingSummary {
  user_id: number;
  user_name: string;
  department?: string;
  total_rides: number;
  total_cost: number;
  rides_by_app: {
    uber: { count: number; cost: number };
    lyft: { count: number; cost: number };
    didi: { count: number; cost: number };
  };
  monthly_breakdown: Array<{
    month: string;
    rides: number;
    cost: number;
  }>;
}

export interface AuthResponse {
  token: string;
  user: User;
}
