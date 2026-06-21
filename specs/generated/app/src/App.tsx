import React, { useState } from 'react';
import './index.css';
import './App.css';
import './Screens.css';
import './Triage.css';
import { 
  ConsentScreen
} from './components';
import { Consent } from './types';
import { TodayScreen } from './TodayScreen';
import { TrendsScreen } from './TrendsScreen';
import { PlanScreen } from './PlanScreen';
import { ShareScreen } from './ShareScreen';
import { AboutScreen } from './AboutScreen';

/**
 * :App: entry point implementing the mobile-first layout and five-tab navigation.
 */

type TabId = 'Today' | 'Trends' | 'Plan' | 'Share' | 'About';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('Today');
  const [consent, setConsent] = useState<Consent | null>(() => {
    try {
      const saved = localStorage.getItem('aad_consent');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse aad_consent from localStorage", e);
      return null;
    }
  });

  const handleConsentSubmit = (newConsent: Consent) => {
    try {
      localStorage.setItem('aad_consent', JSON.stringify(newConsent));
      setConsent(newConsent);
    } catch (e) {
      alert("Error saving consent. Please ensure cookies/local storage are enabled.");
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Today': return <TodayScreen />;
      case 'Trends': return <TrendsScreen />;
      case 'Plan': return <PlanScreen />;
      case 'Share': return <ShareScreen />;
      case 'About': return <AboutScreen />;
      default: return null;
    }
  };

  const navItems: TabId[] = ['Today', 'Trends', 'Plan', 'Share', 'About'];

  if (!consent) {
    return (
      <div className="app-container">
        <ConsentScreen onComplete={handleConsentSubmit} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-circle" />
        <span className="header-title">An Apple a Day</span>
      </header>

      <main className="content-area">
        {renderScreen()}
      </main>

      <nav className="nav-bar">
        {navItems.map((tab) => (
          <button
            key={tab}
            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            aria-label={`Switch to ${tab} tab`}
          >
            <div className="nav-icon-placeholder" />
            <span>{tab}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};





export default App;