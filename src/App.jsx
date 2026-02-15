import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import ConfigPage from './components/ConfigPage';
import IAPage from './components/IAPage';
import AssignmentPage from './components/AssignmentPage';
import SEEPage from './components/SEEPage';
import IndirectPage from './components/IndirectPage';
import SummaryPage from './components/SummaryPage';

const TABS = [
  { key: 'config', label: 'Configuration' },
  { key: 'ia', label: 'IA Tests' },
  { key: 'assignment', label: 'Assignments' },
  { key: 'see', label: 'SEE' },
  { key: 'indirect', label: 'Indirect Assessment' },
  { key: 'summary', label: 'CO Attainment Summary' },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState('config');
  const { config } = useApp();

  return (
    <div className="app">
      <header className="header">
        <h1>CO Attainment Calculator</h1>
        <p>
          {config.courseName} ({config.courseCode}) &mdash; {config.semester} &mdash; {config.academicYear}
        </p>
      </header>

      <nav className="nav-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {activeTab === 'config' && <ConfigPage />}
        {activeTab === 'ia' && <IAPage />}
        {activeTab === 'assignment' && <AssignmentPage />}
        {activeTab === 'see' && <SEEPage />}
        {activeTab === 'indirect' && <IndirectPage />}
        {activeTab === 'summary' && <SummaryPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
