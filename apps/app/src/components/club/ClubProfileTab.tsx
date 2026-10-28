import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { CoachSelector } from '../common/CoachSelector';

export interface ClubProfileTabProps {
  onOpenTour?: () => void;
}

export function ClubProfileTab({ onOpenTour }: ClubProfileTabProps = {}) {
  const { club, updateClubProfile } = useApp();

  const [clubName, setClubName] = useState(club.clubName || 'DeckGala Swim Club');
  const [shortName, setShortName] = useState(club.shortName || 'DGSC');
  const [city, setCity] = useState(club.city || 'Manchester');
  const [country, setCountry] = useState(club.country || 'United Kingdom');
  const [headCoachName, setHeadCoachName] = useState(club.headCoachName || 'Coach Sarah Jenkins');
  const [contactEmail, setContactEmail] = useState(club.contactEmail || 'info@deckgala.com');
  const [contactPhone, setContactPhone] = useState(club.contactPhone || '+44 7700 900123');
  const [establishedYear, setEstablishedYear] = useState(club.establishedYear || '2012');
  const [motto, setMotto] = useState(club.motto || 'High Performance Poolside Excellence');
  const [primaryPoolId, setPrimaryPoolId] = useState(club.primaryPoolId || club.pools[0]?.id || 'pool-main-25m');
  const [isSaved, setIsSaved] = useState(false);

  const totalSwimmers = club.groups.reduce((acc, g) => acc + g.swimmers.length, 0);
  const primaryPool = club.pools.find(p => p.id === primaryPoolId) || club.pools[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return;

    updateClubProfile({
      clubName: clubName.trim(),
      shortName: shortName.trim() || 'DGSC',
      city: city.trim(),
      country: country.trim(),
      headCoachName: headCoachName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      establishedYear: establishedYear.trim(),
      motto: motto.trim(),
      primaryPoolId
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="club-profile-container">
      {/* Intro Header */}
      <div className="club-profile-header">
        <div className="profile-header-text">
          <h3>Club Identity & Profile</h3>
          <p>
            Configure your swim club name, official acronym, home training facility, and leadership details. These appear on exported results, attendance sheets, and schedule cards.
          </p>
        </div>
        {onOpenTour && (
          <button
            type="button"
            className="btn btn-secondary btn-tour-launch"
            onClick={onOpenTour}
          >
            <Icon name="compass" size={16} />
            <span>Launch Welcome Guided Tour</span>
          </button>
        )}
      </div>

      <div className="club-profile-grid">
        {/* Form Card */}
        <form className="club-profile-form-card" onSubmit={handleSubmit}>
          <h4 className="section-subtitle">
            <Icon name="shield" size={18} />
            <span>Club Identification</span>
          </h4>

          <div className="form-field">
            <label htmlFor="clubNameInput">Club Full Name *</label>
            <input
              type="text"
              id="clubNameInput"
              value={clubName}
              onChange={e => setClubName(e.target.value)}
              placeholder="e.g. Manchester Aquatics Swim Club"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="clubShortNameInput">Club Acronym / Code</label>
              <input
                type="text"
                id="clubShortNameInput"
                value={shortName}
                onChange={e => setShortName(e.target.value)}
                placeholder="e.g. MASC"
                maxLength={8}
              />
            </div>
            <div className="form-field">
              <label htmlFor="clubYearInput">Established Year</label>
              <input
                type="text"
                id="clubYearInput"
                value={establishedYear}
                onChange={e => setEstablishedYear(e.target.value)}
                placeholder="e.g. 2012"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="clubCityInput">Home City / Region</label>
              <input
                type="text"
                id="clubCityInput"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Manchester"
              />
            </div>
            <div className="form-field">
              <label htmlFor="clubCountryInput">Country</label>
              <input
                type="text"
                id="clubCountryInput"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="e.g. United Kingdom"
              />
            </div>
          </div>

          <h4 className="section-subtitle" style={{ marginTop: '0.8rem' }}>
            <Icon name="users" size={18} />
            <span>Coaching & Home Facility</span>
          </h4>

          <CoachSelector
            id="clubHeadCoachInput"
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

          <div className="form-field">
            <label htmlFor="clubPrimaryPoolSelect">Primary Home Pool</label>
            <select
              id="clubPrimaryPoolSelect"
              value={primaryPoolId}
              onChange={e => setPrimaryPoolId(e.target.value)}
            >
              {club.pools.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.laneCount} Lanes · {p.length})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="clubEmailInput">Club Contact Email</label>
              <input
                type="email"
                id="clubEmailInput"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="e.g. headcoach@deckgala.com"
              />
            </div>
            <div className="form-field">
              <label htmlFor="clubPhoneInput">Contact Phone</label>
              <input
                type="tel"
                id="clubPhoneInput"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="e.g. +44 7700 900123"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="clubMottoInput">Club Motto / Training Philosophy</label>
            <input
              type="text"
              id="clubMottoInput"
              value={motto}
              onChange={e => setMotto(e.target.value)}
              placeholder="e.g. Discipline, Speed & Teamwork"
            />
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={16} />
              <span>{isSaved ? '✓ Profile Saved!' : 'Save Club Profile'}</span>
            </button>
          </div>
        </form>

        {/* Live Preview & Statistics Card */}
        <div className="club-profile-sidebar">
          {/* Official Badge Card */}
          <div className="club-badge-card">
            <div className="badge-crest-circle">
              <Icon name="shield" size={32} />
              <span className="badge-crest-code">{shortName || 'DGSC'}</span>
            </div>
            <h3 className="badge-club-name">{clubName || 'DeckGala Swim Club'}</h3>
            <p className="badge-motto">"{motto || 'High Performance Swimming'}"</p>

            <div className="badge-meta-list">
              <div className="badge-meta-item">
                <span className="meta-label">HEAD COACH</span>
                <span className="meta-val">{headCoachName || 'Unassigned'}</span>
              </div>
              <div className="badge-meta-item">
                <span className="meta-label">LOCATION</span>
                <span className="meta-val">{city ? `${city}, ${country}` : country || 'Not set'}</span>
              </div>
              <div className="badge-meta-item">
                <span className="meta-label">PRIMARY VENUE</span>
                <span className="meta-val">{primaryPool ? `${primaryPool.name} (${primaryPool.length})` : '25m Pool'}</span>
              </div>
              {establishedYear && (
                <div className="badge-meta-item">
                  <span className="meta-label">FOUNDED</span>
                  <span className="meta-val">Est. {establishedYear}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="club-metrics-grid">
            <div className="metric-box">
              <span className="metric-num">{totalSwimmers}</span>
              <span className="metric-lbl">Swimmers</span>
            </div>
            <div className="metric-box">
              <span className="metric-num">{club.groups.length}</span>
              <span className="metric-lbl">Squads</span>
            </div>
            <div className="metric-box">
              <span className="metric-num">{(club.scheduledSessions || []).length}</span>
              <span className="metric-lbl">Schedules</span>
            </div>
            <div className="metric-box">
              <span className="metric-num">{(club.coaches || []).length}</span>
              <span className="metric-lbl">Coaches</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

