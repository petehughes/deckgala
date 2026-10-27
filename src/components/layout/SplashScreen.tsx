import React, { useEffect, useState } from 'react';
import logoUrl from '../../assets/logo.svg';

export interface SplashScreenProps {
  durationMs?: number;
  fadeDurationMs?: number;
  onFinish?: () => void;
}

export function SplashScreen({
  durationMs = 2000,
  fadeDurationMs = 500,
  onFinish
}: SplashScreenProps) {
  const [isFading, setIsFading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
    }, durationMs);

    const removeTimer = setTimeout(() => {
      setIsDone(true);
      onFinish?.();
    }, durationMs + fadeDurationMs);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [durationMs, fadeDurationMs, onFinish]);

  if (isDone) return null;

  return (
    <div
      className={`splash-overlay ${isFading ? 'splash-fade-out' : ''}`}
      aria-label="DeckGala Splash Screen"
      role="dialog"
      aria-modal="true"
    >
      <div className="splash-content">
        <div className="splash-logo-container">
          <img
            src={logoUrl}
            alt="DeckGala Logo"
            className="splash-logo-img"
            width="84"
            height="84"
          />
        </div>
        <h1 className="splash-title">DeckGala</h1>
        <p className="splash-tagline">Offline deck timing. Seamless meet management.</p>
        <div className="splash-loading-bar" aria-hidden="true">
          <div className="splash-loading-fill" />
        </div>
      </div>
    </div>
  );
}

