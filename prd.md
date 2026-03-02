# Signl Community Service Requirements Document

## 1. Application Overview

**Application Name:** Signl Community Service

**Application Description:** A signal prediction tool compatible with Aviator and Crash games, providing high-probability time window predictions based on advanced pattern analysis algorithms.

## 2. Member Authentication System

### 2.1 Key-Based Access Control
- Implement password-based authentication system
- Valid member keys:
  - KA12
  - NI12
  - SA12
  - RO12
  - DI12
  - MA12
  - SU12
  - LA12
  - TH12
  - CH12
- Authentication logic:
  - Display password input field on application launch
  - Validate entered password against valid member keys list
  - If password matches any valid key: Grant access to Member Dashboard
  - If password does not match: Display error message Invalid or Expired Key
- Access control:
  - All application features accessible only after successful authentication
  - No bypass or guest access allowed

## 3. Core Features

### 3.1 Signal Prediction Engine
- Manual input fields:
  - Last high multiplier time (HH:MM:SS format)
  - High multiplier value (numeric)
- Generate three prediction windows:
  - Primary signal: 6-10 minutes after last high multiplier
  - Secondary signal: 14-22 minutes after last high multiplier
  - Tertiary signal: 24-32 minutes after last high multiplier
- **Display all three prediction windows with equal visibility and prominence**
- **For each prediction window, estimate three base signal times representing the best three high odds opportunities within that zone**
- **Subtract 35 seconds from each base signal time to display the final signal time in HH:MM:SS format**
- Display countdown timers showing hours, minutes, and seconds for each signal time
- Display confidence level for each prediction window

### 3.2 High Multiplier Detection Logic
- Use two criteria to detect high multipliers:
  - Multiplier greater than or equal to 50x
  - Peak greater than 3 times the average of the last 5 rounds
- Automatically save last high multiplier time when detected

### 3.3 Round Tracker
- Allow users to input recent round results (multiplier values)
- Track last 5 rounds for average calculation
- Display round history

### 3.4 Confirmation Logic
- Monitor time interval between current time and last high multiplier time
- Activate window when interval is between 6-10 minutes
- Check confirmation conditions:
  - Condition A: Last 3 multipliers less than 10x (SAFE_ODD_THRESHOLD)
  - Condition B: At least 2 multipliers less than 5x (LOW_ODD_THRESHOLD)
- Trigger signal when window is active and confirmation conditions are met

### 3.5 Confidence Scoring System
- Calculate confidence score (0-4 point scale):
  - +2 points: 3 consecutive low multipliers less than 5x
  - +1 point: Last multiplier less than 3x
  - +1 point: Time interval close to 8 minutes
- Display confidence level:
  - Score ≥ 3: High confidence
  - Score = 2: Medium confidence
  - Score ≤ 1: Low confidence

### 3.6 Advanced Prediction Algorithm Integration
- Implement interval analysis engine:
  - Calculate average interval between high multipliers
  - Calculate standard deviation of intervals
  - Track current interval since last high multiplier
  - Calculate interval probability using z-score and sigmoid function
- Implement low streak analysis:
  - Calculate consecutive low multipliers (below LOW_THRESHOLD = 2.0)
  - Calculate low streak score (max 100)
- Implement volatility analysis:
  - Calculate standard deviation of recent multipliers
  - Convert to volatility score (max 100)
- Final confidence score calculation:
  - Interval probability: 50% weight
  - Low streak score: 30% weight
  - Volatility score: 20% weight
  - Final score range: 0-100
- Display prediction zones:
  - Score ≥ 75: 🔥 Peak Watch Zone
  - Score ≥ 50: ⚡ Medium Probability Zone
  - Score < 50: Low Probability Zone
- Display detailed metrics:
  - Average interval
  - Interval standard deviation
  - Current interval
  - Interval probability
  - Low streak score
  - Volatility score
  - Final confidence score
  - Current zone

### 3.7 High Gap Deviation Spike Detection
- Calculate gap deviation spike level using formula: spike_level = avg_gap + (std_dev × multiplier)
- Multiplier options:
  - 1.0: Aggressive detection
  - 1.5: Medium detection
  - 2.0: Conservative detection
- Display spike detection status:
  - 🔥 Deviation Spike Zone: current_gap > spike_level
  - ⚠️ Above Average Gap: current_gap > avg_gap
  - Normal Flow: current_gap ≤ avg_gap
