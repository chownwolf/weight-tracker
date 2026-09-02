import React, { useMemo, useState } from 'react';
import type { BodyMeasurementEntry, Profile } from '../types';
import { calculateBodyFatNavy } from '../utils/calculations';
import { displayLength, inputToCm, lengthUnit } from '../utils/units';
import { format } from 'date-fns';
import './BodyFat.css';

interface BodyFatProps {
  profile: Profile;
  bodyMeasurements: BodyMeasurementEntry[];
  onAddEntry: (entry: Omit<BodyMeasurementEntry, 'id'>) => void;
  onDeleteEntry: (id: string) => void;
  onEditProfile: () => void;
}

export const BodyFat: React.FC<BodyFatProps> = ({
  profile,
  bodyMeasurements,
  onAddEntry,
  onDeleteEntry,
  onEditProfile,
}) => {
  const unit = lengthUnit(profile.units);
  const isFemale = profile.sex === 'female';

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const sortedDesc = useMemo(
    () => [...bodyMeasurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [bodyMeasurements]
  );

  const latestBodyFat = useMemo(() => {
    if (!profile.sex || sortedDesc.length === 0) return null;
    const latest = sortedDesc[0];
    return calculateBodyFatNavy(profile.sex, profile.heightCm, latest.neckCm, latest.waistCm, latest.hipCm);
  }, [profile.sex, profile.heightCm, sortedDesc]);

  if (!profile.sex) {
    return (
      <div className="bodyfat">
        <div className="bodyfat-container">
          <div className="bf-gate-card">
            <h2>Body Fat %</h2>
            <p>Set your sex in your profile to enable body fat tracking — the Navy method formula needs it.</p>
            <button className="submit-btn" onClick={onEditProfile}>Edit Profile</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const neckVal = parseFloat(neck);
    const waistVal = parseFloat(waist);
    const hipVal = isFemale ? parseFloat(hip) : undefined;

    if (!neck || neckVal <= 0) { setFormError(`Enter a valid neck measurement (${unit})`); return; }
    if (!waist || waistVal <= 0) { setFormError(`Enter a valid waist measurement (${unit})`); return; }
    if (isFemale && (!hip || (hipVal ?? 0) <= 0)) { setFormError(`Enter a valid hip measurement (${unit})`); return; }

    const neckCm = inputToCm(neckVal, profile.units);
    const waistCm = inputToCm(waistVal, profile.units);
    const hipCm = isFemale ? inputToCm(hipVal as number, profile.units) : undefined;

    const bf = calculateBodyFatNavy(profile.sex!, profile.heightCm, neckCm, waistCm, hipCm);
    if (bf === null) {
      setFormError('Check your measurements — waist should be larger than neck (plus hip for the female formula).');
      return;
    }

    onAddEntry({
      date,
      neckCm,
      waistCm,
      hipCm,
      notes: notes.trim() || undefined,
    });

    setNeck('');
    setWaist('');
    setHip('');
    setNotes('');
  };

  return (
    <div className="bodyfat">
      <div className="bodyfat-container">

        <div className="bf-summary-card">
          <h2>Body Fat %</h2>
          <div className="bf-summary-value">
            {latestBodyFat !== null ? `${latestBodyFat}%` : '—'}
          </div>
          <span className="bf-summary-label">
            {sortedDesc.length > 0
              ? `Latest — ${format(new Date(sortedDesc[0].date), 'MMM d, yyyy')}`
              : 'No measurements logged yet'}
          </span>
        </div>

        <div className="bf-add-card">
          <h2>Log Measurements</h2>
          <form onSubmit={handleSubmit} className="bf-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bf-date">Date</label>
                <input id="bf-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="bf-neck">Neck ({unit}) *</label>
                <input id="bf-neck" type="number" step="0.1" value={neck} onChange={(e) => setNeck(e.target.value)} placeholder={`e.g. ${unit === 'in' ? '15' : '38'}`} />
              </div>
              <div className="form-group">
                <label htmlFor="bf-waist">Waist ({unit}) *</label>
                <input id="bf-waist" type="number" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder={`e.g. ${unit === 'in' ? '34' : '86'}`} />
              </div>
              {isFemale && (
                <div className="form-group">
                  <label htmlFor="bf-hip">Hip ({unit}) *</label>
                  <input id="bf-hip" type="number" step="0.1" value={hip} onChange={(e) => setHip(e.target.value)} placeholder={`e.g. ${unit === 'in' ? '40' : '102'}`} />
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="bf-notes">Notes (optional)</label>
              <input id="bf-notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. morning, unflexed" />
            </div>
            {formError && <span className="error">{formError}</span>}
            <button type="submit" className="submit-btn">Log Measurement</button>
          </form>
        </div>

        <div className="bf-entries-card">
          <h2>Measurement History</h2>
          {sortedDesc.length === 0 ? (
            <p className="bf-empty">No measurements logged yet.</p>
          ) : (
            <ul className="bf-entries-list">
              {sortedDesc.map((entry) => {
                const bf = calculateBodyFatNavy(profile.sex!, profile.heightCm, entry.neckCm, entry.waistCm, entry.hipCm);
                return (
                  <li key={entry.id} className="bf-entry-item">
                    <div className="bf-entry-info">
                      <span className="bf-entry-date">{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                      <div className="bf-entry-measurements">
                        <span className="bf-measure-tag">Neck {displayLength(entry.neckCm, profile.units)}{unit}</span>
                        <span className="bf-measure-tag">Waist {displayLength(entry.waistCm, profile.units)}{unit}</span>
                        {entry.hipCm != null && (
                          <span className="bf-measure-tag">Hip {displayLength(entry.hipCm, profile.units)}{unit}</span>
                        )}
                      </div>
                      {entry.notes && <span className="bf-entry-notes">{entry.notes}</span>}
                    </div>
                    <div className="bf-entry-right">
                      <span className="bf-entry-pct">{bf !== null ? `${bf}%` : '—'}</span>
                      <button className="bf-delete-btn" onClick={() => onDeleteEntry(entry.id)} aria-label="Delete entry">×</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};
