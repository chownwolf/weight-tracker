import React, { useState, useMemo } from 'react';
import type { WeightEntry, UnitSystem } from '../types';
import { displayWeight, inputToKg, weightUnit } from '../utils/units';
import { format } from 'date-fns';
import './WeightHistory.css';

const downloadCSV = (entries: WeightEntry[], units: UnitSystem) => {
  const unit = weightUnit(units);
  const rows = [
    ['Date', `Weight (${unit})`, 'Notes'],
    ...entries
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e) => [e.date, displayWeight(e.weight, units).toString(), e.notes ?? '']),
  ];
  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weight-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

interface WeightHistoryProps {
  entries: WeightEntry[];
  units: UnitSystem;
  onUpdateEntry: (id: string, weight: number, date: string, notes?: string) => void;
  onDeleteEntry: (id: string) => void;
}

export const WeightHistory: React.FC<WeightHistoryProps> = ({
  entries,
  units,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const unit = weightUnit(units);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ date: string; weight: string; notes?: string } | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');

  const sortedEntries = useMemo(() => {
    let result = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (filterDate) {
      result = result.filter((entry) => entry.date === filterDate);
    }

    return result;
  }, [entries, filterDate]);

  const handleEditStart = (entry: WeightEntry) => {
    setEditingId(entry.id);
    setEditData({
      date: entry.date,
      weight: displayWeight(entry.weight, units).toString(),
      notes: entry.notes,
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleEditSave = (id: string) => {
    if (!editData) return;

    const val = parseFloat(editData.weight);
    if (!val || val <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    onUpdateEntry(id, inputToKg(val, units), editData.date, editData.notes);
    setEditingId(null);
    setEditData(null);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      onDeleteEntry(id);
    }
  };

  return (
    <div className="weight-history">
      <div className="history-container">
        <div className="history-header">
          <h1>Weight History</h1>
          {entries.length > 0 && (
            <button className="export-btn" onClick={() => downloadCSV(entries, units)}>
              Export CSV
            </button>
          )}
        </div>

        <div className="filter-section">
          <label htmlFor="filter-date">Filter by Date:</label>
          <input
            id="filter-date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <button
              className="clear-filter-btn"
              onClick={() => setFilterDate('')}
            >
              Clear Filter
            </button>
          )}
        </div>

        {sortedEntries.length === 0 ? (
          <div className="empty-state">
            <p>No weight entries yet. Start by adding your first weight entry on the Dashboard!</p>
          </div>
        ) : (
          <div className="entries-table">
            <div className="table-header">
              <div className="col-date">Date</div>
              <div className="col-weight">Weight ({unit})</div>
              <div className="col-notes">Notes</div>
              <div className="col-actions">Actions</div>
            </div>

            {sortedEntries.map((entry) => (
              <div key={entry.id} className="table-row">
                {editingId === entry.id ? (
                  <>
                    <div className="col-date">
                      <input
                        type="date"
                        value={editData?.date}
                        onChange={(e) =>
                          setEditData((prev) => prev ? { ...prev, date: e.target.value } : null)
                        }
                      />
                    </div>
                    <div className="col-weight">
                      <input
                        type="number"
                        step="0.1"
                        value={editData?.weight}
                        onChange={(e) =>
                          setEditData((prev) => prev ? { ...prev, weight: e.target.value } : null)
                        }
                      />
                    </div>
                    <div className="col-notes">
                      <input
                        type="text"
                        value={editData?.notes || ''}
                        onChange={(e) =>
                          setEditData((prev) => prev ? { ...prev, notes: e.target.value } : null)
                        }
                        placeholder="Notes"
                      />
                    </div>
                    <div className="col-actions">
                      <button
                        className="save-btn"
                        onClick={() => handleEditSave(entry.id)}
                      >
                        Save
                      </button>
                      <button className="cancel-btn" onClick={handleEditCancel}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-date">
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </div>
                    <div className="col-weight">{displayWeight(entry.weight, units)} {unit}</div>
                    <div className="col-notes">{entry.notes || '-'}</div>
                    <div className="col-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditStart(entry)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteClick(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="stats">
          <div className="stat">
            <span className="label">Total Entries:</span>
            <span className="value">{entries.length}</span>
          </div>
          {entries.length > 0 && (
            <>
              <div className="stat">
                <span className="label">Highest Weight:</span>
                <span className="value">
                  {displayWeight(Math.max(...entries.map((e) => e.weight)), units)} {unit}
                </span>
              </div>
              <div className="stat">
                <span className="label">Lowest Weight:</span>
                <span className="value">
                  {displayWeight(Math.min(...entries.map((e) => e.weight)), units)} {unit}
                </span>
              </div>
              <div className="stat">
                <span className="label">Average Weight:</span>
                <span className="value">
                  {displayWeight(
                    entries.reduce((sum, e) => sum + e.weight, 0) / entries.length,
                    units
                  )} {unit}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