- Advanced z-score detection:
  - Calculate z = (current_gap - avg_gap) / std_dev
  - z > 2: Strong spike
  - z > 3: Extreme spike
- Cluster breakthrough alert:
  - Trigger when low_streak > avg_gap and current_gap > spike_level

### 3.8 SharkAnalyzer Integration
- Integrate SharkAnalyzer algorithm to enhance high multiplier prediction
- SharkAnalyzer features:
  - High multiplier index tracking (multipliers ≥ 10x)
  - Gap analysis between high multipliers:
    - Calculate average gap between high multipliers
    - Calculate standard deviation of gaps
  - Recent low streak detection:
    - Track low multipliers (< 2x) in recent 10-round window
    - Calculate consecutive low multiplier occurrences
  - Spike detection:
    - Detect last multiplier > average + (2 × standard deviation)
  - Probability score calculation (0-100 point scale):
    - Base score: 50
    - +20 points: Recent gap > average gap
    - +15 points: Low streak ≥ 5 rounds
    - +10 points: Standard deviation < average gap
  - Signal generation:
    - Score ≥ 75: 🟢 High Multiplier Signal Ready
    - Score ≥ 60: 🟡 Preparation Mode
    - Score < 60: 🔴 Wait
- Display SharkAnalyzer metrics:
  - Average gap and standard deviation
  - Recent gap since last high multiplier
  - Recent low streak count
  - Probability score
  - Signal status with confidence percentage
- Generate three high multiplier prediction times in HH:MM:SS format based on SharkAnalyzer analysis

### 3.9 Rolling Analysis Module
- Implement rolling window analysis for recent 50, 100, and 200 rounds
- Calculate and display for each window:
  - Average crash multiplier
  - Standard deviation
  - High spike count (multipliers ≥ 3.0)
  - Low round count (multipliers < 1.5)
  - Current z-score
  - Spike probability percentage
- Pre-spike zone detection based on low round ratio:
  - Low ratio > 0.65: High spike accumulation zone
  - Low ratio > 0.50: Medium accumulation
  - Otherwise: Normal distribution
- Display rolling analysis results for all three windows (Recent 50, Recent 100, Recent 200)

### 3.10 Moving Average Analysis Module
- Implement Simple Moving Average (SMA) calculation
- Implement Exponential Moving Average (EMA) calculation with smoothing factor k = 2 / (period + 1)
- Calculate and display multiple EMA periods:
  - EMA(10)
  - EMA(25)
  - EMA(50)
- Trend signal detection:
  - EMA(10) > EMA(25) > EMA(50): Bullish spike accumulation
  - EMA(10) < EMA(25) < EMA(50): Low cluster phase
  - Otherwise: Sideways/Random
- Momentum breakthrough detection (period = 25):
  - Current > average + (1.5 × standard deviation): Momentum breakthrough detected
  - Current < average - (1.5 × standard deviation): Downward volatility spike
  - Otherwise: Normal range
- Moving average score calculation (0-100 point scale):
  - +30 points: EMA(10) > EMA(25)
  - +30 points: EMA(25) > EMA(50)
  - +40 points: Momentum breakthrough detected
- Display trend signal and moving average score

### 3.11 Volatility Tracking Module
- Implement rolling standard deviation calculation
- Implement rolling average calculation
- Calculate z-score of latest multiplier
- Volatility phase classification:
  - Standard deviation < 0.5: Tight low cluster
  - Standard deviation < 1.0: Normal volatility
  - Standard deviation < 1.8: High volatility zone
  - Standard deviation ≥ 1.8: Extreme spike phase
- Display volatility metrics:
  - Rolling standard deviation
  - Rolling average
  - Current z-score
  - Volatility phase

### 3.12 Z-Score Spike Detection Module
- Calculate rolling statistics (average and standard deviation) for specified window
- Calculate current z-score of latest multiplier
- Spike signal classification:
  - Z ≥ 2.0: Extreme positive spike
  - Z ≥ 1.5: Strong spike
  - Z ≤ -2.0: Extreme low crash
  - Z ≤ -1.5: Low cluster pressure
  - Otherwise: Normal distribution
- Display z-score spike detection results:
  - Current z-score value
  - Spike signal classification

### 3.13 Advanced Statistical Engine (V2.0)
- Implement rolling statistics engine:
  - Calculate average, standard deviation, high ratio, low ratio for rolling window (default 200 rounds)
  - Calculate entropy using histogram distribution (10 bins)
  - Display all rolling statistics
