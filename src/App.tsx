import { useState, useEffect } from 'react';
import type { UnitSystem } from './types';
import { ProfileSetup } from './components/ProfileSetup';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Charts } from './components/Charts';
import { WeightHistory } from './components/WeightHistory';
import { useWeightData } from './hooks/useWeightData';
import { clearAllData, exportDataAsCSV } from './utils/storage';
import './App.css';

type PageType = 'dashboard' | 'charts' | 'history';

function App() {
  const { profile, entries, victories, isLoading, saveProfile, addWeightEntry, updateWeightEntry, deleteWeightEntry, addVictory, deleteVictory } = useWeightData();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', age: '', heightCm: '', heightFt: '', heightIn: '', units: 'metric' as UnitSystem });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem('darkMode', String(!prev));
      return !prev;
    });
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Show profile setup if no profile
  if (!profile) {
    return <ProfileSetup onProfileSaved={saveProfile} />;
  }

  const handleResetProfile = () => setShowResetModal(true);

  const handleExportAndReset = () => {
    const csv = exportDataAsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weight-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    clearAllData();
    window.location.reload();
  };

  const handleResetOnly = () => {
    clearAllData();
    window.location.reload();
  };

  const handleUpdateGoal = (goalWeight: number, goalDate: string) => {
    const updatedProfile = { ...profile, goalWeight, goalDate };
    saveProfile(updatedProfile);
  };

  const handleOpenProfileModal = () => {
    const totalInches = profile.heightCm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = Math.round((totalInches % 12) * 10) / 10;
    setProfileForm({
      name: profile.name,
      age: String(profile.age),
      heightCm: String(Math.round(profile.heightCm * 10) / 10),
      heightFt: String(ft),
      heightIn: String(inches),
      units: profile.units ?? 'metric',
    });
    setShowProfileModal(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    let heightCm: number;
    if (profileForm.units === 'metric') {
      heightCm = parseFloat(profileForm.heightCm);
    } else {
      const ft = parseFloat(profileForm.heightFt) || 0;
      const inches = parseFloat(profileForm.heightIn) || 0;
      heightCm = (ft * 12 + inches) * 2.54;
    }
    if (!profileForm.name.trim() || isNaN(heightCm) || heightCm <= 0 || isNaN(parseFloat(profileForm.age))) return;
    saveProfile({ ...profile, name: profileForm.name.trim(), age: parseFloat(profileForm.age), heightCm, units: profileForm.units });
    setShowProfileModal(false);
  };

  return (
    <div className="app">
      <Navigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onResetProfile={handleResetProfile}
        onEditProfile={handleOpenProfileModal}
        profileName={profile.name}
        darkMode={darkMode}
        onToggleDark={toggleDarkMode}
      />

      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard
            profile={profile}
            entries={entries}
            victories={victories}
            onAddEntry={addWeightEntry}
            onUpdateGoal={handleUpdateGoal}
            onAddVictory={addVictory}
            onDeleteVictory={deleteVictory}
          />
        )}

        {currentPage === 'charts' && <Charts profile={profile} entries={entries} />}

        {currentPage === 'history' && (
          <WeightHistory
            entries={entries}
            units={profile.units ?? 'metric'}
            onUpdateEntry={updateWeightEntry}
            onDeleteEntry={deleteWeightEntry}
          />
        )}
      </main>

      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="unit-toggle-row">
                <button type="button" className={`unit-btn${profileForm.units === 'metric' ? ' active' : ''}`} onClick={() => setProfileForm((p) => ({ ...p, units: 'metric' }))}>Metric (kg / cm)</button>
                <button type="button" className={`unit-btn${profileForm.units === 'imperial' ? ' active' : ''}`} onClick={() => setProfileForm((p) => ({ ...p, units: 'imperial' }))}>Imperial (lbs / ft)</button>
              </div>

              <div className="form-group">
                <label htmlFor="edit-name">Name</label>
                <input id="edit-name" type="text" value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} />
              </div>

              <div className="form-group">
                <label htmlFor="edit-age">Age</label>
                <input id="edit-age" type="number" step="1" value={profileForm.age} onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))} />
              </div>

              {profileForm.units === 'metric' ? (
                <div className="form-group">
                  <label htmlFor="edit-height">Height (cm)</label>
                  <input id="edit-height" type="number" step="0.1" value={profileForm.heightCm} onChange={(e) => setProfileForm((p) => ({ ...p, heightCm: e.target.value }))} />
                </div>
              ) : (
                <div className="form-group">
                  <label>Height</label>
                  <div className="height-imperial">
                    <input type="number" step="1" min="0" value={profileForm.heightFt} onChange={(e) => setProfileForm((p) => ({ ...p, heightFt: e.target.value }))} placeholder="ft" />
                    <span className="unit-label">ft</span>
                    <input type="number" step="0.5" min="0" max="11.5" value={profileForm.heightIn} onChange={(e) => setProfileForm((p) => ({ ...p, heightIn: e.target.value }))} placeholder="in" />
                    <span className="unit-label">in</span>
                  </div>
                </div>
              )}

              <div className="modal-buttons">
                <button type="button" className="cancel-btn" onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content reset-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reset All Data</h2>
            <p className="reset-modal-text">
              This will permanently delete your profile, all weight entries, and non-scale victories.
            </p>
            <div className="reset-modal-buttons">
              <button className="cancel-btn" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button className="reset-only-btn" onClick={handleResetOnly}>
                Reset Without Saving
              </button>
              <button className="export-reset-btn" onClick={handleExportAndReset}>
                Export & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
