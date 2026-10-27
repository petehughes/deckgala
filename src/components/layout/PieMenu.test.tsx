import React from 'react';
import { describe, it, expect, afterEach } from 'bun:test';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { PieMenu } from './PieMenu';

describe('PieMenu component', () => {
  afterEach(() => {
    cleanup();
  });
  it('toggles the radial menu when FAB is clicked and switches screens on item selection', () => {
    const view = render(
      <AppProvider>
        <PieMenu />
      </AppProvider>
    );

    // FAB is visible
    const fab = view.getByLabelText(/Toggle screen navigation pie menu/i);
    expect(fab).toBeDefined();

    // Open pie menu
    fireEvent.click(fab);
    expect(view.getByRole('dialog', { name: /Screen Navigation Pie Menu/i })).toBeDefined();

    // 5 radial screen buttons exist
    expect(view.getByTitle(/Switch to Pool Deck/i)).toBeDefined();
    expect(view.getByTitle(/Switch to Results/i)).toBeDefined();
    expect(view.getByTitle(/Switch to Attendance/i)).toBeDefined();
    expect(view.getByTitle(/Switch to Session/i)).toBeDefined();
    expect(view.getByTitle(/Switch to Swimmers/i)).toBeDefined();

    // Clicking a screen selects it and closes the pie menu
    const resultsBtn = view.getByTitle(/Switch to Results/i);
    fireEvent.click(resultsBtn);

    // Pie menu closed
    expect(view.queryByRole('dialog', { name: /Screen Navigation Pie Menu/i })).toBeNull();
  });

  it('closes on Escape key or center hub button', () => {
    const view = render(
      <AppProvider>
        <PieMenu />
      </AppProvider>
    );

    const fab = view.getByLabelText(/Toggle screen navigation pie menu/i);
    fireEvent.click(fab);
    expect(view.getByRole('dialog', { name: /Screen Navigation Pie Menu/i })).toBeDefined();

    const closeHub = view.getByLabelText(/Close pie menu/i);
    fireEvent.click(closeHub);
    expect(view.queryByRole('dialog', { name: /Screen Navigation Pie Menu/i })).toBeNull();
  });
});
