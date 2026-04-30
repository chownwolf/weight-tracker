import { useState, useEffect } from 'react';
import { ProfileSetup } from './components/ProfileSetup';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Charts } from './components/Charts';
import { WeightHistory } from './components/WeightHistory';
import { useWeightData } from './hooks/useWeightData';
import { clearAllData } from './utils/storage';
import './App.css';

type PageType = 'dashboard' | 'charts' | 'history';

function App() {
  const { profile, entries, isLoading, saveProfile, addWeightEntry, updateWeightEntry, deleteWeightEntry } = useWeightData();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

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

  const handleResetProfile = () => {
    if (window.confirm('Are you sure you want to reset your profile and all data? This cannot be undone.')) {
      clearAllData();
      window.location.reload();
    }
  };

  const handleUpdateGoal = (goalWeight: number, goalDate: string) => {
    const updatedProfile = {
      ...profile,
      goalWeight,
      goalDate,
    };
    saveProfile(updatedProfile);
  };

  return (
    <div className="app">
      <Navigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onResetProfile={handleResetProfile}
        profileName={profile.name}
        darkMode={darkMode}
        onToggleDark={toggleDarkMode}
      />

      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard
            profile={profile}
            entries={entries}
            onAddEntry={addWeightEntry}
            onUpdateGoal={handleUpdateGoal}
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
    </div>
  );
}

export default App;
