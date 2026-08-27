import React, { useState } from 'react';
import type { Profile, WeightEntry, NonScaleVictory, Milestone } from '../types';
import { useCalculations } from '../hooks/useCalculations';
import { displayWeight, inputToKg, weightUnit } from '../utils/units';
import { format } from 'date-fns';
import './Dashboard.css';

interface DashboardProps {
  profile: Profile;
  entries: WeightEntry[];
  victories: NonScaleVictory[];
  onAddEntry: (weight: number, date: string, notes?: string) => void;
  onUpdateGoal: (goalWeight: number, goalDate: string) => void;
  onUpdateMilestones: (milestones: Milestone[]) => void;
  onAddVictory: (text: string, date: string) => void;
  onDeleteVictory: (id: string) => void;
}

interface MilestoneRow {
  id: string;
  weight: string;
  date: string;
  label: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  entries,
  victories,
  onAddEntry,
  onUpdateGoal,
  onUpdateMilestones,
  onAddVictory,
  onDeleteVictory,
}) => {
  const { stats, goalProjection, milestoneProjections, streak } = useCalculations(profile, entries);
  const units = profile.units ?? 'metric';
  const unit = weightUnit(units);
  const maxGoalWeight = units === 'metric' ? 500 : 1100;

  const [formData, setFormData] = useState({
    weight: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  const [nsvText, setNsvText] = useState('');
  const [nsvDate, setNsvDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleNsvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nsvText.trim()) return;
    onAddVictory(nsvText.trim(), nsvDate);
    setNsvText('');
    setNsvDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalData, setGoalData] = useState({
    goalWeight: profile.goalWeight ? displayWeight(profile.goalWeight, units).toString() : '',
    goalDate: profile.goalDate || '',
  });
  const [goalError, setGoalError] = useState('');
  const [milestoneRows, setMilestoneRows] = useState<MilestoneRow[]>(
    (profile.milestones ?? []).map((m) => ({
      id: m.id,
      weight: displayWeight(m.weight, units).toString(),
      date: m.date,
      label: m.label ?? '',
    }))
  );
  const [milestoneErrors, setMilestoneErrors] = useState<Record<string, string>>({});

  const handleAddMilestoneRow = () => {
    setMilestoneRows((prev) => [...prev, { id: crypto.randomUUID(), weight: '', date: '', label: '' }]);
  };

  const handleMilestoneRowChange = (id: string, field: keyof Omit<MilestoneRow, 'id'>, value: string) => {
    setMilestoneRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleRemoveMilestoneRow = (id: string) => {
    setMilestoneRows((prev) => prev.filter((row) => row.id !== id));
    setMilestoneErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const val = parseFloat(formData.weight);
    if (!formData.weight || val <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    onAddEntry(inputToKg(val, units), formData.date, formData.notes);
    setFormData({
      weight: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = format(new Date(), 'yyyy-MM-dd');

    const goalVal = parseFloat(goalData.goalWeight);
    if (!goalData.goalWeight || goalVal <= 0 || goalVal > maxGoalWeight) {
      setGoalError('Please enter a valid goal weight');
      return;
    }

    if (!goalData.goalDate || goalData.goalDate <= today) {
      setGoalError('Goal date must be in the future');
      return;
    }

    const rowErrors: Record<string, string> = {};
    milestoneRows.forEach((row) => {
      const w = parseFloat(row.weight);
      if (!row.weight || isNaN(w) || w <= 0 || w > maxGoalWeight) {
        rowErrors[row.id] = 'Enter a valid weight';
        return;
      }
      if (!row.date || row.date <= today) {
        rowErrors[row.id] = 'Date must be in the future';
        return;
      }
      if (goalData.goalDate && row.date >= goalData.goalDate) {
        rowErrors[row.id] = 'Must be before goal date';
      }
    });

    if (Object.keys(rowErrors).length > 0) {
      setMilestoneErrors(rowErrors);
      return;
    }

    setGoalError('');
    setMilestoneErrors({});
    onUpdateGoal(inputToKg(goalVal, units), goalData.goalDate);
    onUpdateMilestones(
      milestoneRows.map((row) => ({
        id: row.id,
        weight: inputToKg(parseFloat(row.weight), units),
        date: row.date,
        label: row.label.trim() || undefined,
      }))
    );
    setShowGoalModal(false);
  };

  if (!stats) return <div>Loading...</div>;

  const goalProgress = profile.goalWeight
    ? ((profile.startWeight - stats.currentWeight) / (profile.startWeight - profile.goalWeight)) * 100
    : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Current Weight</div>
            <div className="stat-value">{displayWeight(stats.currentWeight, units)} {unit}</div>
            <div className="stat-subtext">since {format(new Date(profile.startDate), 'MMM d, yyyy')}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Total Lost</div>
            <div className={`stat-value ${stats.totalWeightLoss > 0 ? 'stat-value--loss' : 'stat-value--gain'}`}>
              {stats.totalWeightLoss > 0 ? '−' : '+'}{Math.abs(displayWeight(stats.totalWeightLoss, units))} {unit}
            </div>
            <div className="stat-subtext">from {displayWeight(profile.startWeight, units)} {unit}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">BMI</div>
            <div className="stat-value">{stats.currentBMI}</div>
            <div className="stat-subtext">
              {stats.currentBMI < 18.5
                ? 'Underweight'
                : stats.currentBMI < 25
                  ? 'Normal'
                  : stats.currentBMI < 30
                    ? 'Overweight'
                    : 'Obese'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Weekly Rate</div>
            <div className="stat-value">{displayWeight(Math.abs(stats.weeklyAverageRate), units)} {unit}</div>
            <div className="stat-subtext">average per week</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Progress</div>
            <div className="stat-value">{stats.daysActive} days</div>
            <div className="stat-subtext">{stats.entryCount} entries logged</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Streak</div>
            <div className="stat-value">{streak} 🔥</div>
            <div className="stat-subtext">{streak === 1 ? 'day in a row' : 'days in a row'}</div>
          </div>
        </div>

        <div className="main-content">
          <div className="entry-section">
            <h2>Add Today's Weight</h2>
            <form onSubmit={handleWeightSubmit} className="weight-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="weight">Weight ({unit}) *</label>
                  <input
                    id="weight"
                    type="number"
                    placeholder={units === 'imperial' ? '187.4' : '85.5'}
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  placeholder="How are you feeling? Any notes?"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <button type="submit" className="submit-btn">
                Log Weight
              </button>
            </form>
          </div>

          {profile.goalWeight && (
            <div className="goal-section">
              <div className="goal-section-header">
                <h2>Goal Progress</h2>
                <button className="edit-goal-btn" onClick={() => setShowGoalModal(true)}>
                  Edit Goal
                </button>
              </div>
              <div className="goal-info">
                <div>
                  <div className="goal-label">Target Weight</div>
                  <div className="goal-value">{displayWeight(profile.goalWeight, units)} {unit}</div>
                </div>
                <div>
                  <div className="goal-label">Target Date</div>
                  <div className="goal-value">{profile.goalDate ? format(new Date(profile.goalDate), 'MMM d, yyyy') : 'Not set'}</div>
                </div>
                <div>
                  <div className="goal-label">Projected Date</div>
                  <div className="goal-value projected">
                    {goalProjection?.projectedDate
                      ? format(new Date(goalProjection.projectedDate), 'MMM d, yyyy')
                      : '—'}
                  </div>
                </div>
                {goalProjection?.daysToGoal != null && (
                  <div>
                    <div className="goal-label">Days Left</div>
                    <div className="goal-value">{goalProjection.daysToGoal}</div>
                  </div>
                )}
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(Math.max(goalProgress, 0), 100)}%`,
                    }}
                  />
                </div>
                <div className="progress-text">{Math.round(goalProgress)}% to goal</div>
              </div>

              {milestoneProjections.length > 0 && (
                <div className="milestone-list">
                  {milestoneProjections.map(({ milestone, achieved, projectedDate }) => (
                    <div
                      key={milestone.id}
                      className={`milestone-item${achieved ? ' milestone-item--achieved' : ''}`}
                    >
                      <span className="milestone-label">
                        {milestone.label || `${displayWeight(milestone.weight, units)} ${unit}`}
                      </span>
                      <span className="milestone-date">{format(new Date(milestone.date), 'MMM d, yyyy')}</span>
                      {achieved ? (
                        <span className="milestone-badge">Achieved</span>
                      ) : (
                        projectedDate && (
                          <span className="milestone-projected">
                            {format(new Date(projectedDate), 'MMM d, yyyy')}
                          </span>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!profile.goalWeight && (
            <div className="goal-section empty">
              <p>No goal set yet</p>
              <button className="set-goal-btn" onClick={() => setShowGoalModal(true)}>
                Set a Weight Goal
              </button>
            </div>
          )}
        </div>

        <div className="nsv-section">
          <h2>Non-Scale Victories</h2>
          <form onSubmit={handleNsvSubmit} className="nsv-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nsv-date">Date</label>
                <input
                  id="nsv-date"
                  type="date"
                  value={nsvDate}
                  onChange={(e) => setNsvDate(e.target.value)}
                />
              </div>
              <div className="form-group nsv-text-group">
                <label htmlFor="nsv-text">Victory</label>
                <input
                  id="nsv-text"
                  type="text"
                  placeholder="e.g. Ran 5K without stopping"
                  value={nsvText}
                  onChange={(e) => setNsvText(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="submit-btn">
              Add Victory
            </button>
          </form>

          {victories.length === 0 ? (
            <p className="nsv-empty">No victories logged yet. Celebrate every win!</p>
          ) : (
            <ul className="nsv-list">
              {[...victories]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((v) => (
                  <li key={v.id} className="nsv-item">
                    <div className="nsv-item-content">
                      <span className="nsv-trophy">🏆</span>
                      <div>
                        <div className="nsv-item-text">{v.text}</div>
                        <div className="nsv-item-date">{format(new Date(v.date), 'MMM d, yyyy')}</div>
                      </div>
                    </div>
                    <button
                      className="nsv-delete-btn"
                      onClick={() => onDeleteVictory(v.id)}
                      aria-label="Delete victory"
                    >
                      ×
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Set Your Weight Goal</h2>
            <form onSubmit={handleGoalSubmit}>
              <div className="form-group">
                <label htmlFor="goal-weight">Target Weight ({unit})</label>
                <input
                  id="goal-weight"
                  type="number"
                  step="0.1"
                  value={goalData.goalWeight}
                  onChange={(e) => setGoalData((prev) => ({ ...prev, goalWeight: e.target.value }))}
                  placeholder={units === 'imperial' ? '160' : '80'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="goal-date">Target Date</label>
                <input
                  id="goal-date"
                  type="date"
                  value={goalData.goalDate}
                  onChange={(e) => setGoalData((prev) => ({ ...prev, goalDate: e.target.value }))}
                />
              </div>

              {goalError && <div className="milestone-row-error">{goalError}</div>}

              <div className="form-divider"><span>Short-Term Goals</span></div>

              {milestoneRows.map((row) => (
                <div key={row.id} className="milestone-row">
                  <div className="milestone-row-fields">
                    <input
                      type="number"
                      step="0.1"
                      placeholder={`Weight (${unit})`}
                      value={row.weight}
                      onChange={(e) => handleMilestoneRowChange(row.id, 'weight', e.target.value)}
                    />
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleMilestoneRowChange(row.id, 'date', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Label (optional)"
                      value={row.label}
                      onChange={(e) => handleMilestoneRowChange(row.id, 'label', e.target.value)}
                    />
                    <button
                      type="button"
                      className="milestone-remove-btn"
                      onClick={() => handleRemoveMilestoneRow(row.id)}
                      aria-label="Remove milestone"
                    >
                      ×
                    </button>
                  </div>
                  {milestoneErrors[row.id] && (
                    <div className="milestone-row-error">{milestoneErrors[row.id]}</div>
                  )}
                </div>
              ))}

              <button type="button" className="add-milestone-btn" onClick={handleAddMilestoneRow}>
                + Add Milestone
              </button>

              <div className="modal-buttons">
                <button type="button" className="cancel-btn" onClick={() => setShowGoalModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Set Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
