import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { AttendanceView } from './components/attendance/AttendanceView';
import { SessionView } from './components/setup/SetupView';
import { SwimmersView } from './components/swimmers/SwimmersView';
import { DeckView } from './components/deck/DeckView';
import { ResultsView } from './components/results/ResultsView';
import { ClubSetupView } from './components/club/ClubSetupView';
import { SessionModal } from './components/attendance/SessionModal';
import { WelcomeTourModal } from './components/common/WelcomeTourModal';
import { PoolModal } from './components/setup/PoolModal';
import { Toasts } from './components/common/Toasts';
import { SplashScreen } from './components/layout/SplashScreen';
import { PieMenu } from './components/layout/PieMenu';
import { HamburgerMenu } from './components/layout/HamburgerMenu';

interface MainContentProps {
  onOpenTour: () => void;
}

function MainContent({ onOpenTour }: MainContentProps) {
  const { currentView } = useApp();

  return (
    <main className="app-main">
      {currentView === 'attendance' && <AttendanceView />}
      {currentView === 'session' && <SessionView />}
      {currentView === 'swimmers' && <SwimmersView />}
      {currentView === 'deck' && <DeckView />}
      {currentView === 'results' && <ResultsView />}
      {currentView === 'club-setup' && <ClubSetupView onOpenTour={onOpenTour} />}
    </main>
  );
}

function AppShell() {
  const { isPoolModalOpen, closePoolModal } = useApp();
  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const [showSplash, setShowSplash] = useState(!isTestEnv);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
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
      <MainContent onOpenTour={() => setIsTourOpen(true)} />
      <Toasts />
      <PieMenu />
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenSessionModal={() => setIsSessionModalOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
      />
      {/* 1st Load Welcome Page & Guided Tour Modal */}
      <WelcomeTourModal
        isOpen={(!hasPromptedSession && !showSplash) || isTourOpen}
        onClose={() => {
          handleClosePrompt();
          setIsTourOpen(false);
        }}
        isInitialPrompt={!hasPromptedSession}
      />
      {/* Session Details Modal (when opened from hamburger menu or buttons) */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        isInitialPrompt={false}
      />
      <PoolModal
        isOpen={isPoolModalOpen}
        onClose={closePoolModal}
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
