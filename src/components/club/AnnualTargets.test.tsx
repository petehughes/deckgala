import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { AnnualTargetsTab } from './AnnualTargetsTab';
import { SwimmerPBModal } from '../swimmers/SwimmerPBModal';
import type { Swimmer } from '../../types';

describe('Annual Targets & Swimmer Personal Bests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Annual Targets tab with KPI summary cards and subtabs', () => {
    render(
      <AppProvider>
        <AnnualTargetsTab />
      </AppProvider>
    );

    expect(screen.getByText('Qualifiers Achieved')).toBeDefined();
    expect(screen.getByText('Close to Qualifying')).toBeDefined();
    expect(screen.getByText('Target Standards')).toBeDefined();
    expect(screen.getByText('Club Qualifiers & Target Tracker')).toBeDefined();
    expect(screen.getByText('Entry Requirements & Standards')).toBeDefined();
  });

  it('allows switching to Entry Requirements & Standards and displays target list', async () => {
    render(
      <AppProvider>
        <AnnualTargetsTab />
      </AppProvider>
    );

    const standardsTabBtn = screen.getByText('Entry Requirements & Standards');
    fireEvent.click(standardsTabBtn);

    expect(screen.getByText('Add Target Standard')).toBeDefined();
    expect(screen.getByText('Reset to Defaults')).toBeDefined();
    expect(screen.getAllByText(/County Championships 2026/i).length).toBeGreaterThan(0);
  });

  it('filters standards by level and distance', () => {
    render(
      <AppProvider>
        <AnnualTargetsTab />
      </AppProvider>
    );

    fireEvent.click(screen.getByText('Entry Requirements & Standards'));

    const levelSelect = screen.getByLabelText(/Level:/i) as HTMLSelectElement;
    fireEvent.change(levelSelect, { target: { value: 'national' } });

    expect(screen.getAllByText(/National Championships 2026/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/County Championships 2026/i)).toBeNull();
  });

  it('allows adding a new target standard via AnnualTargetModal', async () => {
    render(
      <AppProvider>
        <AnnualTargetsTab />
      </AppProvider>
    );

    fireEvent.click(screen.getByText('Entry Requirements & Standards'));
    fireEvent.click(screen.getByRole('button', { name: /Add Target Standard/i }));

    const compNameInput = screen.getByLabelText(/Competition Name \*/i);
    fireEvent.change(compNameInput, { target: { value: 'Dorset County Championships 2026' } });

    const timeInput = screen.getByLabelText(/Automatic Qualifying Time \(QT\) \*/i);
    fireEvent.change(timeInput, { target: { value: '1:01.20' } });

    const submitBtn = screen.getByRole('button', { name: /Create Target Standard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Dorset County Championships 2026')).toBeDefined();
    });
  });

  it('allows opening SwimmerPBModal and updating personal bests for 100m+ events', async () => {
    const swimmer: Swimmer = {
      id: 'sw-test-1',
      name: 'Alex Rivera',
      age: 14,
      gender: 'male',
      personalBests: []
    };

    render(
      <AppProvider>
        <SwimmerPBModal
          isOpen={true}
          onClose={() => {}}
          swimmer={swimmer}
        />
      </AppProvider>
    );

    expect(screen.getByText(/Personal Bests & Target Standards: Alex Rivera/i)).toBeDefined();
    expect(screen.getByRole('tab', { name: /Freestyle/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Backstroke/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Breaststroke/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Butterfly/i })).toBeDefined();

    // Find 100m Freestyle input
    const input100Free = document.getElementById('pb-Freestyle-100') as HTMLInputElement;
    expect(input100Free).toBeDefined();
    fireEvent.change(input100Free, { target: { value: '1:02.00' } });

    const saveBtn = screen.getByRole('button', { name: /Save Personal Bests/i });
    fireEvent.click(saveBtn);
  });
});
