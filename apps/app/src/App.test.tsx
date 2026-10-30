import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, fireEvent, cleanup, RenderResult } from '@testing-library/react';
import { App } from './App';

function navigateTo(view: RenderResult, label: string) {
  const menuBtn = view.getByRole('button', { name: /Open main menu/i });
  fireEvent.click(menuBtn);
  const navBtn = view.getByText(label);
  fireEvent.click(navBtn);
}

describe('AquaTeamHub React App', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('prompts user for session details on start and opens Attendance screen before Session', () => {
    const view = render(<App />);

    // Verify initial SessionModal is shown on startup
    expect(view.getByText('Welcome to AquaTeamHub — Start Session')).toBeDefined();

    // Confirm session details
    const beginBtn = view.getByText(/Begin Session & Attendance/i);
    fireEvent.click(beginBtn);

    // Lands on Attendance tab by default (before Setup)
    expect(view.getByText('ACTIVE SESSION')).toBeDefined();
    expect(view.getByText('Swimmer Attendance Checklist')).toBeDefined();
    expect(view.getByText('Marked Present')).toBeDefined();

    // Navigate to Setup tab via Hamburger Menu
    navigateTo(view, 'Session');
    expect(view.getByText('Active Lanes')).toBeDefined();
    expect(view.getByText('Session Squads in the Water')).toBeDefined();

    // Navigate to Swimmers tab
    navigateTo(view, 'Swimmers & Squads');
    expect(view.getByText('SWIMMING GROUPS')).toBeDefined();
    expect(view.getAllByText('Senior Performance').length).toBeGreaterThan(0);

    // Navigate to Pool Deck tab
    navigateTo(view, 'Pool Deck');
    expect(view.getByText('START SET')).toBeDefined();

    // Navigate to Results tab
    navigateTo(view, 'Results & Splits');
    expect(view.getByText('Total Swims Recorded')).toBeDefined();
  });

  it('allows starting the stopwatch on Pool Deck and records session name in Results output', () => {
    sessionStorage.setItem('deckgala_session_prompted', 'true');
    const view = render(<App />);

    navigateTo(view, 'Pool Deck');

    const startBtn = view.getByText('START SET');
    fireEvent.click(startBtn);

    // Wave 1 swimmers should now be in water (e.g. Alex Rivera in Lane 1)
    const stopButtons = view.getAllByText('TAP TO STOP FINISH');
    expect(stopButtons.length).toBeGreaterThan(0);

    // Stop Lane 1 lead swimmer
    fireEvent.click(stopButtons[0]);

    // Navigate to Results tab and verify 1 split recorded with session name
    navigateTo(view, 'Results & Splits');

    expect(view.getByText('Alex Rivera')).toBeDefined();
    expect(view.getAllByText(/Morning Training Session/i).length).toBeGreaterThan(0);
  });

  it('allows creating a new group and adding a swimmer in the Swimmers tab, then selecting them in Setup', () => {
    sessionStorage.setItem('deckgala_session_prompted', 'true');
    const view = render(<App />);

    // Go to Swimmers tab
    navigateTo(view, 'Swimmers & Squads');

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
    navigateTo(view, 'Session');
    expect(view.getByText('Regional Sprint Squad')).toBeDefined();

    const lane1Select = view.getByLabelText('Select swimmer for Lane 1') as HTMLSelectElement;
    fireEvent.change(lane1Select, { target: { value: 'Sarah Sjostrom' } });

    expect(view.getAllByText('Sarah Sjostrom').length).toBeGreaterThan(0);
  });

  it('shows Release All Lanes in Coach Manual Push Release mode and releases next wave across all lanes', () => {
    sessionStorage.setItem('deckgala_session_prompted', 'true');
    const view = render(<App />);

    // Navigate to Setup tab and select Coach Manual Push Release mode
    navigateTo(view, 'Session');
    const manualModeCard = view.getByText(/Coach Manual Push Release/i);
    fireEvent.click(manualModeCard);

    // Navigate to Pool Deck tab
    navigateTo(view, 'Pool Deck');

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

  it('only shows present swimmers in the lane assignment picker dropdown and excludes absent swimmers', () => {
    sessionStorage.setItem('deckgala_session_prompted', 'true');
    const view = render(<App />);

    // Starts on Attendance tab
    expect(view.getByText('Swimmer Attendance Checklist')).toBeDefined();

    // Toggle Alex Rivera to Absent
    const alexToggle = view.getByLabelText('Toggle attendance for Alex Rivera');
    fireEvent.click(alexToggle);
    expect(alexToggle.textContent).toContain('ABSENT');

    // Go to Setup tab
    navigateTo(view, 'Session');

    // Check Lane 1 dropdown options
    const lane1Select = view.getByLabelText('Select swimmer for Lane 1') as HTMLSelectElement;
    const optionTexts = Array.from(lane1Select.options).map(opt => opt.text);

    // Sam Chen (present) should be in dropdown
    expect(optionTexts.some(txt => txt.includes('Sam Chen'))).toBe(true);

    // Alex Rivera (marked absent) should NOT be in dropdown
    expect(optionTexts.some(txt => txt.includes('Alex Rivera'))).toBe(false);
  });

  it('displays STOP when running and no swimmers are in the water, and PAUSE when swimmers are active', () => {
    sessionStorage.setItem('deckgala_session_prompted', 'true');
    const view = render(<App />);

    // Go to Setup tab and switch to Coach Manual Push Release mode
    navigateTo(view, 'Session');
    fireEvent.click(view.getByText(/Coach Manual Push Release/i));

    // Go to Pool Deck
    navigateTo(view, 'Pool Deck');

    // Initially says START SET
    expect(view.getByText('START SET')).toBeDefined();

    // Start set -> Wave 1 is launched for all active lanes
    fireEvent.click(view.getByText('START SET'));

    // Swimmers are active in the water -> Master button should display PAUSE
    expect(view.getByText('PAUSE')).toBeDefined();

    // Now tap to stop each active lead swimmer so all lanes finish their wave
    const stopButtons = view.getAllByText('TAP TO STOP FINISH');
    expect(stopButtons.length).toBeGreaterThan(0);
    stopButtons.forEach(btn => fireEvent.click(btn));

    // No one is currently in the water (activeSwimmers === 0) and the timer is still running!
    // The master button must now display STOP!
    expect(view.getByText('STOP')).toBeDefined();

    // Clicking STOP stops the clock
    fireEvent.click(view.getByText('STOP'));

    // Clock is now stopped; button shows RESUME
    expect(view.getByText('RESUME')).toBeDefined();
  });

  it('allows generating a QR code for export at group and club level', async () => {
    sessionStorage.setItem('deckgala_session_prompted', 'true');
    const view = render(<App />);

    // Go to Swimmers tab
    navigateTo(view, 'Swimmers & Squads');

    // Open Export modal
    fireEvent.click(view.getByText('Export Club / Group'));
    expect(view.getByText('Export Swimmers & Groups')).toBeDefined();

    // Select "Generate QR Code" option
    const qrOption = view.getByText('Generate QR Code');
    fireEvent.click(qrOption);

    // Should display club level QR info
    expect(view.getAllByText(/ENTIRE CLUB/i).length).toBeGreaterThan(0);
    expect(view.getAllByText(/CLUB LEVEL/i).length).toBeGreaterThan(0);

    // Switch to single swimming group
    const groupScopeRadio = view.getByText('Single Swimming Group');
    fireEvent.click(groupScopeRadio);

    // Should display squad level QR info
    expect(view.getAllByText(/GROUP LEVEL/i).length).toBeGreaterThan(0);
    expect(view.getByText(/Senior Performance Squad/i)).toBeDefined();
    expect(view.getByText(/Download QR Image/i)).toBeDefined();
    expect(view.getByText(/Save PNG Image/i)).toBeDefined();

    // Close modal
    fireEvent.click(view.getByText('Close'));
  });

  it('allows importing swimmers and squads via QR code at group and club level', async () => {
    sessionStorage.setItem('deckgala_session_prompted', 'true');
    const view = render(<App />);

    // Go to Swimmers tab
    navigateTo(view, 'Swimmers & Squads');

    // Click "Scan QR Code" button directly from club header
    fireEvent.click(view.getByText('Scan QR Code'));
    expect(view.getByText('Import Swimmers & Groups')).toBeDefined();

    // In the QR scanner, switch to Paste Text tab for reliable headless testing
    const pasteTab = view.getByText('Paste Text');
    fireEvent.click(pasteTab);

    // Input a group QR payload
    const textarea = view.getByPlaceholderText(/Paste raw JSON payload/i);
    const sampleGroupPayload = JSON.stringify({
      schema: 'deckgala_group_v1',
      scope: 'group',
      clubName: 'AquaTeamHub Test Club',
      group: {
        name: 'Sprint Elite',
        coach: 'Coach Mark',
        color: 'emerald',
        swimmers: [
          { name: 'Leon Marchand', age: 22, gender: 'M', pb50m: '23.10', pb100m: '50.20' }
        ]
      }
    });

    fireEvent.change(textarea, { target: { value: sampleGroupPayload } });
    fireEvent.click(view.getByText('Parse Scanned Code'));

    // Should show the import preview screen with QR badge
    expect(view.getByText('SCANNED VIA QR CODE')).toBeDefined();
    expect(view.getAllByText(/Import Level/i).length).toBeGreaterThan(0);

    // Click Import Now
    fireEvent.click(view.getByText('Import Now'));

    // Verify Sprint Elite squad and Leon Marchand are now in the roster
    expect(view.getAllByText('Sprint Elite').length).toBeGreaterThan(0);
    expect(view.getByText('Leon Marchand')).toBeDefined();
  });

  it('navigates to Club Setup pages from the Hamburger menu', () => {
    sessionStorage.setItem('deckgala_session_prompted', 'true');
    const view = render(<App />);

    // Open hamburger menu and click Club Calendar
    navigateTo(view, 'Club Calendar');
    expect(view.getByText('CLUB SETUP & MANAGEMENT')).toBeDefined();
    expect(view.getByText('Club Calendar & Closures')).toBeDefined();

    // Switch to Session Schedules tab
    const sessionSchedTab = view.getByRole('tab', { name: /Session Schedules/i });
    fireEvent.click(sessionSchedTab);
    expect(view.getByText('+ Create Session Schedule')).toBeDefined();

    // Switch to Staffing & Coaches tab
    const staffTab = view.getByRole('tab', { name: /Staffing & Coaches/i });
    fireEvent.click(staffTab);
    expect(view.getByText('+ Add Club Coach')).toBeDefined();
    expect(view.getByText('Coach Sarah Jenkins')).toBeDefined();
  });

  it('allows setting club name and details in 1st-load welcome page guided tour and club profile tab', () => {
    // Clear storage to simulate 1st launch
    localStorage.clear();
    sessionStorage.clear();

    const view = render(<App />);

    // 1st load Welcome Page & Guided Tour Modal should open
    expect(view.getByText('Welcome to AquaTeamHub — Start Session')).toBeDefined();
    expect(view.getByText('Club Setup')).toBeDefined();

    // Step 1: Set Club Name, Acronym, and Head Coach
    const clubNameInput = view.getByLabelText(/Club Full Name/i);
    fireEvent.change(clubNameInput, { target: { value: 'Pacific Coast Aquatics' } });

    const acronymInput = view.getByLabelText(/Club Acronym/i);
    fireEvent.change(acronymInput, { target: { value: 'PCA' } });

    const cityInput = view.getByLabelText(/Home City \/ Region/i);
    fireEvent.change(cityInput, { target: { value: 'San Diego, CA' } });

    // Advance to Step 2: Pool Facility
    fireEvent.click(view.getByRole('button', { name: /Next: Pool Facility/i }));
    expect(view.getByText('Select Your Home Pool Facility')).toBeDefined();

    // Advance to Step 3: Deck Features Tour
    fireEvent.click(view.getByRole('button', { name: /Next: Deck Tour/i }));
    expect(view.getByText('AquaTeamHub Poolside Features & Tour')).toBeDefined();
    expect(view.getByText('Multi-Lane Stopwatch')).toBeDefined();
    expect(view.getByText('Poolside Gesture Menus')).toBeDefined();

    // Advance to Step 4: Today's Session
    fireEvent.click(view.getByRole('button', { name: /Next: Start Session/i }));
    expect(view.getByText("Start Today's Deck Session")).toBeDefined();

    // Finish tour and start session
    fireEvent.click(view.getByRole('button', { name: /Begin Session & Attendance/i }));

    // Lands on Attendance screen
    expect(view.getByText('ACTIVE SESSION')).toBeDefined();

    // Open Hamburger Menu and go to Club Profile
    navigateTo(view, 'Club Profile & Name');

    // Verify Club Name is updated in the banner and profile
    expect(view.getAllByText('Pacific Coast Aquatics').length).toBeGreaterThan(0);
    expect(view.getAllByText('PCA').length).toBeGreaterThan(0);
    expect(view.getAllByText(/San Diego/i).length).toBeGreaterThan(0);

    // Edit club profile in Club Setup
    const mottoInput = view.getByLabelText(/Club Motto/i);
    fireEvent.change(mottoInput, { target: { value: 'Fast Waves, Relentless Focus' } });

    fireEvent.click(view.getByRole('button', { name: /Save Club Profile/i }));
    expect(view.getByText(/Profile Saved/i)).toBeDefined();
    expect(view.getByText(/"Fast Waves, Relentless Focus"/i)).toBeDefined();
  });
});