- Implement regime detection:
  - Compare short-term variance (recent 50 rounds) with long-term variance (recent 200 rounds)
  - Classify regime:
    - Volatility expansion: short_var > 1.8 × long_var
    - Tight low cluster: short_var < 0.5 × long_var
    - Balanced/Random: Otherwise
  - Display current regime state
- Implement Bayesian probability update:
  - Use high ratio as prior probability
  - Calculate likelihood based on recent low streak (recent 10 rounds)
  - Update posterior probability using Bayes formula
  - Display Bayesian probability percentage
- Implement Monte Carlo simulation:
  - Run 10,000 simulations using normal distribution (average and standard deviation from rolling statistics)
  - Simulate next 10 rounds for each iteration
  - Calculate probability of reaching threshold (≥10x) in any simulated round
  - Display Monte Carlo probability percentage
- Calculate final probability score:
  - Weighted combination: Bayesian probability (50%) + Monte Carlo probability (30%)
  - Apply regime multiplier:
    - Volatility expansion: 1.2x
    - Balanced/Random: 1.0x
    - Tight low cluster: 0.8x
  - Final score capped at 100%
  - Display final probability score percentage
- Implement Kelly scaling risk recommendation:
  - Calculate edge: (probability × multiplier) - 1
  - Calculate Kelly fraction: edge / multiplier
  - Recommend risk amount: bankroll × Kelly fraction × 0.25 (conservative scaling)
  - Display recommended risk amount
- Generate three high multiplier prediction times in HH:MM:SS format based on comprehensive analysis including V2.0 statistical engine

### 3.14 V63 Probability Engine Update
- Implement V63 probability scoring system:
  - HIGH_ODD_THRESHOLD = 10
  - ROLLING_WINDOW = 100
  - PROBABILITY_THRESHOLD = 70
- Store round history using deque with maxlen=ROLLING_WINDOW
- Calculate gap statistics:
  - Identify high multiplier indices (rounds ≥ HIGH_ODD_THRESHOLD)
  - Calculate gaps between consecutive high multipliers
  - Calculate average and standard deviation of gaps
- Calculate current gap:
  - Calculate number of rounds since last high multiplier occurrence
- Implement V63 probability score calculation:
  - Gap score: min((current_gap / avg_gap) × 50, 50)
  - Volatility score: min(stdev(round_history) × 2, 25)
  - Cycle score: 25 if current_gap ≥ avg_gap, otherwise 10
  - Final score: gap_score + volatility_score + cycle_score (capped at 100)
- Display V63 probability metrics:
  - Current round value
  - Probability score percentage
  - High probability zone alert when score ≥ PROBABILITY_THRESHOLD (70%)
- Alert message: Display 🔥 High Probability Zone (Next 1-2 Rounds) when threshold is reached

### 3.15 NTP Time Synchronization Module
- Implement NTP time synchronization using ntplib
- Connect to pool.ntp.org NTP server
- Retrieve server time via NTP client request
- Fallback to local system time if NTP request fails
- Display synchronized server time in HH:MM:SS format
- Use synchronized time for all signal alerts and predictions

### 3.16 Data Persistence Module
- Implement JSON-based history storage (history.json)
- Implement CSV-based history storage (history.csv)
- Load round history from storage files on application startup
- Save round history to storage files after each new round input
- Support loading recent N rounds from CSV using pandas
- Maintain rolling window of historical data

### 3.17 Telegram Alert Integration
- Implement Telegram bot integration for signal alerts
- Configuration fields:
  - TELEGRAM_TOKEN (bot token)
  - CHAT_ID (target chat ID)
- Send alert messages when probability threshold is reached
- Alert message format:
  - Signal type indicator (🔥 SIGNL ALERT / 🔥 SHARK SIGNAL / 🔥 SHARK V2 SIGNAL / 🔥 SHARK V3 CLEAN SIGNAL)
  - Synchronized server time (HH:MM:SS format)
  - Probability percentage
  - Target multiplier (10x / 20x / 50x or 2x-3x / 5x / 10x)
  - Entry bet amount (if applicable)
  - Entry target and reward target (if applicable)
- Skip Telegram sending if token is not configured (placeholder value)

