import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { CoachSelector } from './CoachSelector';
import logoUrl from '../../assets/logo.svg';

export interface WelcomeTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialPrompt?: boolean;
}

type TourStep = 1 | 2 | 3 | 4;

export function WelcomeTourModal({
  isOpen,
  onClose,
  isInitialPrompt = true
}: WelcomeTourModalProps) {
  const { club, config, updateClubProfile, updateSessionDetails, setCurrentView } = useApp();

  const [step, setStep] = useState<TourStep>(1);

  // Step 1: Club Setup
  const [clubName, setClubName] = useState(club.clubName || 'AquaTeamHub Swim Club');
  const [shortName, setShortName] = useState(club.shortName || 'DGSC');
  const [city, setCity] = useState(club.city || 'Manchester');
  const [headCoachName, setHeadCoachName] = useState(club.headCoachName || 'Coach Sarah Jenkins');
  const [clubNameError, setClubNameError] = useState(false);

  // Step 2: Pool Facility
  const [selectedPoolId, setSelectedPoolId] = useState<string>(
    config.selectedPoolId || club.pools[0]?.id || 'pool-main-25m'
  );

  // Step 4: Session Details
  const [sessionName, setSessionName] = useState(config.sessionName || 'Morning Training Session');
  const [sessionDate, setSessionDate] = useState(config.sessionDate || new Date().toISOString().slice(0, 10));
  const [sessionTime, setSessionTime] = useState(config.sessionTime || new Date().toTimeString().slice(0, 5));
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    config.selectedGroupIds && config.selectedGroupIds.length > 0
      ? config.selectedGroupIds
      : club.groups.slice(0, 2).map(g => g.id)
  );

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setClubName(club.clubName || 'AquaTeamHub Swim Club');
      setShortName(club.shortName || 'DGSC');
      setCity(club.city || 'Manchester');
      setHeadCoachName(club.headCoachName || 'Coach Sarah Jenkins');
      setSelectedPoolId(config.selectedPoolId || club.pools[0]?.id || 'pool-main-25m');
      setSessionName(config.sessionName || 'Morning Training Session');
      setSessionDate(config.sessionDate || new Date().toISOString().slice(0, 10));
      setSessionTime(config.sessionTime || new Date().toTimeString().slice(0, 5));
      setSelectedGroupIds(
        config.selectedGroupIds && config.selectedGroupIds.length > 0
          ? config.selectedGroupIds
          : club.groups.slice(0, 2).map(g => g.id)
      );
      setClubNameError(false);
    }
  }, [isOpen, club, config]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSelectAllSquads = () => {
    setSelectedGroupIds(club.groups.map(g => g.id));
  };

  const handleSaveAndFinish = () => {
    const finalClubName = clubName.trim() || 'AquaTeamHub Swim Club';

    // Save Club Profile
    updateClubProfile({
      clubName: finalClubName,
      shortName: shortName.trim() || 'DGSC',
      city: city.trim(),
      headCoachName: headCoachName.trim(),
      primaryPoolId: selectedPoolId
    });

    // Save Active Session
    updateSessionDetails({
      sessionName: sessionName.trim() || 'Morning Training Session',
      sessionDate,
      sessionTime,
      selectedPoolId,
      selectedGroupIds
    });

    // Mark completion in storage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('deckgala_tour_completed', 'true');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('deckgala_session_prompted', 'true');
      }
    } catch {
      // Ignore
    }

    onClose();
    if (isInitialPrompt) {
      setCurrentView('attendance');
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!clubName.trim()) {
        setClubNameError(true);
        const el = document.getElementById('tourClubNameInput');
        if (el) el.focus();
        return;
      }
      setClubNameError(false);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const currentPool = club.pools.find(p => p.id === selectedPoolId) || club.pools[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSaveAndFinish}
      title="Welcome to AquaTeamHub — Start Session"
      size="lg"
      footer={
        <div className="wizard-footer-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleSaveAndFinish}
            title="Skip tour and begin session with current settings"
          >
            Skip Tour
          </button>
          <div className="wizard-footer-right">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep((prev) => (prev - 1) as TourStep)}
              >
                ← Back
              </button>
            )}
            {step < 4 ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSaveAndFinish}
                >
                  <Icon name="check" size={16} />
                  <span>Begin Session & Attendance →</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                >
                  <span>
                    {step === 1 ? 'Next: Pool Facility →' : step === 2 ? 'Next: Deck Tour →' : 'Next: Start Session →'}
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAndFinish}
              >
                <Icon name="check" size={16} />
                <span>Begin Session & Attendance →</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="welcome-tour-modal-content">
        {/* Stepper Tabs Bar */}
        <div className="modal-stepper" role="tablist" aria-label="Guided Tour Steps">
          <button
            type="button"
            role="tab"
            aria-selected={step === 1}
            className={`modal-step-tab ${step === 1 ? 'active' : ''} ${clubName.trim() ? 'completed' : ''}`}
            onClick={() => setStep(1)}
          >
            <span className="modal-step-number">{clubName.trim() && step !== 1 ? '✓' : '1'}</span>
            <span>Club Setup</span>
          </button>

          <div className="modal-step-separator" />

          <button
            type="button"
            role="tab"
            aria-selected={step === 2}
            className={`modal-step-tab ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}
            onClick={() => {
              if (!clubName.trim()) {
                setClubNameError(true);
                setStep(1);
              } else {
                setStep(2);
              }
            }}
          >
            <span className="modal-step-number">{step > 2 ? '✓' : '2'}</span>
            <span>Pool Facility</span>
          </button>

          <div className="modal-step-separator" />

          <button
            type="button"
            role="tab"
            aria-selected={step === 3}
            className={`modal-step-tab ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}
            onClick={() => setStep(3)}
          >
            <span className="modal-step-number">{step > 3 ? '✓' : '3'}</span>
            <span>Deck Features</span>
          </button>

          <div className="modal-step-separator" />

          <button
            type="button"
            role="tab"
            aria-selected={step === 4}
            className={`modal-step-tab ${step === 4 ? 'active' : ''}`}
            onClick={() => setStep(4)}
          >
            <span className="modal-step-number">4</span>
            <span>Start Session</span>
          </button>
        </div>

        {/* STEP 1: Club Setup & Name */}
        <div
          className="wizard-step-panel"
          style={{ display: step === 1 ? 'flex' : 'none' }}
        >
          <div className="tour-welcome-banner">
            <div className="tour-logo-col">
              <img src={logoUrl} alt="AquaTeamHub" className="brand-logo-img" width="42" height="42" />
            </div>
            <div className="tour-header-text">
              <h3>Welcome to AquaTeamHub!</h3>
              <p>
                Professional offline deck timing, attendance tracking, and club management. Let's personalize your club name and details.
              </p>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="tourClubNameInput">
              Club Full Name *
              {clubNameError && (
                <span style={{ color: 'var(--color-crimson, #FF3366)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                  Please enter your club name
                </span>
              )}
            </label>
            <input
              type="text"
              id="tourClubNameInput"
              value={clubName}
              onChange={e => {
                setClubName(e.target.value);
                if (e.target.value.trim()) setClubNameError(false);
              }}
              placeholder="e.g. AquaTeamHub Swim Club"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="tourShortNameInput">Club Acronym / Code</label>
              <input
                type="text"
                id="tourShortNameInput"
                value={shortName}
                onChange={e => setShortName(e.target.value)}
                placeholder="e.g. DGSC"
                maxLength={8}
              />
            </div>
            <div className="form-field">
              <label htmlFor="tourCityInput">Home City / Region</label>
              <input
                type="text"
                id="tourCityInput"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Manchester, UK"
              />
            </div>
          </div>

          <CoachSelector
            id="tourHeadCoachInput"
            label="Head Coach"
            multiple={false}
            valueKey="name"
            value={headCoachName}
            allowCustomInput={true}
            allowUnassigned={true}
            unassignedLabel="Unassigned"
            placeholder="Type or select head coach..."
            onChange={val => setHeadCoachName(typeof val === 'string' ? val : val[0] || '')}
          />

          {/* Quick Preview Pill */}
          <div className="tour-club-preview-box">
            <div className="tour-preview-crest">
              <Icon name="shield" size={24} />
              <span className="crest-code">{shortName || 'DGSC'}</span>
            </div>
            <div className="tour-preview-info">
              <div className="preview-club-name">{clubName || 'Your Club Name'}</div>
              <div className="preview-meta">
                <span>👤 {headCoachName || 'Head Coach'}</span>
                {city && <span> · 📍 {city}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: Pool Facility */}
        <div
          className="wizard-step-panel"
          style={{ display: step === 2 ? 'flex' : 'none' }}
        >
          <div className="tour-step-intro">
            <h4>Select Your Home Pool Facility</h4>
            <p>
              AquaTeamHub supports 25m, 50m Olympic long course, and 25-yard pools with custom lane numbers. You can add more pools anytime in Club Setup.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="tourPoolSelect">Swimming Pool Facility</label>
            <select
              id="tourPoolSelect"
              value={selectedPoolId}
              onChange={e => setSelectedPoolId(e.target.value)}
              className="session-modal-pool-select"
            >
              {club.pools.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.laneCount} Lanes · {p.length})
                </option>
              ))}
            </select>
          </div>

          {currentPool && (
            <div className="tour-pool-preview-card">
              <div className="pool-card-header">
                <Icon name="pool" size={20} />
                <span className="pool-card-title">{currentPool.name}</span>
                <span className="pool-course-badge">{currentPool.length}</span>
              </div>
              <div className="pool-card-lanes">
                {Array.from({ length: currentPool.laneCount }, (_, i) => (
                  <div key={i} className="tour-lane-indicator">
                    <span>L{i + 1}</span>
                  </div>
                ))}
              </div>
              <p className="pool-card-sub">
                Configures session with {currentPool.laneCount} active lanes ({currentPool.length} course standard).
              </p>
            </div>
          )}
        </div>

        {/* STEP 3: Deck Features Tour */}
        <div
          className="wizard-step-panel"
          style={{ display: step === 3 ? 'flex' : 'none' }}
        >
          <div className="tour-step-intro">
            <h4>AquaTeamHub Poolside Features & Tour</h4>
            <p>Built specifically for wet pool decks and fast coaching workflows:</p>
          </div>

          <div className="tour-features-grid">
            <div className="tour-feature-card">
              <div className="feature-icon-circle stopwatch-icon">
                <Icon name="stopwatch" size={22} />
              </div>
              <h5>Multi-Lane Stopwatch</h5>
              <p>Interval waves, mass start, or coach push release. 1-tap split recording and undo.</p>
            </div>

            <div className="tour-feature-card">
              <div className="feature-icon-circle attendance-icon">
                <Icon name="attendance" size={22} />
              </div>
              <h5>Attendance & Lanes</h5>
              <p>Quick swimmer check-in and 1-tap round-robin distribution into pool lanes.</p>
            </div>

            <div className="tour-feature-card">
              <div className="feature-icon-circle club-icon">
                <Icon name="calendar" size={22} />
              </div>
              <h5>Club Timetable & Staff</h5>
              <p>Weekly schedules, staff cover substitution, holiday closures, and Head Coach briefing notes.</p>
            </div>

            <div className="tour-feature-card">
              <div className="feature-icon-circle pie-icon">
                <Icon name="pie" size={22} />
              </div>
              <h5>Poolside Gesture Menus</h5>
              <p>Floating radial Pie Menu & Hamburger menu for effortless 1-handed navigation.</p>
            </div>
          </div>
        </div>

        {/* STEP 4: Start Today's Session */}
        <div
          className="wizard-step-panel"
          style={{ display: step === 4 ? 'flex' : 'none' }}
        >
          <div className="tour-step-intro">
            <h4>Start Today's Deck Session</h4>
            <p>Configure session name, date, and active squads to begin recording times.</p>
          </div>

          <div className="form-field">
            <label htmlFor="tourSessionName">Session Name *</label>
            <input
              type="text"
              id="tourSessionName"
              placeholder="e.g. Morning Aerobic Threshold"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="tourSessionDate">Session Date</label>
              <input
                type="date"
                id="tourSessionDate"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="tourSessionTime">Session Time</label>
              <input
                type="time"
                id="tourSessionTime"
                value={sessionTime}
                onChange={e => setSessionTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ margin: 0 }}>Active Squads in this Session</label>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={handleSelectAllSquads}
              >
                Select All Squads
              </button>
            </div>

            <div className="schedule-squads-picker">
              {club.groups.map(grp => {
                const isChecked = selectedGroupIds.includes(grp.id);
                return (
                  <button
                    key={grp.id}
                    type="button"
                    className={`squad-select-pill ${isChecked ? 'active' : ''}`}
                    onClick={() => toggleGroup(grp.id)}
                  >
                    <span className={`group-color-dot dot-${grp.color || 'cyan'}`} />
                    <span>{grp.name}</span>
                    <span className="squad-count">({grp.swimmers.length})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

