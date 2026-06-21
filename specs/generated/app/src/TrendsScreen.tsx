import React, { useMemo, useState } from 'react';
import './Trends.css';
import { DailyPoint } from './types';
import { calculateTrend, TrendStats } from './trendsLogic';
import { computeFederatedUpdate } from './federatedLogic';

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="sparkline">
      {data.map((v, i) => (
        <div 
          key={i} 
          className="spark-bar" 
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
};

const TrendCard: React.FC<{ stats: TrendStats }> = ({ stats }) => {
  const directionClass = stats.direction.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="trend-card">
      <div className="trend-header">
        <span className="trend-label">{stats.label}</span>
        <span className={`trend-direction ${directionClass}`}>{stats.direction}</span>
      </div>
      <div className="trend-body">
        <div className="trend-main-val">
          <span className="val-now">{stats.latest.toFixed(1)}</span>
          <span className="val-meta">vs {stats.baseline.toFixed(1)} baseline</span>
        </div>
        <Sparkline data={stats.history} />
      </div>
    </div>
  );
};

export const TrendsScreen: React.FC = () => {
  const points: DailyPoint[] = useMemo(() => {
    try {
      const saved = localStorage.getItem('aad_points');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load points for trends", e);
      return [];
    }
  }, []);

  const trends = [
    calculateTrend(points, 'Wellbeing', p => p.wellbeingIndex),
    calculateTrend(points, 'Mood', p => p.mood),
    calculateTrend(points, 'Voice Clarity', p => p.voiceSignal?.clarity),
    calculateTrend(points, 'Blink Rate', p => p.faceSignal?.blinkRate),
  ].filter((t): t is TrendStats => t !== null);

  if (points.length < 3) {
    return (
      <div className="trends-screen empty">
        <h2>Your Trends</h2>
        <p className="intro-text">
          Trends will appear here after you have completed at least three check-ins. 
          Keep going to see how your signals change over time!
        </p>
      </div>
    );
  }

  const [flUpdate, setFlUpdate] = useState<{roundId: string} | null>(null);

  const handleFederatedUpdate = () => {
    try {
      const result = computeFederatedUpdate(points);
      setFlUpdate(result);
    } catch (err) {
      console.error("Federated computation failed", err);
    }
  };

  return (
    <div className="trends-screen">
      <h2>Your Trends</h2>
      <p className="disclaimer-text">
        These are signals tracked over time, not clinical scores or diagnoses.
      </p>
      <div className="trends-grid">
        {trends.map(t => <TrendCard key={t.label} stats={t} />)}
      </div>

      <div className="federated-card">
        <h3>Federated learning (FLock.io)</h3>
        <p>
          Our model improves from everyone's check-ins without anyone sharing their data. 
          Your raw numbers never leave this device.
        </p>
        {!flUpdate ? (
          <button className="fl-btn" onClick={handleFederatedUpdate}>
            Contribute to Federated Model
          </button>
        ) : (
          <div className="fl-result">
            <strong>Update computed!</strong><br />
            Contributed to round: {flUpdate.roundId}
          </div>
        )}
      </div>
    </div>
  );
};