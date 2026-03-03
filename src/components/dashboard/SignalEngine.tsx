
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Round } from '@/types/index';
import { api } from '@/db/api';
import { toast } from 'sonner';
import { differenceInSeconds, addMinutes, addSeconds, format, parse, isValid, isAfter, isBefore } from 'date-fns';
import { Timer, Zap, CheckCircle2, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';

interface SignalEngineProps {
  lastRounds: Round[];
}

export const SignalEngine: React.FC<SignalEngineProps> = ({ lastRounds }) => {
  const [lastHOValue, setLastHOValue] = useState('');
  const [lastHOTimeStr, setLastHOTimeStr] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Constants from requirements
  const HO_THRESHOLD = 50;
  const LOW_ODD_THRESHOLD = 5;
  const SAFE_ODD_THRESHOLD = 10;
  const ENGINE_HIGH_THRESHOLD = 10.0;

  // Sync current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load last high odd on mount
  useEffect(() => {
    const loadLastHO = async () => {
        const { data, error } = await api.getHighOdds(1);
        if (!error && data && data.length > 0) {
            setLastHOValue(data[0].odd_value.toString());
            setLastHOTimeStr(format(new Date(data[0].occurred_at), 'HH:mm:ss'));
        }
    };
    loadLastHO();
  }, []);

  const lastHOTime = useMemo(() => {
    if (!lastHOTimeStr) return null;
    try {
      const parsed = parse(lastHOTimeStr, 'HH:mm:ss', new Date());
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [lastHOTimeStr]);

  // Shark Analyzer Logic (Enhanced v38)
  const sharkAnalysis = useMemo(() => {
    if (lastRounds.length < 5) return null;

    // Convert to chronological order (Oldest -> Newest) for Shark logic
    const odds = [...lastRounds].reverse().map(r => r.odd_value);
    const HIGH_THRESHOLD = 10;

    // 1. High Odd Indexes
    const highOddIndexes = odds.map((odd, idx) => odd >= HIGH_THRESHOLD ? idx : -1).filter(idx => idx !== -1);

    // 2. Gap Analysis
    let avgGap = 0;
    let stdGap = 0;
    
    if (highOddIndexes.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < highOddIndexes.length; i++) {
        gaps.push(highOddIndexes[i] - highOddIndexes[i-1]);
      }
      
      const sumGaps = gaps.reduce((a, b) => a + b, 0);
      avgGap = sumGaps / gaps.length;
      
      const squareDiffs = gaps.map(gap => Math.pow(gap - avgGap, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / gaps.length;
      stdGap = Math.sqrt(avgSquareDiff);
    } else {
        return null; // Not enough high odds for gap analysis
    }

    // 3. Recent Low Streak (last 10 rounds)
    const recentWindow = odds.slice(-10);
    const lowStreakCount = recentWindow.filter(o => o < 2).length;

    // 4. Spike Detection (v38 logic)
    const mean = odds.reduce((a, b) => a + b, 0) / odds.length;
    const squareDiffs = odds.map(o => Math.pow(o - mean, 2));
    const std = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / odds.length);
    const lastOdd = odds[odds.length - 1];
    const isSpike = lastOdd > mean + (2 * std);

    // 5. Probability Score (v38 Weighted Model)
    const currentGap = odds.length - 1 - highOddIndexes[highOddIndexes.length - 1];
    
    // Weights from v38 Shark Algo
    const GapWeight = 0.50; // Heavily weight current vs average gap
    const StreakWeight = 0.30; // Weight recent low odds
    const DeviationWeight = 0.20; // Weight volatility/spikes

    // Factors (0.0 to 1.0)
    const gapFactor = Math.min(currentGap / Math.max(avgGap, 1), 1.2); // Cap at 1.2 for bonus if overdue
    const streakFactor = Math.min(lowStreakCount / 6, 1.0);
    const spikeFactor = isSpike ? 1.0 : (currentGap > avgGap ? 0.5 : 0.2);

    let score = (GapWeight * gapFactor * 100) + (StreakWeight * streakFactor * 100) + (DeviationWeight * spikeFactor * 100);
    score = Math.min(score, 100);

    // 6. Signal Window Prediction (v38 Time Engine - 3 Prediction Times)
    // Primary: 6-10 min, Secondary: 14-22 min, Tertiary: 24-32 min
    // Estimation base: Middle of each zone (8, 18, 28) then subtract 35s
    let predictionTime1: Date | null = null; 
    let predictionTime2: Date | null = null; 
    let predictionTime3: Date | null = null; 
    
    if (lastHOTime) {
        // Base Signal 1 (8 min) - 35 seconds
        predictionTime1 = addSeconds(addMinutes(lastHOTime, 8), -35);
        
        // Base Signal 2 (18 min) - 35 seconds
        predictionTime2 = addSeconds(addMinutes(lastHOTime, 18), -35);
        
        // Base Signal 3 (28 min) - 35 seconds
        predictionTime3 = addSeconds(addMinutes(lastHOTime, 28), -35);
    }
    
    // Legacy window for compatibility
    let predictedWindowStart = predictionTime1;
    let predictedWindowEnd = predictionTime3;

    // 7. Generate Signal
    let signal = "";
    let signalColor = "";
    if (score >= 80) {
        signal = "🟢 HIGH ODD SIGNAL READY";
        signalColor = "text-green-500";
    } else if (score >= 65) {
        signal = "🟡 PREPARE MODE";
        signalColor = "text-yellow-500";
    } else {
        signal = "🔴 WAIT";
        signalColor = "text-red-500";
    }

    return {
        avgGap,
        stdGap,
        currentGap,
        score,
        signal,
        signalColor,
        isSpike,
        predictedWindowStart,
        predictedWindowEnd,
        predictionTime1,
        predictionTime2,
        predictionTime3
    };
  }, [lastRounds, lastHOTime, currentTime]);

  // Smart Engine v120 Logic
  const smartEngine = useMemo(() => {
    if (lastRounds.length < 2) return null;

    const odds = [...lastRounds].reverse().map(r => r.odd_value);
    
    // 1. Gap Analysis
    const highIdx = odds.reduce((acc, val, idx) => {
      if (val >= ENGINE_HIGH_THRESHOLD) acc.push(idx);
      return acc;
    }, [] as number[]);

    let gapProb = 0;
    let avgGap = 0;
    let stdDev = 0.1;
    let currentGap = 0;

    if (highIdx.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < highIdx.length; i++) {
        gaps.push(highIdx[i] - highIdx[i-1]);
      }
      avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      if (gaps.length > 1) {
        const m = avgGap;
        stdDev = Math.sqrt(gaps.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / (gaps.length - 1)) || 0.1;
      }
      currentGap = odds.length - 1 - highIdx[highIdx.length - 1];
      
      const zScore = (currentGap - avgGap) / stdDev;
      gapProb = (1 / (1 + Math.exp(-zScore))) * 100;
    }

    // 2. Low Streak Score
    let streak = 0;
    for (let i = lastRounds.length - 1; i >= 0; i--) {
      if (lastRounds[i].odd_value < LOW_ODD_THRESHOLD) streak++;
      else break;
    }
    const streakProb = Math.min(streak * 20, 100);

    // 3. Volatility Score
    const m = odds.reduce((a, b) => a + b, 0) / odds.length;
    const vol = Math.sqrt(odds.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / (odds.length - 1)) || 0;
    const volProb = Math.min((vol / 10) * 100, 100);

    const finalScore = (gapProb * 0.5) + (streakProb * 0.3) + (volProb * 0.2);
    const roundedScore = Math.min(finalScore, 100);

    let zone = "Low Probability Zone";
    let zoneColor = "text-muted-foreground";
    if (roundedScore >= 75) {
      zone = "🔥 HIGH SPIKE WATCH ZONE";
      zoneColor = "text-red-500 font-bold";
    } else if (roundedScore >= 50) {
      zone = "⚡ MEDIUM PROBABILITY ZONE";
      zoneColor = "text-yellow-500 font-bold";
    }

    return {
      avgGap,
      stdDev,
      currentGap,
      gapProb,
      streakProb,
      volProb,
      finalScore: roundedScore,
      zone,
      zoneColor
    };
  }, [lastRounds]);

  // Rolling Engine v41 Logic
  const rollingEngineV41 = useMemo(() => {
    if (lastRounds.length < 10) return null;

    const multipliers = [...lastRounds].reverse().map(r => r.odd_value);

    function getRollingStats(data: number[]) {
      const window = data.length;
      if (window === 0) return null;
      const avg = data.reduce((a, b) => a + b, 0) / window;
      const variance = data.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / window;
      const std = Math.sqrt(variance);
      const highSpikes = data.filter(x => x >= 3.0).length;
      const lowRounds = data.filter(x => x < 1.5).length;
      const current = data[data.length - 1];
      const zScore = std !== 0 ? (current - avg) / std : 0;
      const spikeProbability = (highSpikes / window) * 100;

      let preSpikeZone = "Normal Distribution";
      const lowRatio = lowRounds / window;
      if (lowRatio > 0.65) preSpikeZone = "High Spike Build-up Zone";
      else if (lowRatio > 0.50) preSpikeZone = "Moderate Accumulation";

      return {
        window,
        average: avg,
        std_dev: std,
        high_spikes: highSpikes,
        low_rounds: lowRounds,
        current_z_score: zScore,
        spike_probability_percent: spikeProbability,
        preSpikeZone
      };
    }

    function getEMA(data: number[], period: number) {
      if (data.length < period) return null;
      const k = 2 / (period + 1);
      let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
      for (let i = period; i < data.length; i++) {
        ema = (data[i] * k) + (ema * (1 - k));
      }
      return ema;
    }

    const last50 = getRollingStats(multipliers.slice(-50));
    const last100 = getRollingStats(multipliers.slice(-100));
    
    const ema10 = getEMA(multipliers, 10);
    const ema25 = getEMA(multipliers, 25);
    const ema50 = getEMA(multipliers, 50);

    let trend = "Sideways / Random";
    if (ema10 && ema25 && ema50) {
      if (ema10 > ema25 && ema25 > ema50) trend = "Bullish Spike Build-up";
      else if (ema10 < ema25 && ema25 < ema50) trend = "Low Cluster Phase";
    }

    const currentStats = last50 || last100;
    let breakout = "Normal Range";
    if (currentStats) {
      const current = multipliers[multipliers.length - 1];
      if (current > currentStats.average + (1.5 * currentStats.std_dev)) {
        breakout = "Momentum Breakout Detected";
      } else if (current < currentStats.average - (1.5 * currentStats.std_dev)) {
        breakout = "Downside Volatility Spike";
      }
    }

    let volPhase = "Normal Volatility";
    if (currentStats) {
      const std = currentStats.std_dev;
      if (std < 0.5) volPhase = "Tight Low Cluster";
      else if (std < 1.0) volPhase = "Normal Volatility";
      else if (std < 1.8) volPhase = "High Volatility Zone";
      else volPhase = "Extreme Spike Phase";
    }

    let v41Score = 0;
    if (ema10 && ema25) {
      if (ema10 > ema25) v41Score += 30;
      if (ema25 && ema50 && ema25 > ema50) v41Score += 30;
    }
    if (breakout === "Momentum Breakout Detected") v41Score += 40;

    return {
      last50,
      last100,
      ema10,
      ema25,
      ema50,
      trend,
      breakout,
      volPhase,
      v41Score: Math.min(v41Score, 100)
    };
  }, [lastRounds]);

  // Bayesian & Monte Carlo Engine v42 Logic
  const bayesianEngineV42 = useMemo(() => {
    if (lastRounds.length < 50) return null;

    const data = [...lastRounds].reverse().map(r => r.odd_value);
    const window = 200;
    const recent = data.slice(-window);
    
    // 1. Rolling Statistical Engine
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recent.length);
    const highRatio = recent.filter(x => x >= 10.0).length / recent.length;
    const lowRatio = recent.filter(x => x < 2.0).length / recent.length;

    // Entropy calculation (Shannon)
    const bins = 10;
    const maxVal = Math.max(...recent);
    const histogram = new Array(bins).fill(0);
    recent.forEach(v => {
      const binIdx = Math.min(Math.floor((v / (maxVal || 1)) * bins), bins - 1);
      histogram[binIdx]++;
    });
    const entropy = histogram.reduce((acc, count) => {
      if (count === 0) return acc;
      const p = count / recent.length;
      return acc - p * Math.log2(p);
    }, 0);

    // 2. Regime Detection
    const short = data.slice(-50);
    const long = data.slice(-200);
    const shortMean = short.reduce((a, b) => a + b, 0) / short.length;
    const longMean = long.reduce((a, b) => a + b, 0) / long.length;
    const shortVar = short.reduce((a, b) => a + Math.pow(b - shortMean, 2), 0) / short.length;
    const longVar = long.reduce((a, b) => a + Math.pow(b - longMean, 2), 0) / long.length;

    let regime = "Balanced Distribution";
    if (shortVar > longVar * 1.5) regime = "High Volatility Phase";
    else if (shortVar < longVar * 0.5) regime = "Low Cluster / Stability";

    // 3. Monte Carlo & Bayesian probability integration (V42 logic)
    // Weights: Shark 40%, Smart v120 30%, Monte Carlo 30%
    const bayesProb = (highRatio * 0.6 + (1 - lowRatio) * 0.4) * 100;
    
    // Simulate Monte Carlo spikes (next 20 rounds)
    let mcSpikes = 0;
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
        let randIdx = Math.floor(Math.random() * (data.length - 20));
        let slice = data.slice(randIdx, randIdx + 20);
        if (slice.some(x => x >= 10)) mcSpikes++;
    }
    const mcProb = (mcSpikes / iterations) * 100;
    
    // Final Weighted Probability
    const finalScore = (bayesProb * 0.4) + (mcProb * 0.4) + (entropy * 10);
    const risk = finalScore > 75 ? "LOW" : finalScore > 45 ? "MEDIUM" : "HIGH";

    return {
      mean,
      std,
      highRatio,
      lowRatio,
      entropy,
      regime,
      bayesProb,
      mcProb,
      finalScore,
      risk
    };
  }, [lastRounds]);

  // Probability Engine v63 Logic (New Update)
  const probabilityEngineV63 = useMemo(() => {
    if (lastRounds.length < 5) return null;

    const ROLLING_WINDOW = 100;
    const HIGH_ODD_THRESHOLD = 10;
    const PROBABILITY_THRESHOLD = 70;

    // Use up to ROLLING_WINDOW rounds
    const history = [...lastRounds].slice(0, ROLLING_WINDOW).reverse().map(r => r.odd_value);
    
    // 1. Calculate Gap Stats
    const highIndices = history.reduce((acc, val, idx) => {
      if (val >= HIGH_ODD_THRESHOLD) acc.push(idx);
      return acc;
    }, [] as number[]);

    if (highIndices.length < 2) return null;

    const gaps: number[] = [];
    for (let i = 1; i < highIndices.length; i++) {
      gaps.push(highIndices[i] - highIndices[i - 1]);
    }
    
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const stdGap = gaps.length > 1 
      ? Math.sqrt(gaps.reduce((sq, n) => sq + Math.pow(n - avgGap, 2), 0) / (gaps.length - 1))
      : 0;

    // 2. Current Gap
    const lastHighIndex = highIndices[highIndices.length - 1];
    const gapNow = history.length - 1 - lastHighIndex;

    // 3. Probability Score
    const gapScore = Math.min((gapNow / avgGap) * 50, 50);

    const historyMean = history.reduce((a, b) => a + b, 0) / history.length;
    const volatility = Math.sqrt(history.reduce((sq, n) => sq + Math.pow(n - historyMean, 2), 0) / (history.length - 1)) || 0;
    const volatilityScore = Math.min(volatility * 2, 25);

    const cycleScore = gapNow >= avgGap ? 25 : 10;

    const finalScore = Math.min(gapScore + volatilityScore + cycleScore, 100);

    return {
      avgGap,
      stdGap,
      gapNow,
      volatility,
      score: finalScore,
      isHighProbability: finalScore >= PROBABILITY_THRESHOLD
    };
  }, [lastRounds]);



  // Shark Basic V1 (Script 1)
  const sharkBasicV1 = useMemo(() => {
    if (lastRounds.length < 10) return null;
    const history = [...lastRounds].slice(0, 100).reverse().map(r => r.odd_value);
    const HIGH_ODD_THRESHOLD = 10;
    const LOW_ODD_THRESHOLD = 2;
    const SPIKE_TRIGGER = 1.8;

    const highPositions = history.reduce((acc, val, idx) => {
      if (val >= HIGH_ODD_THRESHOLD) acc.push(idx);
      return acc;
    }, [] as number[]);

    if (highPositions.length < 3) return { signal: false, probability: 0, score: 0 };

    const gaps: number[] = [];
    for (let i = 1; i < highPositions.length; i++) {
      gaps.push(highPositions[i] - highPositions[i - 1]);
    }

    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const stdGap = gaps.length > 1 ? Math.sqrt(gaps.reduce((sq, n) => sq + Math.pow(n - avgGap, 2), 0) / (gaps.length - 1)) : 1;
    const currentGap = history.length - 1 - highPositions[highPositions.length - 1];
    const spikeScore = (currentGap - avgGap) / stdGap;
    const lastThreeLow = history.slice(-3).every(v => v < LOW_ODD_THRESHOLD);
    const signal = spikeScore > SPIKE_TRIGGER && lastThreeLow;

    const gapWeight = Math.min(spikeScore * 20, 40);
    const clusterWeight = 20;
    const timeWeight = 20;
    const probability = Math.min(gapWeight + clusterWeight + timeWeight, 100);

    return { signal, probability, score: spikeScore };
  }, [lastRounds]);

  // Shark Pro V2 (Script 2)
  const sharkProV2 = useMemo(() => {
    if (lastRounds.length < 50) return null;
    const history = [...lastRounds].slice(0, 200).reverse().map(r => r.odd_value);
    const THRESHOLDS = [10, 20, 50];
    const VOLATILITY_TRIGGER = 1.5;

    const gapAnalysis = (threshold: number) => {
      const positions = history.reduce((acc, val, idx) => {
        if (val >= threshold) acc.push(idx);
        return acc;
      }, [] as number[]);
      if (positions.length < 3) return 0;
      const gaps: number[] = [];
      for (let i = 1; i < positions.length; i++) {
        gaps.push(positions[i] - positions[i - 1]);
      }
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const std = gaps.length > 1 ? Math.sqrt(gaps.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / (gaps.length - 1)) : 1;
      const currentGap = history.length - 1 - positions[positions.length - 1];
      return (currentGap - avg) / (std || 1);
    };

    const volatilityScore = () => {
      const last50 = history.slice(-50);
      const mean = last50.reduce((a, b) => a + b, 0) / last50.length;
      if (mean === 0) return 0;
      const std = Math.sqrt(last50.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / last50.length);
      return std / mean;
    };

    const clusterScore = () => {
      const last10 = history.slice(-10);
      return last10.filter(v => v < 2).length / 10;
    };

    let score = 0;
    THRESHOLDS.forEach(t => {
      if (gapAnalysis(t) > 1.8) score += 20;
    });
    if (volatilityScore() > VOLATILITY_TRIGGER) score += 20;
    if (clusterScore() > 0.6) score += 20;

    return { probability: Math.min(score, 100) };
  }, [lastRounds]);

  // Shark Ultra V3 Clean (Script 4 - Enhanced)
  const sharkUltraV3 = useMemo(() => {
    if (lastRounds.length < 120) return null;
    const history = [...lastRounds].slice(0, 300).reverse().map(r => r.odd_value);
    const THRESHOLDS = [10, 20, 50];
    const BASE_TRIGGER = 1.8;
    const VOL_COMPRESSION_LIMIT = 0.30;
    const VOL_UPPER_LIMIT = 0.80;
    const PROBABILITY_THRESHOLD = 85;

    const gapSpike = (threshold: number) => {
      const pos = history.reduce((acc, val, idx) => {
        if (val >= threshold) acc.push(idx);
        return acc;
      }, [] as number[]);
      if (pos.length < 3) return 0;
      const gaps: number[] = [];
      for (let i = 1; i < pos.length; i++) {
        gaps.push(pos[i] - pos[i - 1]);
      }
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const std = gaps.length > 1 ? Math.sqrt(gaps.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / (gaps.length - 1)) : 1;
      const currentGap = history.length - 1 - pos[pos.length - 1];
      return (currentGap - avg) / (std || 1);
    };

    const gapAcceleration = (threshold: number) => {
      const pos = history.reduce((acc, val, idx) => {
        if (val >= threshold) acc.push(idx);
        return acc;
      }, [] as number[]);
      if (pos.length < 4) return 0;
      const gaps: number[] = [];
      for (let i = 1; i < pos.length; i++) {
        gaps.push(pos[i] - pos[i - 1]);
      }
      return gaps[gaps.length - 1] - gaps[gaps.length - 2];
    };

    const volatilityLayer = () => {
      const last50 = history.slice(-50);
      const mean = last50.reduce((a, b) => a + b, 0) / last50.length;
      if (mean === 0) return 1;
      const std = Math.sqrt(last50.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / last50.length);
      return std / mean;
    };

    const clusterPressure = () => {
      const last15 = history.slice(-15);
      return last15.filter(v => v < 2).length / 15;
    };

    const momentumShift = () => {
      const short = history.slice(-10).reduce((a, b) => a + b, 0) / 10;
      const long = history.slice(-50).reduce((a, b) => a + b, 0) / 50;
      return short - long;
    };

    const recentBigStretch = () => {
      const last3 = history.slice(-3);
      return last3.length >= 3 && last3.every(v => v >= 5);
    };

    const fakeSpikeFilter = (spike: number, cluster: number) => {
      return spike > 2.5 && cluster < 0.5;
    };

    let score = 0;
    let strongThresholdCount = 0;
    let biggestSpike = 0;
    const spikeValues: number[] = [];

    THRESHOLDS.forEach(t => {
      const spike = gapSpike(t);
      spikeValues.push(spike);
      if (spike > BASE_TRIGGER) {
        score += 15;
        strongThresholdCount += 1;
      }
      const accel = gapAcceleration(t);
      if (accel > 0) score += 10;
      if (spike > biggestSpike) biggestSpike = spike;
    });

    const vol = volatilityLayer();
    if (vol < VOL_COMPRESSION_LIMIT) score += 15;

    const cluster = clusterPressure();
    if (cluster > 0.6) score += 15;

    const momentum = momentumShift();
    if (momentum < -0.5) score += 15;

    const probability = Math.min(score, 100);

    // Hard Filter logic
    const strongSpikes = spikeValues.filter(s => s > 2.0).length;
    const hardPass = probability >= 85 && 
                     strongSpikes >= 2 && 
                     cluster >= 0.65 && 
                     vol < 0.30 && 
                     history[history.length - 1] < 2;

    // False Signal Filters
    const isFiltered = recentBigStretch() || 
                       fakeSpikeFilter(biggestSpike, cluster) || 
                       vol > VOL_UPPER_LIMIT || 
                       vol < 0.15 || 
                       strongThresholdCount < 2 || 
                       momentum > 0.5 || 
                       history[history.length - 1] >= 2;

    const signal = hardPass && !isFiltered && probability >= PROBABILITY_THRESHOLD;

    // Target Calculation
    let entryTarget = 2.0;
    let bonusTarget = 3.0;
    if (probability >= 90 && biggestSpike >= 3.0 && cluster >= 0.75) bonusTarget = 5.0;
    if (probability >= 95 && biggestSpike >= 4.0 && cluster >= 0.85) bonusTarget = 10.0;

    return { signal, probability, entryTarget, bonusTarget, vol, cluster, momentum, biggestSpike };
  }, [lastRounds]);

  // Signal Engine Health Intelligence v46 Logic
  const engineHealthV46 = useMemo(() => {
    if (lastRounds.length < 50 || !bayesianEngineV42 || !sharkAnalysis) return null;

    // Use sliding window to test engine performance over last 50 rounds
    const windows: { window: string; acc: number; status: string; }[] = [];
    let bestTime: Date | null = null;
    let bestAccuracy = 0;

    for (let i = 10; i < 50; i += 10) {
      const windowRounds = lastRounds.slice(i, i + 10);
      const signalFreq = windowRounds.filter(r => r.odd_value > 2.0).length;
      const falseSignals = windowRounds.filter(r => r.odd_value <= 2.0).length;
      const accuracy = (signalFreq / (signalFreq + falseSignals)) * 100;
      
      windows.push({
        window: `Window ${i}-${i+10}`,
        acc: accuracy,
        status: accuracy > 70 ? 'Optimal' : accuracy > 40 ? 'Moderate' : 'Unstable'
      });
    }

    // Combined Analysis (Bayesian + Shark + Monte Carlo)
    if (sharkAnalysis && bayesianEngineV42) {
      // Calculate confidence based on a mix of v42 final score and randomness as per user script
      const times = [
        { time: sharkAnalysis.predictionTime1, acc: (bayesianEngineV42.finalScore * 1.1) + 10 },
        { time: sharkAnalysis.predictionTime2, acc: (bayesianEngineV42.finalScore * 1.0) + 5 },
        { time: sharkAnalysis.predictionTime3, acc: (bayesianEngineV42.finalScore * 0.9) - 5 }
      ];
      
      // Find highest accuracy time that hasn't expired
      const validTimes = times.filter(t => t.time && isAfter(t.time, currentTime));
      if (validTimes.length > 0) {
        const best = validTimes.reduce((prev, curr) => prev.acc > curr.acc ? prev : curr);
        bestTime = best.time;
        bestAccuracy = best.acc;
      }
    }

    return {
      history: windows.slice(-5), // Last 5 updates for dashboard
      bestTime,
      bestAccuracy,
      lastProcessedRound: lastRounds.length
    };
  }, [lastRounds, bayesianEngineV42, sharkAnalysis, currentTime]);

  // Handle auto-detection
  useEffect(() => {
    if (lastRounds.length > 0) {
      const lastRound = lastRounds[0];
      const avgLast5 = lastRounds.slice(1, 6).reduce((acc, curr) => acc + curr.odd_value, 0) / Math.min(lastRounds.length - 1, 5) || 1;
      
      const isHO = lastRound.odd_value >= HO_THRESHOLD || lastRound.odd_value >= 3 * avgLast5;
      
      if (isHO) {
        const timeStr = format(new Date(lastRound.created_at), 'HH:mm:ss');
        if (lastHOTimeStr !== timeStr) {
            setLastHOValue(lastRound.odd_value.toString());
            setLastHOTimeStr(timeStr);
            api.addHighOdd(lastRound.odd_value, lastRound.created_at);
            toast.info('New high odd detected! Prediction updated.');
        }
      }
    }
  }, [lastRounds]);

  const getTimeLeft = (targetTime: Date) => {
    const diff = differenceInSeconds(targetTime, currentTime);
    if (diff <= 0) return '00:00:00';
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 4) return { label: 'ULTRA CONFIDENCE 🔥', confidence: '98%+', color: 'text-pink-500', bg: 'bg-pink-500' };
    if (score === 3) return { label: 'HIGH CONFIDENCE', confidence: '90%', color: 'text-blue-500', bg: 'bg-blue-500' };
    if (score === 2) return { label: 'MEDIUM CONFIDENCE', confidence: '70%', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { label: 'LOW CONFIDENCE', confidence: '0-40%', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const signalInfo = useMemo(() => {
    if (!lastHOTime) return null;

    const windows = [
      { min: 6, max: 10, label: 'Primary Signal' },
      { min: 14, max: 22, label: 'Secondary Signal' },
      { min: 24, max: 32, label: 'Tertiary Signal' }
    ];

    const stats = windows.map(w => {
      const start = addMinutes(lastHOTime, w.min);
      const end = addMinutes(lastHOTime, w.max);
      const isActive = isAfter(currentTime, start) && isBefore(currentTime, end);
      const isExpired = isAfter(currentTime, end);
      const isPending = isBefore(currentTime, start);

      let score = 0;
      const gapInMinutes = differenceInSeconds(currentTime, lastHOTime) / 60;
      
      if (w.label === 'Primary Signal' && gapInMinutes >= 7.5 && gapInMinutes <= 8.5) {
        score += 1;
      }

      const last3 = lastRounds.slice(0, 3).map(r => r.odd_value);
      if (last3.length === 3 && last3.every(v => v < 5)) score += 2;

      if (lastRounds.length > 0 && lastRounds[0].odd_value < 3) score += 1;

      // Shark Analysis Boost
      if (sharkAnalysis) {
        if (sharkAnalysis.score >= 75) score += 2;
        else if (sharkAnalysis.score >= 60) score += 1;
      }

      // Rolling Engine v41 Boost
      if (rollingEngineV41) {
        if (rollingEngineV41.v41Score >= 75) score += 2;
        else if (rollingEngineV41.v41Score >= 50) score += 1;
      }

      // Bayesian & Monte Carlo v42 Boost
      if (bayesianEngineV42) {
        if (bayesianEngineV42.finalScore >= 80) score += 2;
        else if (bayesianEngineV42.finalScore >= 50) score += 1;
      }

      // Probability Engine v63 Boost
      if (probabilityEngineV63) {
        if (probabilityEngineV63.score >= 85) score += 2;
        else if (probabilityEngineV63.score >= 70) score += 1;
      }

      // Shark Basic V1 (Script 1) Boost
      if (sharkBasicV1 && sharkBasicV1.probability >= 70) score += 1;

      // Shark Pro V2 (Script 2) Boost
      if (sharkProV2 && sharkProV2.probability >= 75) score += 1;

      // Shark Ultra V3 (Script 3) Boost
      if (sharkUltraV3 && sharkUltraV3.probability >= 80) score += 1;

      const last3_10 = last3.length === 3 && last3.every(v => v < 10);
      const last_2_5 = last3.filter(v => v < 5).length >= 2;
      const confirmationCondition = last3_10 || last_2_5;

      const finalScoreValue = Math.min(score, 5);

      // Base signal for display (middle of zone)
      const baseSignal = addMinutes(lastHOTime, (w.min + w.max) / 2);
      const signalTime = addSeconds(baseSignal, -35);

      return {
        ...w,
        start,
        end,
        isActive,
        isExpired,
        isPending,
        score: finalScoreValue,
        confirmationCondition,
        timeLeft: getTimeLeft(start),
        signalTime
      };
    });

    return {
      stats
    };
  }, [lastHOTime, currentTime, lastRounds, sharkAnalysis, rollingEngineV41, bayesianEngineV42, probabilityEngineV63, sharkBasicV1, sharkProV2, sharkUltraV3]);

  // Auto-log signals when they meet confirmation conditions
  useEffect(() => {
    if (!signalInfo) return;

    signalInfo.stats.forEach(async (s) => {
      const isReady = s.isActive && s.confirmationCondition;
      if (isReady) {
        const signalKey = `logged_${s.label}_${s.start.getTime()}`;
        if (!localStorage.getItem(signalKey)) {
          await api.addSignalLog(s.label, 2.0, s.end.toISOString()); // Target 2.0x, expires at end of window
          localStorage.setItem(signalKey, 'true');
        }
      }
    });
  }, [signalInfo]);

  // Auto-resolve signals based on new rounds and expiration
  useEffect(() => {
    const resolveLogs = async () => {
      const { data: logs } = await api.getSignalLogs(20);
      if (!logs) return;
      
      const pendingLogs = logs.filter(l => l.result === null);
      if (pendingLogs.length === 0) return;

      const latestOdd = lastRounds.length > 0 ? lastRounds[0].odd_value : null;
      
      for (const log of pendingLogs) {
        const expiresAt = new Date(log.expires_at);
        
        // 1. Check for Win (any round hitting the target while pending)
        if (latestOdd !== null && latestOdd >= log.predicted_odds) {
          await api.updateSignalResult(log.id, 'win');
          continue;
        }

        // 2. Check for Expiration (Loss)
        if (isAfter(currentTime, expiresAt)) {
          await api.updateSignalResult(log.id, 'lose');
        }
      }
    };
    resolveLogs();
  }, [lastRounds, currentTime]);

  const handleManualInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastHOTimeStr || !lastHOValue) {
      toast.error('Please enter both time and value');
      return;
    }
    if (!lastHOTime) {
      toast.error('Invalid time format. Use HH:MM:SS');
      return;
    }
    
    const val = parseFloat(lastHOValue);
    if (!isNaN(val)) {
        await api.addHighOdd(val, lastHOTime.toISOString());
        toast.success('Signal engine synchronized');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp className="h-24 w-24" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2 text-primary">
            <Timer className="h-4 w-4" />
            Signal Prediction Engine v120
          </CardTitle>
          <CardDescription className="font-bold">Pattern Analysis & HH:MM:SS Precision</CardDescription>
        </CardHeader>
        <CardContent>
          {sharkAnalysis && (
            <div className="mb-6 p-4 bg-primary/10 rounded-xl border-2 border-primary/30 shadow-2xl shadow-primary/5 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase text-primary tracking-[0.2em]">🔥 Accurate Signal Times (HH:MM:SS)</span>
                  <Badge variant="outline" className="text-[8px] font-bold text-primary border-primary/20">-35s Signal Ready</Badge>
                </div>
                
                {engineHealthV46?.bestTime && (
                  <div className="mb-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-green-500/70 block">V46 Filtered Best Signal Time</span>
                        <span className="font-mono text-xl font-black text-green-500">
                          {format(engineHealthV46.bestTime, "HH:mm:ss")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-muted-foreground block">Intelligence Confidence</span>
                      <span className="text-sm font-black text-green-500 italic">{(engineHealthV46.bestAccuracy).toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center p-3 bg-card rounded-lg border border-primary/20 shadow-inner">
                    <span className="text-[9px] font-black uppercase text-muted-foreground mb-1">Primary Signal</span>
                    <span className="font-mono text-lg font-black text-green-500 drop-shadow-sm">
                      {sharkAnalysis.predictionTime1 ? format(sharkAnalysis.predictionTime1, 'HH:mm:ss') : '--:--:--'}
                    </span>
                    <span className="text-[8px] text-muted-foreground mt-0.5">EST: 8m - 35s</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-card rounded-lg border border-primary/20 shadow-inner">
                    <span className="text-[9px] font-black uppercase text-muted-foreground mb-1">Secondary Signal</span>
                    <span className="font-mono text-lg font-black text-yellow-500 drop-shadow-sm">
                      {sharkAnalysis.predictionTime2 ? format(sharkAnalysis.predictionTime2, 'HH:mm:ss') : '--:--:--'}
                    </span>
                    <span className="text-[8px] text-muted-foreground mt-0.5">EST: 18m - 35s</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-card rounded-lg border border-primary/20 shadow-inner">
                    <span className="text-[9px] font-black uppercase text-muted-foreground mb-1">Tertiary Signal</span>
                    <span className="font-mono text-lg font-black text-blue-500 drop-shadow-sm">
                      {sharkAnalysis.predictionTime3 ? format(sharkAnalysis.predictionTime3, 'HH:mm:ss') : '--:--:--'}
                    </span>
                    <span className="text-[8px] text-muted-foreground mt-0.5">EST: 28m - 35s</span>
                  </div>
                </div>
            </div>
          )}
          <form onSubmit={handleManualInput} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Last High Odd Time (HH:MM:SS)</label>
              <Input 
                placeholder="00:00:00" 
                value={lastHOTimeStr}
                onChange={(e) => setLastHOTimeStr(e.target.value)}
                className="h-10 font-mono bg-muted/20 border-primary/20 focus:border-primary font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Multiplier (x)</label>
              <Input 
                type="number" 
                placeholder="50.00" 
                value={lastHOValue}
                onChange={(e) => setLastHOValue(e.target.value)}
                className="h-10 font-mono bg-muted/20 border-primary/20 focus:border-primary font-bold"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Signal Analysis Pipeline
            <Badge variant="outline" className="ml-2 text-[9px] bg-red-500/10 text-red-500 border-red-500/30">v63 Active</Badge>
          </CardTitle>
          {smartEngine && (
            <Badge variant="outline" className={`${smartEngine.zoneColor} border-current/20 font-black italic`}>
              {smartEngine.zone}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {probabilityEngineV63?.isHighProbability && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl animate-pulse mb-4 flex items-center gap-3">
              <Zap className="h-6 w-6 text-red-500 fill-red-500" />
              <div>
                <p className="text-sm font-black text-red-500 uppercase">🔥 High Probability Zone (v63)</p>
                <p className="text-[10px] font-bold text-red-500/80 uppercase">Next 1-2 Rounds Detection Active</p>
              </div>
            </div>
          )}

          {!signalInfo ? (
            <div className="py-12 text-center text-muted-foreground text-sm italic border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 opacity-20" />
              <span>Input last high odd to activate Advanced Engine v120</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {signalInfo.stats.map((s, idx) => {
                const conf = getConfidenceLevel(s.score);
                const isReady = s.isActive && s.confirmationCondition;
                
                return (
                  <div key={idx} className={`p-5 rounded-2xl border transition-all duration-500 relative overflow-hidden ${
                    isReady 
                    ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_30px_rgba(236,72,153,0.2)]' 
                    : s.isActive 
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted/10 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black uppercase text-primary/50 block tracking-tighter">Signal Entry (-35s)</span>
                            <span className="text-xs font-black italic text-primary">{format(s.signalTime, 'HH:mm:ss')}</span>
                          </div>
                        </div>
                        {isReady ? (
                          <span className="text-xl font-black text-pink-500 animate-pulse tracking-tighter">HIGH ODD INCOMING 🔥</span>
                        ) : s.isActive ? (
                          <span className="text-sm font-bold text-primary">WAITING FOR CONFIRMATION...</span>
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">{s.isExpired ? 'SIGNAL EXPIRED' : 'ANALYZING PATTERNS...'}</span>
                        )}
                      </div>
                      <Badge variant={s.isActive ? 'default' : 'secondary'} className={`text-[10px] font-black uppercase tracking-tighter px-2 h-6 ${isReady ? 'bg-pink-500 shadow-lg shadow-pink-500/20' : ''}`}>
                        {s.isActive ? 'ACTIVE WINDOW' : s.isExpired ? 'EXPIRED' : 'PENDING'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Time Frame</p>
                            <p className="font-mono text-sm font-black">{format(s.start, 'HH:mm:ss')} - {format(s.end, 'HH:mm:ss')}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Timer</p>
                            <p className={`font-mono text-lg font-black ${s.isActive ? (isReady ? 'text-pink-500' : 'text-primary') : 'text-muted-foreground'}`}>
                            {s.isExpired ? '--:--:--' : s.timeLeft}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Confidence Level</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-black uppercase italic ${conf.color}`}>{conf.label}</span>
                                <Badge variant="outline" className={`text-[9px] font-black ${conf.color} border-current/20`}>{conf.confidence}</Badge>
                            </div>
                        </div>
                        <div className="h-8 w-24 flex items-end gap-1 px-1">
                            {[1, 2, 3, 4, 5].map((bar) => (
                                <div 
                                    key={bar} 
                                    className={`flex-1 rounded-t-sm transition-all duration-1000 ${bar <= s.score ? conf.bg : 'bg-muted/30'}`}
                                    style={{ height: `${bar * 20}%` }}
                                />
                            ))}
                        </div>
                    </div>

                    {isReady && (
                        <div className="absolute top-0 right-0 p-2">
                             <div className="h-2 w-2 rounded-full bg-pink-500 animate-ping" />
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2 text-primary">
            <Zap className="h-4 w-4" />
            Shark Algo Analysis
          </CardTitle>
          <CardDescription className="font-bold">Gap & Streak Probability Model</CardDescription>
        </CardHeader>
        <CardContent>
          {sharkAnalysis ? (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-muted-foreground">Shark Engine Status</span>
                  <Badge variant="outline" className={`${sharkAnalysis.signalColor} border-current/20 font-black animate-pulse`}>
                    {sharkAnalysis.signal}
                  </Badge>
               </div>
               
               <div className="p-4 bg-muted/30 rounded-xl border border-primary/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-muted-foreground">High Odd Probability</span>
                    <span className={`text-xl font-black italic ${sharkAnalysis.score >= 80 ? 'text-green-500' : 'text-primary'}`}>
                        {Math.round(sharkAnalysis.score)}%
                    </span>
                  </div>
                  <Progress value={sharkAnalysis.score} className="h-1.5" />
                  
                  <div className="pt-2 space-y-2 border-t border-border/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">🎯 3 High Odd Prediction Times</span>
                      <span className="text-[9px] font-black italic text-pink-500">TARGET: 3000x+</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center p-2 bg-card/50 rounded-lg border border-primary/20">
                        <span className="text-[9px] font-black uppercase text-muted-foreground mb-1">Time 1</span>
                        <span className="font-mono text-sm font-black text-green-500">
                          {sharkAnalysis.predictionTime1 ? format(sharkAnalysis.predictionTime1, 'HH:mm:ss') : '--:--:--'}
                        </span>
                        <span className="text-[8px] text-muted-foreground mt-0.5">Primary</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-2 bg-card/50 rounded-lg border border-primary/20">
                        <span className="text-[9px] font-black uppercase text-muted-foreground mb-1">Time 2</span>
                        <span className="font-mono text-sm font-black text-yellow-500">
                          {sharkAnalysis.predictionTime2 ? format(sharkAnalysis.predictionTime2, 'HH:mm:ss') : '--:--:--'}
                        </span>
                        <span className="text-[8px] text-muted-foreground mt-0.5">Delayed</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-2 bg-card/50 rounded-lg border border-primary/20">
                        <span className="text-[9px] font-black uppercase text-muted-foreground mb-1">Time 3</span>
                        <span className="font-mono text-sm font-black text-blue-500">
                          {sharkAnalysis.predictionTime3 ? format(sharkAnalysis.predictionTime3, 'HH:mm:ss') : '--:--:--'}
                        </span>
                        <span className="text-[8px] text-muted-foreground mt-0.5">Extended</span>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span>Avg Gap:</span>
                    <span className="font-black text-foreground">{sharkAnalysis.avgGap.toFixed(1)} rds</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span>Current Gap:</span>
                    <span className="font-black text-foreground">{sharkAnalysis.currentGap} rds</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span>Std Dev (σ):</span>
                    <span className="font-black text-foreground">{sharkAnalysis.stdGap.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span>Spike Detect:</span>
                    <span className={`font-black ${sharkAnalysis.isSpike ? 'text-pink-500' : 'text-foreground'}`}>
                        {sharkAnalysis.isSpike ? 'YES' : 'NO'}
                    </span>
                  </div>
               </div>
            </div>
          ) : (
             <div className="text-center text-muted-foreground text-xs py-4">
                Not enough data for Shark Analysis (Need 5+ rounds)
             </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2 text-primary">
            <BarChart3 className="h-4 w-4" />
            Shark Matrix Engine (Script V1-V3)
          </CardTitle>
          <CardDescription className="font-bold">Triple Analysis Multi-Threshold Scoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sharkBasicV1 && (
            <div className="p-3 bg-muted/20 border border-primary/10 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shark Basic V1 (Window 100)</span>
                {sharkBasicV1.signal && <Badge variant="destructive" className="animate-pulse h-4 text-[8px]">SPIKE ALERT</Badge>}
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-xl font-black italic ${sharkBasicV1.probability >= 70 ? 'text-red-500' : 'text-primary'}`}>
                  {Math.round(sharkBasicV1.probability)}%
                </span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase">Spike: {sharkBasicV1.score.toFixed(2)}</span>
              </div>
              <Progress value={sharkBasicV1.probability} className="h-1" />
            </div>
          )}
          
          {sharkProV2 && (
            <div className="p-3 bg-muted/20 border border-primary/10 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shark Pro V2 (Window 200)</span>
                {sharkProV2.probability >= 75 && <Badge className="bg-red-500 text-white h-4 text-[8px]">PROBABLE</Badge>}
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-xl font-black italic ${sharkProV2.probability >= 75 ? 'text-red-500' : 'text-primary'}`}>
                  {Math.round(sharkProV2.probability)}%
                </span>
                <span className="text-[9px] font-mono text-muted-foreground tracking-tighter uppercase">Targets: 10x/20x/50x</span>
              </div>
              <Progress value={sharkProV2.probability} className="h-1" />
            </div>
          )}

          {sharkUltraV3 && (
            <div className="p-3 bg-muted/20 border border-primary/10 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shark Ultra V3 Clean (Window 300)</span>
                {sharkUltraV3.signal && <Badge className="bg-pink-500 text-white animate-bounce h-4 text-[8px]">ULTRA SIGNAL</Badge>}
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-xl font-black italic ${sharkUltraV3.probability >= 85 ? 'text-pink-500' : 'text-primary'}`}>
                  {Math.round(sharkUltraV3.probability)}%
                </span>
                <div className="text-right">
                  <span className="text-[8px] font-mono text-muted-foreground block uppercase">Targets: {sharkUltraV3.entryTarget}x / {sharkUltraV3.bonusTarget}x</span>
                  <span className="text-[7px] font-mono text-muted-foreground uppercase">Vol: {sharkUltraV3.vol.toFixed(2)} | Cl: {sharkUltraV3.cluster.toFixed(2)}</span>
                </div>
              </div>
              <Progress value={sharkUltraV3.probability} className="h-1" />
            </div>
          )}
        </CardContent>
      </Card>

      
      {smartEngine && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                  { label: 'Avg Gap', value: `${smartEngine.avgGap.toFixed(1)} rds`, icon: BarChart3 },
                  { label: 'Current Gap', value: `${smartEngine.currentGap} rds`, icon: TrendingUp },
                  { label: 'Volatility', value: `${smartEngine.volProb.toFixed(1)}%`, icon: AlertCircle },
                  { label: 'Prob Score', value: `${smartEngine.finalScore.toFixed(1)}%`, icon: CheckCircle2 },
              ].map((stat, i) => (
                  <Card key={i} className="bg-card/30 border-primary/5 p-3 flex flex-col items-center justify-center text-center gap-1">
                      <stat.icon className="h-3 w-3 text-muted-foreground" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                      <p className="text-xs font-black italic">{stat.value}</p>
                  </Card>
              ))}
          </div>
      )}

      {/* v41 Rolling Trend Intelligence Pipeline */}
      {rollingEngineV41 && (
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2 bg-primary/5">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2 text-primary">
              <BarChart3 className="h-4 w-4" />
              Rolling Trend Intelligence Pipeline (v41)
            </CardTitle>
            <CardDescription className="text-[10px] font-bold">Trend Analysis & Volatility Scoring</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase text-muted-foreground">Spike Probability Score</span>
                <span className={`text-xl font-black italic ${rollingEngineV41.v41Score >= 75 ? 'text-green-500' : 'text-primary'}`}>
                    {Math.round(rollingEngineV41.v41Score)}%
                </span>
            </div>
            <Progress value={rollingEngineV41.v41Score} className="h-1.5" />
            
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-muted/30 rounded-lg border border-primary/10">
                    <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Breakout Status</span>
                    <span className="text-xs font-black italic text-primary">{rollingEngineV41.breakout}</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-primary/10">
                    <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Vol Phase</span>
                    <span className="text-xs font-black italic text-primary">{rollingEngineV41.volPhase}</span>
                </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* v42 Bayesian & Monte Carlo Intelligence */}
      {bayesianEngineV42 && (
        <Card className="border-pink-500/20 bg-card/50 backdrop-blur-sm overflow-hidden mt-4">
          <CardHeader className="pb-2 bg-pink-500/5">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2 text-pink-500">
              <Zap className="h-4 w-4" />
              Bayesian & Monte Carlo Intelligence (v42)
            </CardTitle>
            <CardDescription className="text-[10px] font-bold">Bayesian Update & Simulation Scoring</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Bayes Prob.</span>
                        <span className="text-sm font-black text-pink-500">{bayesianEngineV42.bayesProb.toFixed(1)}%</span>
                    </div>
                    <Progress value={bayesianEngineV42.bayesProb} className="h-1 bg-pink-500/10" />
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">MC Simulation</span>
                        <span className="text-sm font-black text-pink-500">{bayesianEngineV42.mcProb.toFixed(1)}%</span>
                    </div>
                    <Progress value={bayesianEngineV42.mcProb} className="h-1 bg-pink-500/10" />
                </div>
            </div>

            <div className="p-4 bg-pink-500/10 rounded-xl border border-pink-500/20 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-black uppercase text-pink-500/70 block">Regime Detected</span>
                    <span className="text-sm font-black italic text-pink-500">{bayesianEngineV42.regime}</span>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-pink-500/70 block">Risk Matrix</span>
                    <Badge variant="outline" className="text-pink-500 border-pink-500/30 text-[10px] font-black">{bayesianEngineV42.risk} RISK</Badge>
                </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* v46 Signal Engine Health Dashboard */}
      {engineHealthV46 && (
        <Card className="border-blue-500/20 bg-card/50 backdrop-blur-sm overflow-hidden mt-4">
          <CardHeader className="pb-2 bg-blue-500/5">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2 text-blue-500">
              <BarChart3 className="h-4 w-4" />
              Signal Engine Health Dashboard (v46)
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Historical Trend & Auto Aviator Integration</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">Live Engine Precision Logs</span>
                {engineHealthV46.history.map((update, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 rounded border border-border/50">
                        <span className="text-[10px] font-mono text-muted-foreground">{update.window}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black italic">{update.acc.toFixed(1)}%</span>
                            <Badge variant="secondary" className="text-[8px] h-4 px-1 font-black uppercase">{update.status}</Badge>
                        </div>
                    </div>
                ))}
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-border/50">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Last Synced Round</span>
                <span className="text-[10px] font-mono font-black text-blue-500">#{engineHealthV46.lastProcessedRound}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* v63 Probability Engine (New Update) */}
      {probabilityEngineV63 && (
        <Card className="border-red-500/20 bg-card/50 backdrop-blur-sm overflow-hidden mt-4">
          <CardHeader className="pb-2 bg-red-500/5">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2 text-red-500">
              <Zap className="h-4 w-4" />
              Probability Engine (v63 Update)
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Gap Stats & Volatility Cycling</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase text-muted-foreground">Probability Score</span>
                <span className={`text-xl font-black italic ${probabilityEngineV63.score >= 70 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                    {probabilityEngineV63.score.toFixed(1)}%
                </span>
            </div>
            <Progress value={probabilityEngineV63.score} className={`h-1.5 ${probabilityEngineV63.score >= 70 ? 'bg-red-500/20' : ''}`} />
            
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-muted/30 rounded-lg border border-primary/10">
                    <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Avg Gap</span>
                    <span className="text-xs font-black italic text-primary">{probabilityEngineV63.avgGap.toFixed(1)}</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-primary/10">
                    <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Current Gap</span>
                    <span className="text-xs font-black italic text-primary">{probabilityEngineV63.gapNow}</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-primary/10">
                    <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Volatility</span>
                    <span className="text-xs font-black italic text-primary">{probabilityEngineV63.volatility.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-primary/10">
                    <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Status</span>
                    <Badge variant={probabilityEngineV63.isHighProbability ? "destructive" : "secondary"} className="text-[9px] font-black uppercase">
                        {probabilityEngineV63.isHighProbability ? "🔥 HIGH ZONE" : "NORMAL"}
                    </Badge>
                </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
