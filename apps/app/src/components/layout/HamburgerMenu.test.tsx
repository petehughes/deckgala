import React from 'react';
import { describe, it, expect, afterEach } from 'bun:test';
import { render, fireEvent, cleanup, within } from '@testing-library/react';
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
    expect(view.getByText('AquaTeamHub')).toBeDefined();

    // Active session card
    expect(view.getByText('ACTIVE SESSION')).toBeDefined();
    expect(view.getByText('Edit')).toBeDefined();

    // Deck navigation links under TIMING & DECKS
    const timingNav = view.getByRole('navigation', { name: 'Deck Timing Views' });
    expect(within(timingNav).getByText('Pool Deck')).toBeDefined();
    expect(within(timingNav).getByText('Attendance')).toBeDefined();
    expect(within(timingNav).getByText('Session')).toBeDefined();
    expect(within(timingNav).getByText('Results & Splits')).toBeDefined();
    expect(within(timingNav).queryByText('Swimmers & Squads')).toBeNull();

    // Club Setup items under CLUB SETUP (Swimmers & Squads moved here)
    const clubNav = view.getByRole('navigation', { name: 'Club Setup Sections' });
    expect(within(clubNav).getByText('Swimmers & Squads')).toBeDefined();
    expect(within(clubNav).getByText('Club Profile & Name')).toBeDefined();
    expect(within(clubNav).getByText('Club Calendar')).toBeDefined();
    expect(within(clubNav).getByText('Session Schedules')).toBeDefined();
    expect(within(clubNav).getByText('Staffing & Coaches')).toBeDefined();
    expect(within(clubNav).getByText('Pool Setup')).toBeDefined();

    // Clicking Swimmers link triggers selection and closes drawer
    const swimmersLink = within(clubNav).getByText('Swimmers & Squads');
    fireEvent.click(swimmersLink);
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
        <HamburgerMenu
          isOpen={true}
          onClose={() => {
            closed = true;
          }}
        />
      </AppProvider>
    );

    const closeBtn = view.getByLabelText('Close navigation menu');
    fireEvent.click(closeBtn);
    expect(closed).toBe(true);
  });
});
