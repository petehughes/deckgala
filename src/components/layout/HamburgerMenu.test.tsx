import React from 'react';
import { describe, it, expect, afterEach } from 'bun:test';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { HamburgerMenu } from './HamburgerMenu';

describe('HamburgerMenu component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders navigation links and active session details when open', () => {
    let closed = false;
    let editSessionClicked = false;

    const view = render(
      <AppProvider>
        <HamburgerMenu
          isOpen={true}
          onClose={() => {
            closed = true;
          }}
          onOpenSessionModal={() => {
            editSessionClicked = true;
          }}
        />
      </AppProvider>
    );

    // Header and brand
    expect(view.getByLabelText('Navigation Menu')).toBeDefined();
    expect(view.getByText('DeckGala')).toBeDefined();

    // Active session card
    expect(view.getByText('ACTIVE SESSION')).toBeDefined();
    expect(view.getByText('Edit')).toBeDefined();

    // Screen navigation links
    expect(view.getByText('Pool Deck')).toBeDefined();
    expect(view.getByText('Attendance')).toBeDefined();
    expect(view.getByRole('button', { name: /Session/i })).toBeDefined();
    expect(view.getByText('Swimmers & Squads')).toBeDefined();
    expect(view.getByText('Results & Splits')).toBeDefined();

    // Clicking a screen link selects it and triggers onClose
    const deckLink = view.getByText('Pool Deck');
    fireEvent.click(deckLink);
    expect(closed).toBe(true);

    // Clicking edit session triggers edit callback
    const editBtn = view.getByText('Edit');
    fireEvent.click(editBtn);
    expect(editSessionClicked).toBe(true);
  });

  it('does not render when isOpen is false', () => {
    const view = render(
      <AppProvider>
        <HamburgerMenu isOpen={false} onClose={() => {}} />
      </AppProvider>
    );

    expect(view.queryByLabelText('Navigation Menu')).toBeNull();
  });

  it('closes on close button click', () => {
    let closed = false;
    const view = render(
      <AppProvider>
        <HamburgerMenu isOpen={true} onClose={() => { closed = true; }} />
      </AppProvider>
    );

    const closeBtn = view.getByLabelText('Close navigation menu');
    fireEvent.click(closeBtn);
    expect(closed).toBe(true);
  });
});

