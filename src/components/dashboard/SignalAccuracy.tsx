
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { api } from '@/db/api';
import { SignalLog } from '@/types/index';
import { format } from 'date-fns';
import { Target, History, TrendingUp, TrendingDown, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const SignalAccuracy: React.FC = () => {
  const [logs, setLogs] = useState<SignalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await api.getSignalLogs(50);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const clearLogs = async () => {
    if (confirm('Are you sure you want to clear all signal logs?')) {
      await api.deleteSignalLogs();
      toast.success('Signal logs cleared');
      fetchLogs();
    }
  };

  const startEditing = (log: SignalLog) => {
    setEditingId(log.id);
    setEditingValue(log.predicted_odds.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const saveEditing = async (id: string) => {
    const val = parseFloat(editingValue);
    if (isNaN(val) || val <= 0) {
      toast.error('Invalid odds value');
      return;
    }

    const { error } = await api.updateSignalTargetOdds(id, val);
    if (error) {
      toast.error('Failed to update odds');
    } else {
      toast.success('Target odds updated');
      setEditingId(null);
      fetchLogs();
    }
  };

  const calculateStats = () => {
    const resolvedLogs = logs.filter(l => l.result !== null);
    const types = Array.from(new Set(resolvedLogs.map(l => l.signal_type)));
    
    return types.map(type => {
      const typeLogs = resolvedLogs.filter(l => l.signal_type === type);
      const wins = typeLogs.filter(l => l.result === 'win').length;
      const total = typeLogs.length;
      const accuracy = total > 0 ? (wins / total) * 100 : 0;
      
      return { type, wins, total, accuracy };
    });
  };

  const stats = calculateStats();
  const totalResolved = logs.filter(l => l.result !== null);
  const totalWins = totalResolved.filter(l => l.result === 'win').length;
  const overallAccuracy = totalResolved.length > 0 ? (totalWins / totalResolved.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2 text-primary">
              <Target className="h-4 w-4" />
              Signal Accuracy Dashboard
            </CardTitle>
            <CardDescription className="font-bold text-[10px] uppercase">Real-time performance tracking</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={clearLogs} className="text-muted-foreground hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Overall Accuracy</span>
                <span className="text-2xl font-black italic text-primary">{overallAccuracy.toFixed(1)}%</span>
              </div>
              <Progress value={overallAccuracy} className="h-2" />
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Based on {totalResolved.length} resolved signals</p>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {stats.map(s => (
                <div key={s.type} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border/50">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">{s.type}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black">{s.accuracy.toFixed(0)}%</span>
                    <Badge variant="outline" className="text-[9px] font-black">{s.wins}/{s.total}</Badge>
                  </div>
                </div>
              ))}
              {stats.length === 0 && (
                <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground italic font-bold uppercase">
                  No data yet
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Signal Logs</h3>
            </div>
            
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[9px] font-black uppercase h-8">Time</TableHead>
                    <TableHead className="text-[9px] font-black uppercase h-8">Type</TableHead>
                    <TableHead className="text-[9px] font-black uppercase h-8">Target</TableHead>
                    <TableHead className="text-[9px] font-black uppercase h-8 text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0, 10).map((log) => (
                    <TableRow key={log.id} className="hover:bg-primary/5 transition-colors border-border/30">
                      <TableCell className="py-2 text-[10px] font-mono font-bold">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </TableCell>
                      <TableCell className="py-2 text-[10px] font-black uppercase">
                        {log.signal_type}
                      </TableCell>
                      <TableCell className="py-2 text-[10px] font-black">
                        {editingId === log.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="h-7 w-16 text-[10px] p-1 font-mono"
                            />
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500" onClick={() => saveEditing(log.id)}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={cancelEditing}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span>{log.predicted_odds}x</span>
                            {log.result === null && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEditing(log)}>
                                <Edit2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {log.result === 'win' ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-[8px] font-black uppercase h-5">
                            <TrendingUp className="h-3 w-3 mr-1" /> Win
                          </Badge>
                        ) : log.result === 'lose' ? (
                          <Badge variant="destructive" className="text-[8px] font-black uppercase h-5">
                            <TrendingDown className="h-3 w-3 mr-1" /> Loss
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[8px] font-black uppercase h-5 animate-pulse">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-[10px] text-muted-foreground italic font-bold uppercase">
                        Waiting for signals...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