### 3.18 Multi-Tier Shark V1 Engine
- Implement gap analysis for multiple thresholds (10x, 20x, 50x)
- Calculate gap spike score:
  - Identify high multiplier positions for each threshold
  - Calculate gaps between consecutive high multipliers
  - Calculate average and standard deviation of gaps
  - Calculate current gap since last high multiplier
  - Calculate spike score: (current_gap - avg_gap) / std_dev
- Implement volatility scoring:
  - Calculate standard deviation of recent 50 rounds
  - Calculate average of recent 50 rounds
  - Calculate volatility ratio: std / mean
- Implement cluster scoring:
  - Analyze recent 10 rounds
  - Calculate low multipliers (< 2x)
  - Calculate cluster ratio: low_count / 10
- Calculate composite probability score:
  - +20 points for each threshold with spike > 1.8
  - +20 points if volatility > VOLATILITY_TRIGGER (1.5)
  - +20 points if cluster ratio > 0.6
  - Final score capped at 100
- Trigger alert when probability ≥ PROBABILITY_THRESHOLD (75%)
- Display Shark V1 metrics:
  - Gap spike scores for all thresholds
  - Volatility ratio
  - Cluster ratio
  - Composite probability score

### 3.19 Multi-Tier Shark V2 Engine
- Implement enhanced gap spike analysis:
  - Calculate gap spikes for multiple thresholds (10x, 20x, 50x)
  - Use BASE_TRIGGER = 1.8 for spike detection
  - +15 points for each threshold with spike > BASE_TRIGGER
- Implement gap acceleration analysis:
  - Calculate gap acceleration: gaps[-1] - gaps[-2]
  - +10 points for each threshold with positive acceleration
- Implement volatility compression detection:
  - Calculate volatility ratio of recent 50 rounds
  - +15 points if volatility < VOL_COMPRESSION_LIMIT (0.35)
- Implement cluster pressure analysis:
  - Analyze recent 15 rounds
  - Calculate low multipliers (< 2x)
  - Calculate cluster pressure ratio: low_count / 15
  - +15 points if cluster pressure > 0.6
- Implement momentum shift detection:
  - Calculate short-term average (recent 10 rounds)
  - Calculate long-term average (recent 50 rounds)
  - Calculate momentum shift: short_mean - long_mean
  - +15 points if momentum shift < -0.5
- Calculate composite probability score (capped at 100)
- Trigger alert when probability ≥ PROBABILITY_THRESHOLD (80%)
- Display Shark V2 metrics:
  - Gap spike scores for all thresholds
  - Gap acceleration values
  - Volatility compression status
  - Cluster pressure ratio
  - Momentum shift value
  - Composite probability score

### 3.20 Shark V3 Engine (Updated)
- Implement Shark V3 probability scoring system:
  - WINDOW_SIZE = 300
  - THRESHOLDS = [10, 20, 50]
  - PROBABILITY_THRESHOLD = 85
  - BASE_TRIGGER = 1.8
  - VOL_COMPRESSION_LIMIT = 0.30
  - VOL_UPPER_LIMIT = 0.80
- Implement multi-layer analysis:
  - Layer 1: Gap spike analysis (calculate gap spikes for each threshold)
  - Layer 2: Gap acceleration analysis (calculate gap acceleration)
  - Layer 3: Volatility layer (calculate volatility ratio)
  - Layer 4: Cluster pressure (analyze low multipliers in recent 15 rounds)
  - Layer 5: Momentum shift (compare short-term and long-term averages)
- Implement probability calculation:
  - +15 points for each threshold with spike > BASE_TRIGGER, strong_threshold_count +1
  - +10 points for each threshold with positive acceleration
  - +15 points if volatility < VOL_COMPRESSION_LIMIT
  - +15 points if cluster pressure > 0.6
  - +15 points if momentum shift < -0.5
  - Final score capped at 100
- Implement hard filters:
  - Minimum probability ≥ 85
  - At least 2 strong spikes (>2.0)
  - Cluster pressure ≥ 0.65
  - Volatility compression < 0.30
  - Last round must be low multiplier (< 2)
- Implement false signal filters:
  - Recent large stretch (all recent 3 rounds ≥ 5)
  - False spike filter (spike > 2.5 and cluster < 0.5)
  - Excessive volatility (volatility > VOL_UPPER_LIMIT)
  - Dead market (volatility < 0.15)
  - Threshold confirmation (strong_count < 2)
  - Momentum trap (momentum > 0.5)
  - Last round ≥ 2
