import { MonitoringPlan, DispositionLevel } from './types';

const STORAGE_KEY = 'aad_monitoring';

/**
 * Checks if a :MonitoringPlan: should be activated based on :DispositionLevel:
 * and saves it to localStorage if no plan is currently active.
 */
export const activateMonitoringIfRequired = (level: DispositionLevel, reason: string): void => {
  try {
    // Check if a plan is already active
    const existingPlanRaw = localStorage.getItem(STORAGE_KEY);
    if (existingPlanRaw) {
      const existingPlan: MonitoringPlan = JSON.parse(existingPlanRaw);
      if (existingPlan.isActive) {
        return; // Already monitoring, do not overwrite
      }
    }

    // Trigger for specific levels
    const triggerLevels: DispositionLevel[] = ['emergency-999', 'urgent-111', 'gp-routine'];
    
    if (triggerLevels.includes(level)) {
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
      const newPlan: MonitoringPlan = {
        isActive: true,
        intervalDays: 2,
        reason: reason,
        nextCheckInDue: Date.now() + twoDaysInMs,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlan));
    }
  } catch (error) {
    // Defensive programming: log error but do not crash the triage flow
    console.error(`[MonitoringPlan] Failed to update monitoring plan: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      level,
      reason,
      error
    });
  }
};