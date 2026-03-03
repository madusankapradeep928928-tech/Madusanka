
import React, { useState } from 'react';
import { RoundTracker } from '@/components/dashboard/RoundTracker';
import { SignalEngine } from '@/components/dashboard/SignalEngine';
import { SignalAccuracy } from '@/components/dashboard/SignalAccuracy';
import { RealTimeClock } from '@/components/common/RealTimeClock';
import { Round } from '@/types/index';
import { Activity, Signal, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [rounds, setRounds] = useState<Round[]>([]);

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      <div className="flex flex-row justify-between items-start gap-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3">
            <Signal className="h-10 w-10 text-primary" />
            SIGNAL COMMUNITY SERVICE v120
          </h1>
          <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              Live Pattern Analysis & Signal Pipeline
          </p>
        </div>
        <div className="bg-card/50 border border-border/50 p-4 rounded-2xl shadow-lg backdrop-blur-md">
          <RealTimeClock />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* Left Column: Round Tracker & Accuracy */}
        <div className="md:col-span-1 space-y-6">
          <RoundTracker onRoundsUpdate={setRounds} />
          <SignalAccuracy />
        </div>

        {/* Right Columns: Signal Engine */}
        <div className="md:col-span-2">
          <SignalEngine lastRounds={rounds} />
        </div>
      </div>
      
      {/* Quick Tips Footer */}
      <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-start gap-3">
        <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Pro Tip: Signal Confidence</p>
          <p className="text-xs text-muted-foreground">
            A <strong>HIGH</strong> confidence level indicates that multiple low odd rounds have cleared the path for a potential spike. 
            The Primary Signal window (6-10 min) is historically the most accurate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
