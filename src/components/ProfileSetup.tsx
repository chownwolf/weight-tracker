import React, { useState } from 'react';
import type { Profile, UnitSystem } from '../types';
import { format } from 'date-fns';
import './ProfileSetup.css';

interface ProfileSetupProps {
  onProfileSaved: (profile: Profile) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onProfileSaved }) => {
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [formData, setFormData] = useState({
    name: '',
    heightCm: '',
    heightFt: '',
    heightIn: '',
    age: '',
    weight: '',
    goalWeight: '',
    goalDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (units === 'metric') {
      const height = parseFloat(formData.heightCm);
      if (!formData.heightCm || height <= 0 || height > 300) {
        newErrors.heightCm = 'Enter valid height (1-300 cm)';
      }
    } else {
      const ft = parseFloat(formData.heightFt);
      const inches = parseFloat(formData.heightIn || '0');
      if (!formData.heightFt || ft < 0 || ft > 9 || inches < 0 || inches >= 12) {
        newErrors.heightFt = 'Enter valid height (e.g. 5 ft 10 in)';
      }
    }

    const age = parseFloat(formData.age);
    if (!formData.age || age < 1 || age > 150) {
      newErrors.age = 'Enter valid age (1-150)';
    }

    const weight = parseFloat(formData.weight);
    if (units === 'metric') {
      if (!formData.weight || weight <= 0 || weight > 500) {
        newErrors.weight = 'Enter valid weight (1-500 kg)';
      }
    } else {
      if (!formData.weight || weight <= 0 || weight > 1100) {
        newErrors.weight = 'Enter valid weight (1-1100 lbs)';
      }
    }

    if (formData.goalWeight) {
      const gw = parseFloat(formData.goalWeight);
      const maxGoal = units === 'metric' ? 500 : 1100;
      if (gw <= 0 || gw > maxGoal) {
        newErrors.goalWeight = `Enter valid goal weight`;
      }
    }

    if (formData.goalDate) {
      const today = format(new Date(), 'yyyy-MM-dd');
      if (formData.goalDate <= today) {
        newErrors.goalDate = 'Goal date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    let heightCm: number;
    let startWeight: number;

    if (units === 'metric') {
      heightCm = parseFloat(formData.heightCm);
      startWeight = parseFloat(formData.weight);
    } else {
      const ft = parseFloat(formData.heightFt);
      const inches = parseFloat(formData.heightIn || '0');
      heightCm = (ft * 12 + inches) * 2.54;
      startWeight = parseFloat(formData.weight) / 2.20462;
    }

    const profile: Profile = {
      name: formData.name.trim(),
      heightCm,
      age: parseFloat(formData.age),
      startWeight,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      units,
    };

    if (formData.goalWeight) {
      const gw = parseFloat(formData.goalWeight);
      profile.goalWeight = units === 'imperial' ? gw / 2.20462 : gw;
    }

    if (formData.goalDate) {
      profile.goalDate = formData.goalDate;
    }

    onProfileSaved(profile);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleUnitToggle = (system: UnitSystem) => {
    setUnits(system);
    setErrors({});
  };

  const weightLabel = units === 'metric' ? 'kg' : 'lbs';

  return (
    <div className="profile-setup">
      <div className="setup-container">
        <h1>Weight Loss Tracker</h1>
        <p className="subtitle">Let's get started with your profile</p>

        <div className="unit-toggle">
          <button
            type="button"
            className={`unit-btn${units === 'metric' ? ' active' : ''}`}
            onClick={() => handleUnitToggle('metric')}
          >
            Metric (kg / cm)
          </button>
          <button
            type="button"
            className={`unit-btn${units === 'imperial' ? ' active' : ''}`}
            onClick={() => handleUnitToggle('imperial')}
          >
            Imperial (lbs / ft)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>

          {units === 'metric' ? (
            <div className="form-group">
              <label htmlFor="heightCm">Height (cm) *</label>
              <input
                id="heightCm"
                type="number"
                name="heightCm"
                value={formData.heightCm}
                onChange={handleChange}
                placeholder="e.g., 175"
                step="0.1"
              />
              {errors.heightCm && <span className="error">{errors.heightCm}</span>}
            </div>
          ) : (
            <div className="form-group">
              <label>Height *</label>
              <div className="height-imperial">
                <input
                  id="heightFt"
                  type="number"
                  name="heightFt"
                  value={formData.heightFt}
                  onChange={handleChange}
                  placeholder="ft"
                  step="1"
                  min="0"
                />
                <span className="unit-label">ft</span>
                <input
                  id="heightIn"
                  type="number"
                  name="heightIn"
                  value={formData.heightIn}
                  onChange={handleChange}
                  placeholder="in"
                  step="0.5"
                  min="0"
                  max="11.5"
                />
                <span className="unit-label">in</span>
              </div>
              {errors.heightFt && <span className="error">{errors.heightFt}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="age">Age *</label>
            <input
              id="age"
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g., 30"
              step="1"
            />
            {errors.age && <span className="error">{errors.age}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="weight">Starting Weight ({weightLabel}) *</label>
            <input
              id="weight"
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder={units === 'metric' ? 'e.g., 85' : 'e.g., 187'}
              step="0.1"
            />
            {errors.weight && <span className="error">{errors.weight}</span>}
          </div>

          <div className="form-divider">
            <span>Goal (optional)</span>
          </div>

          <div className="form-group">
            <label htmlFor="goalWeight">Goal Weight ({weightLabel})</label>
            <input
              id="goalWeight"
              type="number"
              name="goalWeight"
              value={formData.goalWeight}
              onChange={handleChange}
              placeholder={units === 'metric' ? 'e.g., 75' : 'e.g., 165'}
              step="0.1"
            />
            {errors.goalWeight && <span className="error">{errors.goalWeight}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="goalDate">Goal Date</label>
            <input
              id="goalDate"
              type="date"
              name="goalDate"
              value={formData.goalDate}
              onChange={handleChange}
              min={format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')}
            />
            {errors.goalDate && <span className="error">{errors.goalDate}</span>}
          </div>

          <button type="submit" className="submit-btn">
            Start Tracking
          </button>
        </form>
      </div>
    </div>
  );
};
