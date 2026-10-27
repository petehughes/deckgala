import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import React, { useEffect } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AppProvider, useApp } from '../../context/AppContext';
import { SessionScheduleList } from './SessionScheduleList';
import { ClubCalendarView } from './ClubCalendarView';
import { HeadCoachBriefingCard } from '../setup/HeadCoachBriefingCard';

function SessionWithLoadedWeeklyPlan() {
  const { club, loadSessionFromSchedule } = useApp();

  useEffect(() => {
    const session = (club.scheduledSessions || []).find(s => s.id === 'sched-wed-8pm');
    if (session) {
      // 2026-10-28 is Wednesday in Week 44
      loadSessionFromSchedule(session, '2026-10-28');
    }
  }, [club.scheduledSessions, loadSessionFromSchedule]);

  return <HeadCoachBriefingCard />;
}

describe('Weekly Briefings & Set List Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders weekly briefings button on scheduled sessions and opens the modal', () => {
    render(
      <AppProvider>
        <SessionScheduleList />
      </AppProvider>
    );

    // Look for Weekly Sets & Briefings button
    const weeklyBtns = screen.getAllByRole('button', { name: /Weekly Sets & Briefings/i });
    expect(weeklyBtns.length).toBeGreaterThan(0);

    // Click the first one
    fireEvent.click(weeklyBtns[0]);

    // Modal title should appear
    expect(screen.getByText('Weekly Briefing & Set List')).toBeDefined();
    // Week pills should be visible
    expect(screen.getByText(/FAST TOUCH SET BUILDER/i)).toBeDefined();
  });

  it('allows cloning briefing and set list from the previous week', () => {
    render(
      <AppProvider>
        <SessionScheduleList />
      </AppProvider>
    );

    const weeklyBtns = screen.getAllByRole('button', { name: /Weekly Sets & Briefings/i });
    fireEvent.click(weeklyBtns[0]); // Wednesday performance session (has W43 and W44)

    // Find the Clone from Last Week button
    const cloneBtn = screen.getByRole('button', { name: /Clone from Last Week/i });
    expect(cloneBtn).toBeDefined();

    // Click clone
    fireEvent.click(cloneBtn);

    // Volume stat or set list items should be present
    expect(screen.getAllByText(/Free/i).length).toBeGreaterThan(0);
  });

  it('allows adding sets via Quick Add Presets and the Fast Touch Set Builder', () => {
    render(
      <AppProvider>
        <SessionScheduleList />
      </AppProvider>
    );

    const weeklyBtns = screen.getAllByRole('button', { name: /Weekly Sets & Briefings/i });
    fireEvent.click(weeklyBtns[0]);

    // Click a quick preset, e.g. "+ 16 x 25m Sprint Breakout"
    const sprintPreset = screen.getByRole('button', { name: /\+ 16 x 25m Sprint/i });
    fireEvent.click(sprintPreset);

    // Verify it appeared in the set list
    expect(screen.getAllByText(/16 x 25m/i).length).toBeGreaterThan(0);

    // Use Fast Touch Builder: select 8 reps, 200m, Fly, and tap "+ Add Set to Workout"
    const reps8 = screen.getByRole('button', { name: '8x' });
    fireEvent.click(reps8);

    const dist200 = screen.getByRole('button', { name: '200m' });
    fireEvent.click(dist200);

    const strokeFly = screen.getByRole('button', { name: 'Fly' });
    fireEvent.click(strokeFly);

    const addCustomBtn = screen.getByRole('button', { name: /\+ Add Set to Workout/i });
    fireEvent.click(addCustomBtn);

    // Verify the custom set is in the list
    expect(screen.getAllByText(/8 x 200m Fly/i).length).toBeGreaterThan(0);
  });

  it('allows reordering and duplicating set items with mobile touch buttons', () => {
    render(
      <AppProvider>
        <SessionScheduleList />
      </AppProvider>
    );

    const weeklyBtns = screen.getAllByRole('button', { name: /Weekly Sets & Briefings/i });
    fireEvent.click(weeklyBtns[0]);

    // Add two presets
    fireEvent.click(screen.getByRole('button', { name: /\+ Warm-Up/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ 10 x 100m Free/i }));

    // Find duplicate button
    const dupBtns = screen.getAllByLabelText('Duplicate set');
    const initialCount = screen.getAllByLabelText('Duplicate set').length;
    fireEvent.click(dupBtns[0]);

    expect(screen.getAllByLabelText('Duplicate set').length).toBe(initialCount + 1);
  });

  it('displays the week briefing and sets on the Club Calendar for that date', () => {
    render(
      <AppProvider>
        <ClubCalendarView />
      </AppProvider>
    );

    // Switch to a Wednesday (2026-10-28) where Wednesday Evening Performance runs
    const dateInput = screen.getByLabelText(/Select date/i);
    fireEvent.change(dateInput, { target: { value: '2026-10-28' } });

    // The calendar should display sessions and the Weekly Sets & Briefing button
    const weeklyCalendarBtns = screen.getAllByRole('button', { name: /Weekly Sets & Briefing/i });
    expect(weeklyCalendarBtns.length).toBeGreaterThan(0);
  });

  it('displays active weekly plan and clickable sets inside HeadCoachBriefingCard', () => {
    render(
      <AppProvider>
        <SessionWithLoadedWeeklyPlan />
      </AppProvider>
    );

    expect(screen.getByText(/WEEK 44 SCHEDULED/i)).toBeDefined();
    expect(screen.getByText(/WORKOUT SET LIST/i)).toBeDefined();
    expect(screen.getAllByText(/Free/i).length).toBeGreaterThan(0);

    // Click on a set card to activate it on timing deck
    const setCard = screen.getByLabelText(/Set 3:/i);
    expect(setCard).toBeDefined();
    fireEvent.click(setCard);

    // Active deck pill should show up
    expect(screen.getByText(/Active on Timing Deck/i)).toBeDefined();
  });
});
