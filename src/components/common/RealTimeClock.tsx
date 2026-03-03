
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const RealTimeClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <div className="text-2xl font-black font-mono text-primary tabular-nums">
        {format(time, 'HH:mm:ss')}
      </div>
      <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
        Real-Time Server Time
      </div>
    </div>
  );
};
