import React from 'react';
import { describe, it, expect } from 'bun:test';
import { render, act } from '@testing-library/react';
import { SplashScreen } from './SplashScreen';

describe('SplashScreen component', () => {
  it('renders logo, title, and tagline, then triggers fade after duration', async () => {
    let finished = false;
    const view = render(
      <SplashScreen
        durationMs={50}
        fadeDurationMs={20}
        onFinish={() => {
          finished = true;
        }}
      />
    );

    // Initial render displays title and tagline
    expect(view.getByLabelText('AquaTeamHub Splash Screen')).toBeDefined();
    expect(view.getByText('AquaTeamHub')).toBeDefined();
    expect(view.getByText('Offline deck timing. Seamless meet management.')).toBeDefined();

    // Fast-forward past duration
    await act(async () => {
      await new Promise(r => setTimeout(r, 100));
    });

    expect(finished).toBe(true);
  });
});

