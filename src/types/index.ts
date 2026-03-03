export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export type UserRole = 'admin' | 'member';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  role: UserRole;
  is_enabled: boolean;
  expires_at: string;
  created_at: string;
}

export interface Round {
  id: string;
  user_id: string;
  odd_value: number;
  created_at: string;
}

export interface HighOdd {
  id: string;
  user_id: string;
  odd_value: number;
  occurred_at: string;
  created_at: string;
}

export interface PredictionWindow {
  id: number;
  name: string;
  start_min: number;
  end_min: number;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED';
}

export interface SignalLog {
  id: string;
  created_at: string;
  expires_at: string;
  signal_type: string;
  predicted_odds: number;
  result: 'win' | 'lose' | null;
  user_id?: string | null;
}


