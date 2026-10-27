import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { AttendanceView } from './components/attendance/AttendanceView';
import { SessionView } from './components/setup/SetupView';
import { SwimmersView } from './components/swimmers/SwimmersView';
import { DeckView } from './components/deck/DeckView';
import { ResultsView } from './components/results/ResultsView';
import { SessionModal } from './components/attendance/SessionModal';
import { Toasts } from './components/common/Toasts';
import { SplashScreen } from './components/layout/SplashScreen';
import { PieMenu } from './components/layout/PieMenu';
import { HamburgerMenu } from './components/layout/HamburgerMenu';

function MainContent() {
  const { currentView } = useApp();

  return (
    <main className="app-main">
      {currentView === 'attendance' && <AttendanceView />}
      {currentView === 'session' && <SessionView />}
      {currentView === 'swimmers' && <SwimmersView />}
      {currentView === 'deck' && <DeckView />}
      {currentView === 'results' && <ResultsView />}
    </main>
  );
}

function AppShell() {
  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const [showSplash, setShowSplash] = useState(!isTestEnv);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [hasPromptedSession, setHasPromptedSession] = useState(() => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem('deckgala_session_prompted') === 'true' || sessionStorage.getItem('aquapace_session_prompted') === 'true';
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
        sessionStorage.setItem('deckgala_session_prompted', 'true');
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="app-shell">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <Header onOpenMenu={() => setIsMenuOpen(true)} />
      <MainContent />
      <Toasts />
      <PieMenu />
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenSessionModal={() => setIsSessionModalOpen(true)}
      />
      <SessionModal
        isOpen={(!hasPromptedSession && !showSplash) || isSessionModalOpen}
        onClose={() => {
          handleClosePrompt();
          setIsSessionModalOpen(false);
        }}
        isInitialPrompt={!hasPromptedSession}
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

