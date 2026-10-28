import React, { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { CoachSelector } from './CoachSelector';

function TestCoachSelectorWrapper({ multiple = false }: { multiple?: boolean }) {
  const [val, setVal] = useState<string | string[]>(multiple ? [] : '');

  return (
    <div>
      <div data-testid="selected-value">{Array.isArray(val) ? val.join(', ') : val}</div>
      <CoachSelector
        id="test-coach-selector"
        label="Select Test Coach"
        multiple={multiple}
        valueKey="name"
        value={val}
        onChange={nextVal => setVal(nextVal)}
        allowCustomInput={true}
      />
    </div>
  );
}

describe('CoachSelector Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('allows selecting a single coach in single mode and updates value', () => {
    render(
      <AppProvider>
        <TestCoachSelectorWrapper multiple={false} />
      </AppProvider>
    );

    // Initial state is empty
    expect(screen.getByTestId('selected-value').textContent).toBe('');

    // Coaches are rendered as pills with initials and roles
    expect(screen.getByText('Coach Sarah Jenkins')).toBeDefined();
    expect(screen.getByText('Coach Marcus Vance')).toBeDefined();

    // Click on Coach Marcus Vance
    fireEvent.click(screen.getByText('Coach Marcus Vance'));
    expect(screen.getByTestId('selected-value').textContent).toBe('Coach Marcus Vance');

    // Click on Coach Sarah Jenkins to switch
    fireEvent.click(screen.getByText('Coach Sarah Jenkins'));
    expect(screen.getByTestId('selected-value').textContent).toBe('Coach Sarah Jenkins');
  });

  it('allows selecting multiple coaches and supports Select All and Clear', () => {
    render(
      <AppProvider>
        <TestCoachSelectorWrapper multiple={true} />
      </AppProvider>
    );

    // Select Marcus
    fireEvent.click(screen.getByText('Coach Marcus Vance'));
    expect(screen.getByTestId('selected-value').textContent).toContain('Coach Marcus Vance');

    // Also select Elena
    fireEvent.click(screen.getByText('Coach Elena Rostova'));
    expect(screen.getByTestId('selected-value').textContent).toContain('Coach Marcus Vance');
    expect(screen.getByTestId('selected-value').textContent).toContain('Coach Elena Rostova');
    expect(screen.getByText('2 selected')).toBeDefined();

    // Deselect Marcus
    fireEvent.click(screen.getByText('Coach Marcus Vance'));
    expect(screen.getByTestId('selected-value').textContent).toBe('Coach Elena Rostova');
    expect(screen.getByText('1 selected')).toBeDefined();

    // Click Select All
    fireEvent.click(screen.getByRole('button', { name: /Select All/i }));
    expect(screen.getByText('4 selected')).toBeDefined();

    // Click Clear
    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));
    expect(screen.getByText('0 selected')).toBeDefined();
    expect(screen.getByTestId('selected-value').textContent).toBe('');
  });

  it('allows adding a custom coach name via custom input', () => {
    render(
      <AppProvider>
        <TestCoachSelectorWrapper multiple={true} />
      </AppProvider>
    );

    const input = screen.getByPlaceholderText(/Custom coach name/i);
    fireEvent.change(input, { target: { value: 'Guest Coach Bob Bowman' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByTestId('selected-value').textContent).toContain('Guest Coach Bob Bowman');
    expect(screen.getAllByText('Guest Coach Bob Bowman').length).toBeGreaterThan(0);
  });
});
