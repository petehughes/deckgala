import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { AttendanceView } from './components/attendance/AttendanceView';
import { SetupView } from './components/setup/SetupView';
import { SwimmersView } from './components/swimmers/SwimmersView';
import { DeckView } from './components/deck/DeckView';
import { ResultsView } from './components/results/ResultsView';
import { SessionModal } from './components/attendance/SessionModal';
import { Toasts } from './components/common/Toasts';

function MainContent() {
  const { currentView } = useApp();

  return (
    <main className="app-main">
      {currentView === 'attendance' && <AttendanceView />}
      {currentView === 'setup' && <SetupView />}
      {currentView === 'swimmers' && <SwimmersView />}
      {currentView === 'deck' && <DeckView />}
      {currentView === 'results' && <ResultsView />}
    </main>
  );
}

function AppShell() {
  const [hasPromptedSession, setHasPromptedSession] = useState(() => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem('aquapace_session_prompted') === 'true';
      }
    } catch {
      // Ignore storage errors
    }
    return false;
  });

  const handleClosePrompt = () => {
    setHasPromptedSession(true);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('aquapace_session_prompted', 'true');
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="app-shell">
      <Header />
      <MainContent />
      <Toasts />
      <SessionModal
        isOpen={!hasPromptedSession}
        onClose={handleClosePrompt}
        isInitialPrompt
      />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;

