import React, { useState, useEffect } from 'react';
import { Consent } from './types';

/**
 * AboutScreen implements :AdditionalFunctionality:.
 * Displays app info, consent status, and data management.
 */
export const AboutScreen: React.FC = () => {
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('aad_consent');
    if (saved) {
      try {
        setConsent(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load consent in AboutScreen", e);
      }
    }
  }, []);

  const handleDeleteData = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all your check-in history and monitoring plans? This action cannot be undone."
    );

    if (confirmed) {
      try {
        localStorage.removeItem('aad_points');
        localStorage.removeItem('aad_monitoring');
        alert("All check-in data has been deleted.");
        // Refresh page to reset internal states if necessary
        window.location.reload();
      } catch (e) {
        console.error("Error deleting data from localStorage", e);
        alert("An error occurred while trying to delete data.");
      }
    }
  };

  return (
    <section className="plan-screen animate-fade-in">
      <h2 className="screen-title">About</h2>
      
      <div className="status-card">
        <p className="plan-detail">
          <strong>Privacy First</strong>
          An Apple a Day is a local-first application. Your raw audio and video never leave this device. 
          We only store derived numerical signals.
        </p>
        <p className="info-text">
          Disclaimer: This app is not a medical device and does not provide clinical diagnoses.
        </p>
      </div>

      <div className="status-card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Your Permissions</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li className="plan-detail">
            <strong>Voice Signals:</strong> {consent?.voiceSignals ? "Enabled" : "Disabled"}
          </li>
          <li className="plan-detail">
            <strong>Face Signals:</strong> {consent?.faceSignals ? "Enabled" : "Disabled"}
          </li>
          <li className="plan-detail">
            <strong>Federated Sharing:</strong> {consent?.federatedSharing ? "Active" : "Inactive"}
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '30px', padding: '0 10px' }}>
        <button 
          className="btn-secondary" 
          onClick={handleDeleteData}
          style={{ color: '#ffb3b3', borderColor: 'rgba(255,100,100,0.3)' }}
        >
          Delete all check-ins
        </button>
        <p className="small-text">
          This will remove all your progress, trends, and active monitoring plans.
        </p>
      </div>
    </section>
  );
};