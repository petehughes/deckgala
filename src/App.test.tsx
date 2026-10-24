import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { App } from './App';

describe('AquaPace React App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Setup tab by default and switches between Setup, Swimmers, Pool Deck, and Results tabs', () => {
    const view = render(<App />);

    expect(view.getByText('Active Lanes')).toBeDefined();
    expect(view.getByText('Session Squads in the Water')).toBeDefined();

    // Navigate to Swimmers tab
    const swimmersTab = view.getByRole('tab', { name: /Swimmers/i });
    fireEvent.click(swimmersTab);

    expect(view.getByText('SWIMMING GROUPS')).toBeDefined();
    expect(view.getAllByText('Senior Performance').length).toBeGreaterThan(0);
    expect(view.getByText('Alex Rivera')).toBeDefined();

    // Navigate to Pool Deck tab
    const deckTab = view.getByRole('tab', { name: /Pool Deck/i });
    fireEvent.click(deckTab);

    expect(view.getByText('START SET')).toBeDefined();
    expect(view.getByText('LAST SPLITS')).toBeDefined();

    // Navigate to Results tab
    const resultsTab = view.getByRole('tab', { name: /Results/i });
    fireEvent.click(resultsTab);

    expect(view.getByText('Total Swims Recorded')).toBeDefined();
    expect(view.getByText('No Splits Recorded Yet')).toBeDefined();
  });

  it('allows starting the stopwatch on Pool Deck and recording a swimmer split into Results', () => {
    const view = render(<App />);

    const deckTab = view.getByRole('tab', { name: /Pool Deck/i });
    fireEvent.click(deckTab);

    const startBtn = view.getByText('START SET');
    fireEvent.click(startBtn);

    // Wave 1 swimmers should now be in water (e.g. Alex Rivera in Lane 1)
    const stopButtons = view.getAllByText('TAP TO STOP FINISH');
    expect(stopButtons.length).toBeGreaterThan(0);

    // Stop Lane 1 lead swimmer
    fireEvent.click(stopButtons[0]);

    // Navigate to Results tab and verify 1 split recorded
    const resultsTab = view.getByRole('tab', { name: /Results/i });
    fireEvent.click(resultsTab);

    expect(view.getByText('Alex Rivera')).toBeDefined();
  });

  it('allows creating a new group and adding a swimmer in the Swimmers tab, then selecting them in Setup', () => {
    const view = render(<App />);

    // Go to Swimmers tab
    fireEvent.click(view.getByRole('tab', { name: /Swimmers/i }));

    // Open New Group modal
    fireEvent.click(view.getByText('New Group'));
    const groupInput = view.getByPlaceholderText(/Senior Performance Squad/i);
    fireEvent.change(groupInput, { target: { value: 'Regional Sprint Squad' } });
    fireEvent.click(view.getByText('Save Group'));

    expect(view.getAllByText('Regional Sprint Squad').length).toBeGreaterThan(0);

    // Add a swimmer to this new group
    const addSwimmerBtns = view.getAllByText('+ Add Swimmer');
    fireEvent.click(addSwimmerBtns[0]);

    const nameInput = view.getByPlaceholderText(/Jordan Taylor/i);
    fireEvent.change(nameInput, { target: { value: 'Sarah Sjostrom' } });
    fireEvent.click(view.getByText('Save Swimmer'));

    expect(view.getByText('Sarah Sjostrom')).toBeDefined();

    // Go back to Setup tab and verify the new group is selected and Sarah Sjostrom is in the lane dropdown
    fireEvent.click(view.getByRole('tab', { name: /Setup/i }));
    expect(view.getByText('Regional Sprint Squad')).toBeDefined();

    const lane1Select = view.getByLabelText('Select swimmer for Lane 1') as HTMLSelectElement;
    fireEvent.change(lane1Select, { target: { value: 'Sarah Sjostrom' } });

    expect(view.getAllByText('Sarah Sjostrom').length).toBeGreaterThan(0);
  });

  it('shows Release All Lanes in Coach Manual Push Release mode and releases next wave across all lanes', () => {
    const view = render(<App />);

    // In Setup tab, select Coach Manual Push Release mode
    const manualModeCard = view.getByText(/Coach Manual Push Release/i);
    fireEvent.click(manualModeCard);

    // Navigate to Pool Deck tab
    fireEvent.click(view.getByRole('tab', { name: /Pool Deck/i }));

    // Verify "Release All Lanes" button is present
    const releaseAllBtns = view.getAllByText('Release All Lanes');
    expect(releaseAllBtns.length).toBeGreaterThan(0);

    // Start set (launches Wave 1)
    fireEvent.click(view.getByText('START SET'));

    // Verify Wave 1 swimmers in water
    expect(view.getAllByText('TAP TO STOP FINISH').length).toBeGreaterThan(0);

    // Click "Release All Lanes" to push Wave 2 across all active lanes
    fireEvent.click(releaseAllBtns[0]);

    // Check that queues now show W2 swimmers in the water (e.g. Sam Chen in Lane 1)
    expect(view.getByText('Sam Chen')).toBeDefined();
  });
});