- Implement target correction:
  - Default entry target: 2.0x
  - Default reward target: 3.0x
  - High probability ≥ 90 and spike ≥ 3.0 and cluster ≥ 0.75: Reward target 5.0x
  - Ultra-strong probability ≥ 95 and spike ≥ 4.0 and cluster ≥ 0.85: Reward target 10.0x
- Implement bet management:
  - BANKROLL = 1000 (example total bankroll)
  - BET_PERCENT = 1 (1% per bet)
  - MAX_ATTEMPTS = 3 (maximum attempts)
  - Calculate bet amount: round(BANKROLL × BET_PERCENT / 100, 2)
- Display Shark V3 metrics:
  - Gap spike scores for all thresholds
  - Gap acceleration values
  - Volatility ratio
  - Cluster pressure ratio
  - Momentum shift value
  - Composite probability score
  - Entry bet amount
  - Entry target
  - Reward target
  - Alert status

### 3.21 Automatic Signal Detection Loop
- Implement continuous monitoring loop
- Implement round completion detector:
  - Monitor history.csv file modification time
  - Trigger signal detection when file update is detected
- Implement timing controller:
  - CHECK_INTERVAL = 0.5 seconds (fast detection)
  - ROUND_DELAY = 1 second (wait after crash)
  - Wait 1 second after round completion is detected
  - Then calculate signals for next round
- Load latest round history from storage
- Run all enabled analysis engines
- Generate alerts when probability thresholds are met
- Display console output for all triggered signals
- Send alert messages via Telegram (if configured)

### 3.22 Signal Logging and Accuracy Tracking Module
- Implement SQLite database integration (signals.db)
- Create logs table with columns:
  - id (INTEGER PRIMARY KEY AUTOINCREMENT)
  - timestamp (TEXT)
  - signal_type (TEXT)
  - odds (REAL)
  - result (TEXT)
- Implement add_signal function:
  - Accept signal_type and odds parameters
  - Generate timestamp in HH:MM:SS format using datetime
  - Insert signal record into logs table
  - Display confirmation message with timestamp, signal_type, and odds
- Implement update_result function:
  - Accept signal_id and result parameters
  - Update result field for specified signal_id
  - Display confirmation message with signal_id and result
- **Implement update_target_odds function:**
  - **Accept signal_id and new_odds parameters**
  - **Update odds field for specified signal_id**
  - **Display confirmation message with signal_id and updated odds value**
- Implement calculate_accuracy function:
  - Query logs table grouped by signal_type
  - Calculate total signals and win count for each signal_type
  - Calculate accuracy percentage: (wins / total) × 100
  - Display accuracy report showing signal_type, accuracy percentage, and win/total ratio
- Automatically log signals when generated by any analysis engine
- Provide interface to update signal results after game outcome is known
- **Provide interface to modify target odds for logged signals**
- Display accuracy statistics on demand
- Maintain database connection throughout application lifecycle
- Close database connection on application shutdown

## 4. Prediction Algorithm Constants

- HIGH_THRESHOLD = 10.0
- LOW_THRESHOLD = 2.0
- HO_THRESHOLD = 50
- LOW_ODD_THRESHOLD = 5 (V63: 2)
- SAFE_ODD_THRESHOLD = 10
- MIN_GAP = 6 minutes
- MAX_GAP = 10 minutes
- CONFIRM_LOW_COUNT = 3 rounds
- ROLLING_WINDOW = 200 (V63: 100)
- MONTE_CARLO_SIMULATIONS = 10000
- V63_HIGH_ODD_THRESHOLD = 10
- V63_ROLLING_WINDOW = 100
- V63_PROBABILITY_THRESHOLD = 70
- SHARK_V1_WINDOW_SIZE = 100
- SHARK_V1_SPIKE_TRIGGER = 1.8
- SHARK_V1_PROBABILITY_THRESHOLD = 70
- SHARK_V1_VOLATILITY_TRIGGER = 1.5
- SHARK_V2_WINDOW_SIZE = 200
- SHARK_V2_BASE_TRIGGER = 1.8
- SHARK_V2_PROBABILITY_THRESHOLD = 75
- SHARK_V2_VOL_COMPRESSION_LIMIT = 0.35
- SHARK_V3_WINDOW_SIZE = 300
- SHARK_V3_BASE_TRIGGER = 1.8
- SHARK_V3_PROBABILITY_THRESHOLD = 85
- SHARK_V3_VOL_COMPRESSION_LIMIT = 0.30
- SHARK_V3_VOL_UPPER_LIMIT = 0.80
- THRESHOLDS = [10, 20, 50]
- BANKROLL = 1000
- BET_PERCENT = 1
- MAX_ATTEMPTS = 3
- CHECK_INTERVAL = 0.5
- ROUND_DELAY = 1
- **SIGNAL_TIME_ADJUSTMENT = 35 seconds (subtract from base signal time)**

