import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AppProvider, useApp } from '../../context/AppContext';
import { PoolSelectorCard } from './PoolSelectorCard';
import { PoolModal } from './PoolModal';
import { SessionModal } from '../attendance/SessionModal';
import { SessionView } from './SetupView';

function TestSessionWrapper() {
  const { config } = useApp();
  return (
    <div>
      <div data-testid="current-lanes">{config.laneCount}</div>
      <div data-testid="current-course">{config.poolCourse}</div>
      <div data-testid="current-pool-id">{config.selectedPoolId}</div>
      <SessionView />
      <PoolModal isOpen={true} onClose={() => {}} />
    </div>
  );
}

describe('Swimming Pool Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders default pool in PoolSelectorCard and updates lanes when another pool is selected', () => {
    render(
      <AppProvider>
        <TestSessionWrapper />
      </AppProvider>
    );

    // Initial default is Main Competition Pool (6 lanes, 25m)
    expect(screen.getByTestId('current-lanes').textContent).toBe('6');
    expect(screen.getByTestId('current-course').textContent).toBe('25m');
    expect(screen.getByTestId('current-pool-id').textContent).toBe('pool-main-25m');

    // Find pool selector dropdown
    const select = screen.getByLabelText('Select Swimming Pool') as HTMLSelectElement;
    expect(select.value).toBe('pool-main-25m');

    // Change pool to Olympic Competition Pool (8 lanes, 50m)
    fireEvent.change(select, { target: { value: 'pool-olympic-50m' } });

    // Verify session lanes and course automatically synchronized!
    expect(screen.getByTestId('current-lanes').textContent).toBe('8');
    expect(screen.getByTestId('current-course').textContent).toBe('50m');
    expect(screen.getByTestId('current-pool-id').textContent).toBe('pool-olympic-50m');
  });

  it('allows adding a new swimming pool with custom lanes and length, and selects it', () => {
    render(
      <AppProvider>
        <TestSessionWrapper />
      </AppProvider>
    );

    // Fill out the pool modal form
    const poolNameInput = screen.getByLabelText(/Pool Facility Name/i);
    fireEvent.change(poolNameInput, { target: { value: 'Aquatic High-Performance Center' } });

    // Select 10 lanes
    const tenLanesBtn = screen.getByText('10 Lanes');
    fireEvent.click(tenLanesBtn);

    // Select 50m length
    const fiftyMeterBtn = screen.getByText('50m');
    fireEvent.click(fiftyMeterBtn);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Add Swimming Pool/i });
    fireEvent.click(submitBtn);

    // Verify that the new pool was added and immediately configured in the session
    expect(screen.getByTestId('current-lanes').textContent).toBe('10');
    expect(screen.getByTestId('current-course').textContent).toBe('50m');
    expect(screen.getAllByText('Aquatic High-Performance Center').length).toBeGreaterThan(0);
  });

  it('allows selecting pool inside SessionModal on session creation', () => {
    render(
      <AppProvider>
        <SessionModal isOpen={true} onClose={() => {}} />
        <TestSessionWrapper />
      </AppProvider>
    );

    const poolSelect = screen.getByLabelText(/Swimming Pool Facility/i) as HTMLSelectElement;
    expect(poolSelect).toBeTruthy();

    // Select outdoor 25y pool
    fireEvent.change(poolSelect, { target: { value: 'pool-outdoor-25y' } });

    // Submit session modal form
    const submitBtn = screen.getByRole('button', { name: /Save Session Details/i });
    fireEvent.click(submitBtn);

    // Verify session updated to 25y pool
    expect(screen.getByTestId('current-course').textContent).toBe('25y');
    expect(screen.getByTestId('current-pool-id').textContent).toBe('pool-outdoor-25y');
  });
});

