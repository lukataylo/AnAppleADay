import React, { useState, useEffect } from 'react';
import { MonitoringPlan } from './types';

/**
 * :PlanScreen: implements the UI for :MonitoringPlan: functionality.
 * It allows users to view, deactivate, or manually start follow-up plans.
 */
export const PlanScreen: React.FC = () => {
  const [plan, setPlan] = useState<MonitoringPlan | null>(null);

  // Load plan from localStorage on mount
  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = () => {
    try {
      const saved = localStorage.getItem('aad_monitoring');
      if (saved) {
        setPlan(JSON.parse(saved));
      } else {
        setPlan(null);
      }
    } catch (e) {
      console.error("[PlanScreen] Failed to load monitoring plan", e);
    }
  };

  const updatePlan = (newPlan: MonitoringPlan | null) => {
    try {
      if (newPlan) {
        localStorage.setItem('aad_monitoring', JSON.stringify(newPlan));
      } else {
        localStorage.removeItem('aad_monitoring');
      }
      setPlan(newPlan);
    } catch (e) {
      alert("Could not update your plan. Please check storage permissions.");
    }
  };

  const handleToggleOff = () => {
    if (plan) {
      const updated = { ...plan, isActive: false };
      updatePlan(updated);
    }
  };

  const handleStartManual = () => {
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    const manualPlan: MonitoringPlan = {
      isActive: true,
      intervalDays: 2,
      reason: "Manual follow-up",
      nextCheckInDue: Date.now() + twoDaysInMs,
    };
    updatePlan(manualPlan);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (plan?.isActive) {
    return (
      <section className="plan-screen animate-fade-in">
        <h2 className="screen-title">Your Monitoring Plan</h2>
        <div className="status-card active">
          <div className="status-badge">Active</div>
          <p className="plan-detail">
            <strong>Interval:</strong> Every {plan.intervalDays} days
          </p>
          <p className="plan-detail">
            <strong>Reason:</strong> {plan.reason}
          </p>
          <p className="plan-detail">
            <strong>Next due:</strong> {formatDate(plan.nextCheckInDue)}
          </p>
          <button 
            className="secondary-button" 
            onClick={handleToggleOff}
            style={{ marginTop: '20px', width: '100%' }}
          >
            Turn off follow-up
          </button>
        </div>
        <p className="info-text">
          Regular check-ins help us track your wellbeing trends more accurately.
        </p>
      </section>
    );
  }

  return (
    <section className="plan-screen animate-fade-in">
      <h2 className="screen-title">Monitoring Plan</h2>
      <div className="status-card inactive">
        <p>No active follow-up plan.</p>
        <p className="small-text">
          Follow-up switches on automatically if a check-in suggests something worth watching.
        </p>
        <button 
          className="continue-button" 
          onClick={handleStartManual}
          style={{ width: '100%' }}
        >
          Start every-other-day check-ins
        </button>
      </div>
    </section>
  );
};