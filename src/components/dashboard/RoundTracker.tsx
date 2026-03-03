
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, History, TrendingUp } from 'lucide-react';
import { api } from '@/db/api';
import { Round } from '@/types/index';
import { toast } from 'sonner';

interface RoundTrackerProps {
  onRoundsUpdate: (rounds: Round[]) => void;
}

export const RoundTracker: React.FC<RoundTrackerProps> = ({ onRoundsUpdate }) => {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRounds();
  }, []);

  const loadRounds = async () => {
    const { data, error } = await api.getRounds();
    if (error) {
      toast.error('Failed to load rounds');
    } else {
      setRounds(data);
      onRoundsUpdate(data);
    }
  };

  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    const value = parseFloat(inputValue);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid odd value');
      return;
    }

    setLoading(true);
    const { data, error } = await api.addRound(value);
    if (error) {
      toast.error('Failed to add round');
    } else if (data) {
      const newRounds = [data, ...rounds].slice(0, 10); // Keep last 10 locally
      setRounds(newRounds);
      onRoundsUpdate(newRounds);
      setInputValue('');
      toast.success('Round recorded successfully');
    }
    setLoading(false);
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear history?')) {
        const { error } = await api.deleteRounds();
        if (error) {
            toast.error('Failed to clear rounds');
        } else {
            setRounds([]);
            onRoundsUpdate([]);
            toast.success('History cleared');
        }
    }
  }

  const average = rounds.slice(0, 5).reduce((acc, curr) => acc + curr.odd_value, 0) / Math.min(rounds.length, 5) || 0;

  return (
    <Card className="h-full border-primary/10 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Live Round Tracker
          </CardTitle>
          <CardDescription className="text-[10px]">Track last 5 rounds for pattern average</CardDescription>
        </div>
        <History className="h-4 w-4 text-muted-foreground opacity-50" />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddRound} className="flex gap-2 mb-6">
          <Input
            type="number"
            step="0.01"
            placeholder="Enter odd value (e.g. 1.20)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 h-10 font-mono bg-muted/20 border-primary/10 focus:border-primary"
          />
          <Button type="submit" size="icon" disabled={loading} className="h-10 w-10 shadow-lg shadow-primary/10">
            {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Plus className="h-5 w-5" />}
          </Button>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last 5 Average</span>
            <Badge variant="secondary" className="font-mono text-lg font-black bg-background/50 border-primary/20">
              {average.toFixed(2)}x
            </Badge>
          </div>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {rounds.map((round) => (
              <div 
                key={round.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50 group hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Round Time</span>
                    <span className="text-xs font-mono font-bold">
                        {new Date(round.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
                <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Multiplier</span>
                    <span className={`font-mono text-base font-black ${
                        round.odd_value >= 10 ? 'text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]' : 
                        round.odd_value >= 2 ? 'text-green-500' : 'text-blue-400'
                    }`}>
                    {round.odd_value.toFixed(2)}x
                    </span>
                </div>
              </div>
            ))}
            {rounds.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border/50 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium italic">No rounds recorded yet</p>
              </div>
            )}
          </div>
          
          {rounds.length > 0 && (
             <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-colors" onClick={handleClear}>
                 <Trash2 className="h-3 w-3 mr-2" />
                 Flush History
             </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
