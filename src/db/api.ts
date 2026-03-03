
import { supabase } from './supabase';
import { Profile, Round, HighOdd, UserRole, SignalLog } from '@/types/index';

export const api = {
  // Signal Logs
  async getSignalLogs(limit = 10) {
    const { data, error } = await supabase
      .from('signal_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: (data || []) as SignalLog[], error };
  },

  async addSignalLog(signalType: string, predictedOdds: number, expiresAt: string) {
    const { data, error } = await supabase
      .from('signal_logs')
      .insert({ signal_type: signalType, predicted_odds: predictedOdds, expires_at: expiresAt })
      .select()
      .maybeSingle();
    return { data: data as SignalLog | null, error };
  },

  async updateSignalResult(signalId: string, result: 'win' | 'lose') {
    const { data, error } = await supabase
      .from('signal_logs')
      .update({ result })
      .eq('id', signalId)
      .select()
      .maybeSingle();
    return { data: data as SignalLog | null, error };
  },

  async updateSignalTargetOdds(signalId: string, predictedOdds: number) {
    const { data, error } = await supabase
      .from('signal_logs')
      .update({ predicted_odds: predictedOdds })
      .eq('id', signalId)
      .select()
      .maybeSingle();
    return { data: data as SignalLog | null, error };
  },

  async deleteSignalLogs() {
    const { error } = await supabase.from('signal_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return { error };
  },

  // Rounds
  async getRounds(limit = 20) {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: (data || []) as Round[], error };
  },

  async addRound(oddValue: number) {
    const { data, error } = await supabase
      .from('rounds')
      .insert({ odd_value: oddValue })
      .select()
      .maybeSingle();
    return { data: data as Round | null, error };
  },

  async deleteRounds() {
    const { error } = await supabase.from('rounds').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
    return { error };
  },

  // High Odds
  async getHighOdds(limit = 1) {
    const { data, error } = await supabase
      .from('high_odds')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit);
    return { data: (data || []) as HighOdd[], error };
  },

  async addHighOdd(oddValue: number, occurredAt: string) {
    const { data, error } = await supabase
      .from('high_odds')
      .insert({ odd_value: oddValue, occurred_at: occurredAt })
      .select()
      .maybeSingle();
    return { data: data as HighOdd | null, error };
  },

  async deleteHighOdds() {
    const { error } = await supabase.from('high_odds').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
    return { error };
  }
};
