import React, { useMemo, useState } from 'react';
import { DailyPoint, MonitoringPlan } from './types';
import { buildHandoffSummary, formatSummaryToText } from './handoffLogic';

/**
 * :ShareScreen: builds and displays the :HandoffSummary:.
 */
export const ShareScreen: React.FC = () => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const data = useMemo(() => {
    try {
      const pointsRaw = localStorage.getItem('aad_points');
      const planRaw = localStorage.getItem('aad_monitoring');
      const points: DailyPoint[] = pointsRaw ? JSON.parse(pointsRaw) : [];
      const plan: MonitoringPlan | null = planRaw ? JSON.parse(planRaw) : null;
      
      const summary = buildHandoffSummary(points, plan);
      return { summary, text: formatSummaryToText(summary) };
    } catch (e) {
      console.error("Failed to build handoff summary", e);
      return null;
    }
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.text);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 3000);
    } catch (err) {
      setCopyStatus('error');
      console.error("Clipboard copy failed", err);
    }
  };

  if (!data) {
    return (
      <section className="plan-screen">
        <h2 className="screen-title">Share Summary</h2>
        <p>No data available to generate a summary yet.</p>
      </section>
    );
  }

  return (
    <section className="plan-screen animate-fade-in">
      <h2 className="screen-title">Handoff Summary</h2>
      <p className="small-text">
        Use this summary to help explain how you've been feeling to a healthcare professional.
      </p>

      <div className="status-card" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', textAlign: 'left' }}>
        <strong>Concerns:</strong>
        <p className="plan-detail">{data.summary.concerns}</p>
        <hr />
        <strong>Trends:</strong>
        <p className="plan-detail">{data.summary.trends}</p>
        <hr />
        <p className="info-text" style={{ opacity: 1, color: 'var(--accent-warm)' }}>
          {data.summary.disclaimer}
        </p>
      </div>

      <button 
        className="continue-button" 
        style={{ width: '100%' }} 
        onClick={handleCopy}
      >
        {copyStatus === 'copied' ? '✓ Copied' : 'Copy summary'}
      </button>
      
      {copyStatus === 'error' && (
        <p className="error-text" style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '10px' }}>
          Failed to copy. Please select and copy the text manually.
        </p>
      )}
    </section>
  );
};