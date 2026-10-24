import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { SetupView } from './components/setup/SetupView';
import { SwimmersView } from './components/swimmers/SwimmersView';
import { DeckView } from './components/deck/DeckView';
import { ResultsView } from './components/results/ResultsView';
import { Toasts } from './components/common/Toasts';

function MainContent() {
  const { currentView } = useApp();

  return (
    <main className="app-main">
      {currentView === 'setup' && <SetupView />}
      {currentView === 'swimmers' && <SwimmersView />}
      {currentView === 'deck' && <DeckView />}
      {currentView === 'results' && <ResultsView />}
    </main>
  );
}

export function App() {
  return (
    <AppProvider>
      <div className="app-shell">
        <Header />
        <MainContent />
        <Toasts />
      </div>
    </AppProvider>
  );
}

export default App;

