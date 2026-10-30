import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AppProvider, useApp } from '../../context/AppContext';
import { ClubSetupView } from './ClubSetupView';
import { SessionView } from '../setup/SetupView';

function ClubSetupTestWrapper() {
  const { club, config } = useApp();
  return (
    <div>
      <div data-testid="scheduled-count">{(club.scheduledSessions || []).length}</div>
      <div data-testid="coaches-count">{(club.coaches || []).length}</div>
      <div data-testid="closures-count">{(club.clubClosures || []).length}</div>
      <div data-testid="overrides-count">{(club.staffOverrides || []).length}</div>
      <div data-testid="current-coach">{config.assignedCoachId || 'none'}</div>
      <ClubSetupView />
      <SessionView />
    </div>
  );
}

describe('Club Setup, Calendar, Staffing & Head Coach Briefing', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Calendar view with scheduled sessions and displays club closure banner during holiday', () => {
    render(
      <AppProvider>
        <ClubSetupTestWrapper />
      </AppProvider>
    );

    // Initial default shows club closures (e.g. Christmas)
    expect(screen.getByText('Christmas & New Year Holiday Closure')).toBeDefined();
    expect(screen.getByText(/Annual facility holiday shutdown/i)).toBeDefined();

    // Change date to Christmas break: 2026-12-25
    const dateInput = screen.getByLabelText('Select date');
    fireEvent.change(dateInput, { target: { value: '2026-12-25' } });

    // Active closure alert banner should be prominently visible
    expect(screen.getByText('CLUB FACILITY CLOSED')).toBeDefined();
    expect(screen.getByText(/Closed from 2026-12-24 to 2027-01-02/i)).toBeDefined();
  });

  it('allows creating a new weekly session schedule with Head Coach briefing expectations', () => {
    render(
      <AppProvider>
        <ClubSetupTestWrapper />
      </AppProvider>
    );

    // Switch to Session Schedules tab
    const schedTab = screen.getByRole('tab', { name: /Session Schedules/i });
    fireEvent.click(schedTab);

    // Click "+ Create Session Schedule" button
    const createBtn = screen.getByText('+ Create Session Schedule');
    fireEvent.click(createBtn);

    // Fill form
    const titleInput = screen.getByLabelText(/Session Title/i);
    fireEvent.change(titleInput, { target: { value: 'Wednesday 8pm High-Intensity Threshold' } });

    // Select Wednesday
    const wedBtn = screen.getByRole('button', { name: /Wednesday/i });
    fireEvent.click(wedBtn);

    // Switch to Coach Briefing tab
    fireEvent.click(screen.getByRole('tab', { name: /Coach Briefing/i }));

    // Enter Head Coach Briefing details (what is to be expected)
    const notesInput = screen.getByLabelText(/Details on What is to be Expected/i);
    fireEvent.change(notesInput, {
      target: {
        value: 'Swimmers expected to hold 1:12 pace on 100m, tight streamline turns, fins and paddles required.'
      }
    });

    // Save using the submit button inside the modal
    const saveBtn = screen.getByRole('button', { name: /^Create Session Schedule$/i });
    fireEvent.click(saveBtn);

    // Verify session schedule is added
    expect(screen.getByText('Wednesday 8pm High-Intensity Threshold')).toBeDefined();
    expect(screen.getByText(/hold 1:12 pace on 100m/i)).toBeDefined();
  });

  it('allows providing staffing cover override for an instance when a coach is on holiday', () => {
    render(
      <AppProvider>
        <ClubSetupTestWrapper />
      </AppProvider>
    );

    // Go to Calendar view
    const calTab = screen.getByRole('tab', { name: /Club Calendar/i });
    fireEvent.click(calTab);

    // Set date to a Monday (2026-11-09)
    const dateInput = screen.getByLabelText('Select date');
    fireEvent.change(dateInput, { target: { value: '2026-11-09' } });

    // Verify Monday Morning session is scheduled
    expect(screen.getByText('Monday Morning Early Aerobic Base')).toBeDefined();

    // Click "Override / Cover Staff" (or "Edit Cover Staff")
    const coverBtns = screen.getAllByText(/Cover Staff/i);
    fireEvent.click(coverBtns[0]);

    // Select Marcus Vance as covering coach
    const coachSelect = screen.getByLabelText(/Covering Staff \/ Coach/i);
    fireEvent.change(coachSelect, { target: { value: 'coach-marcus' } });

    // Select Reason
    const reasonSelect = screen.getByLabelText(/Reason for Cover/i);
    fireEvent.change(reasonSelect, { target: { value: 'Holiday / Annual Leave' } });

    // Save override
    const saveBtn = screen.getByRole('button', { name: /Save Staff Cover|Update Override/i });
    fireEvent.click(saveBtn);

    // Verify staff cover badge is active
    expect(screen.getAllByText(/Staff Cover Active/i).length).toBeGreaterThan(0);
  });

  it('allows managing club coaches in Staffing tab', () => {
    render(
      <AppProvider>
        <ClubSetupTestWrapper />
      </AppProvider>
    );

    // Switch to Staffing & Coaches tab
    const staffTab = screen.getByRole('tab', { name: /Staffing & Coaches/i });
    fireEvent.click(staffTab);

    // Verify Head Coach Sarah Jenkins is listed
    expect(screen.getAllByText('Coach Sarah Jenkins').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Head Coach').length).toBeGreaterThan(0);

    // Click "+ Add Club Coach"
    fireEvent.click(screen.getByText('+ Add Club Coach'));

    // Fill form
    const nameInput = screen.getByLabelText(/Coach Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Coach Michael Phelps' } });

    // Save
    fireEvent.click(screen.getByRole('button', { name: /^Add Coach$/i }));

    // Verify coach added
    expect(screen.getByText('Coach Michael Phelps')).toBeDefined();
  });

  it('displays Head Coach briefing and assigned coach in SessionView', () => {
    render(
      <AppProvider>
        <ClubSetupTestWrapper />
      </AppProvider>
    );

    // In SessionView, HeadCoachBriefingCard should be present
    expect(screen.getAllByText('HEAD COACH BRIEFING').length).toBeGreaterThan(0);
    expect(screen.getByText(/Session Expectations & Focus/i)).toBeDefined();
    expect(screen.getByText(/LEAD COACH:/i)).toBeDefined();
  });

  it('navigates through create session wizard steps with Next, Back, and step tabs, and uses templates', () => {
    render(
      <AppProvider>
        <ClubSetupTestWrapper />
      </AppProvider>
    );

    // Switch to Session Schedules tab
    const schedTab = screen.getByRole('tab', { name: /Session Schedules/i });
    fireEvent.click(schedTab);

    // Click "+ Create Session Schedule" button
    fireEvent.click(screen.getByText('+ Create Session Schedule'));

    // Step 1: Trying to advance without title triggers validation
    const nextBtn1 = screen.getByRole('button', { name: /Next: Pool & Squads/i });
    fireEvent.click(nextBtn1);
    expect(screen.getByText(/Please enter a session title/i)).toBeDefined();

    // Enter title
    const titleInput = screen.getByLabelText(/Session Title/i);
    fireEvent.change(titleInput, { target: { value: 'Thursday Sprint Power' } });

    // Click Next to advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next: Pool & Squads/i }));

    // Verify on Step 2 (Pool & Squads visible)
    expect(screen.getByRole('button', { name: /Next: Coach Briefing/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /← Back/i })).toBeDefined();

    // Click Back to return to Step 1
    fireEvent.click(screen.getByRole('button', { name: /← Back/i }));
    expect(screen.getByRole('button', { name: /Next: Pool & Squads/i })).toBeDefined();

    // Click Step 3 tab directly
    fireEvent.click(screen.getByRole('tab', { name: /Coach Briefing/i }));

    // Use Quick Focus suggestion chip
    fireEvent.click(screen.getByRole('button', { name: /\+ Speed & Starts/i }));
    const focusInput = screen.getByLabelText(/Target Focus Area/i) as HTMLInputElement;
    expect(focusInput.value).toBe('Speed & Starts');

    // Use Briefing template chip
    fireEvent.click(screen.getByRole('button', { name: /\+ Distance Set/i }));
    const notesInput = screen.getByLabelText(/Details on What is to be Expected/i) as HTMLTextAreaElement;
    expect(notesInput.value).toContain('10x100m Free holding steady aerobic pace');

    // Submit wizard
    fireEvent.click(screen.getByRole('button', { name: /^Create Session Schedule$/i }));

    // Verify created session in schedule list
    expect(screen.getByText('Thursday Sprint Power')).toBeDefined();
  });
});