## 5. User Interface Requirements

### 5.1 Authentication Screen
- Display application logo (1000268339.png)
- Display application name Signl Community Service
- Display password input field
- Display login button
- Display error message area for invalid key notification

### 5.2 Signal Dashboard (Member Dashboard)
- Display current signal status (pending/active/expired)
- **Display three prediction windows (Primary Signal, Secondary Signal, Tertiary Signal) with equal visibility and prominence**
- **For each prediction window, display three base signal times representing the best three high odds opportunities**
- **Display final signal times (base signal time minus 35 seconds) in HH:MM:SS format**
- Display countdown timers showing hours, minutes, and seconds for each signal time
- Display confidence meter for each window
- Round tracker input section
- Real-time status updates
- Display advanced prediction metrics:
  - Average interval
  - Interval standard deviation
  - Current interval
  - Interval probability
  - Low streak score
  - Volatility score
  - Final confidence score
  - Current zone indicator
- Display gap deviation spike detection metrics:
  - Average gap
  - Standard deviation
  - Current gap
  - Spike level
  - Detection status
  - Z-score (if applicable)
  - Cluster breakthrough alert (if triggered)
- Display SharkAnalyzer metrics:
  - Average gap and standard deviation
  - Recent gap since last high multiplier
  - Recent low streak count
  - Probability score
  - Signal status with confidence percentage
  - Three predicted high multiplier times in HH:MM:SS format
- Display rolling analysis metrics:
  - Recent 50 rounds analysis results
  - Recent 100 rounds analysis results
  - Recent 200 rounds analysis results
  - Pre-spike zone detection status
- Display moving average analysis metrics:
  - SMA values
  - EMA(10), EMA(25), EMA(50) values
  - Trend signal
  - Momentum breakthrough status
  - Moving average score
- Display volatility tracking metrics:
  - Rolling standard deviation
  - Rolling average
  - Current z-score
  - Volatility phase
- Display z-score spike detection metrics:
  - Current z-score value
  - Spike signal classification
- Display V2.0 statistical engine metrics:
  - Rolling statistics (average, standard deviation, high ratio, low ratio, entropy)
  - Current regime state
  - Bayesian probability percentage
  - Monte Carlo probability percentage (next 10 rounds ≥10x)
  - Final probability score percentage
  - Recommended risk amount
- Display V63 probability engine metrics:
  - Current round value
  - V63 probability score percentage
  - High probability zone alert when score ≥ 70% (🔥 High Probability Zone - Next 1-2 Rounds)
- Display NTP synchronized server time in HH:MM:SS format
- Display Shark V1 engine metrics:
  - Gap spike scores for thresholds 10x, 20x, 50x
  - Volatility ratio
  - Cluster ratio
  - Composite probability score
  - Alert status
- Display Shark V2 engine metrics:
  - Gap spike scores for thresholds 10x, 20x, 50x
  - Gap acceleration values
  - Volatility compression status
  - Cluster pressure ratio
  - Momentum shift value
  - Composite probability score
  - Alert status
- Display Shark V3 engine metrics:
  - Gap spike scores for thresholds 10x, 20x, 50x
  - Gap acceleration values
  - Volatility ratio
  - Cluster pressure ratio
  - Momentum shift value
  - Composite probability score
  - Entry bet amount
  - Entry target
  - Reward target
  - Alert status
- Display signal logging and accuracy tracking section:
  - Signal accuracy statistics by signal type
  - Interface to update signal results (win/lose)
  - **Interface to modify target odds for logged signals**
  - Historical signal log display
- Display Telegram alert configuration status
- **Display real-time clock showing current time in HH:MM:SS format**
- Background displays logo image (1000268339.png) with visible transparency

### 5.3 Brand Elements
- Logo image (1000268339.png) display locations:
  - Application header
  - Application background watermark (visible but not obtrusive)
- Application name Signl Community Service prominently displayed

## 6. Reference Files

1. Logo image: 1000268339.png
2. CSV data file: history.csv (containing 300 rounds of historical data with Round and Odd columns)