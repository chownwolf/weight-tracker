import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoodEntry } from '../types';
import { format } from 'date-fns';
import './Calories.css';

interface OFFProduct {
  product_name: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
  serving_size?: string;
}

interface CaloriesProps {
  foodEntries: FoodEntry[];
  dailyCalorieGoal?: number;
  onAddEntry: (entry: Omit<FoodEntry, 'id'>) => void;
  onDeleteEntry: (id: string) => void;
  onSetGoal: (goal: number) => void;
}

export const Calories: React.FC<CaloriesProps> = ({
  foodEntries,
  dailyCalorieGoal,
  onAddEntry,
  onDeleteEntry,
  onSetGoal,
}) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mode, setMode] = useState<'search' | 'manual'>('search');

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OFFProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OFFProduct | null>(null);
  const [grams, setGrams] = useState('100');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Manual state
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', servingDesc: '' });

  // Goal editing
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyCalorieGoal?.toString() ?? '');

  const todayEntries = foodEntries.filter((e) => e.date === selectedDate);
  const totalCalories = todayEntries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = todayEntries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = todayEntries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = todayEntries.reduce((s, e) => s + e.fat, 0);
  const goalPct = dailyCalorieGoal ? Math.min((totalCalories / dailyCalorieGoal) * 100, 100) : 0;

  const searchFoods = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowDropdown(false); return; }
    setSearching(true);
    setSearchError(false);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=8&fields=product_name,nutriments,serving_size`
      );
      const data = await res.json();
      const valid = (data.products as OFFProduct[]).filter(
        (p) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null
      );
      setResults(valid);
      setShowDropdown(true);
    } catch {
      setSearchError(true);
      setShowDropdown(false);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!query.trim()) { setResults([]); setShowDropdown(false); return; }
    searchRef.current = setTimeout(() => searchFoods(query), 400);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [query, searchFoods]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const calcNutrient = (per100g: number | undefined) =>
    per100g != null ? Math.round((parseFloat(grams) / 100) * per100g) : 0;

  const handleSelectProduct = (p: OFFProduct) => {
    setSelectedProduct(p);
    setQuery(p.product_name);
    setShowDropdown(false);
    setGrams('100');
  };

  const handleSearchLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const g = parseFloat(grams);
    if (!g || g <= 0) return;
    onAddEntry({
      date: selectedDate,
      name: selectedProduct.product_name,
      calories: calcNutrient(selectedProduct.nutriments['energy-kcal_100g']),
      protein: calcNutrient(selectedProduct.nutriments.proteins_100g),
      carbs: calcNutrient(selectedProduct.nutriments.carbohydrates_100g),
      fat: calcNutrient(selectedProduct.nutriments.fat_100g),
      servingDesc: `${g}g`,
    });
    setQuery('');
    setSelectedProduct(null);
    setGrams('100');
    setResults([]);
  };

  const handleManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const cal = parseFloat(manual.calories);
    if (!manual.name.trim() || !cal || cal <= 0) return;
    onAddEntry({
      date: selectedDate,
      name: manual.name.trim(),
      calories: Math.round(cal),
      protein: Math.round(parseFloat(manual.protein) || 0),
      carbs: Math.round(parseFloat(manual.carbs) || 0),
      fat: Math.round(parseFloat(manual.fat) || 0),
      servingDesc: manual.servingDesc || undefined,
    });
    setManual({ name: '', calories: '', protein: '', carbs: '', fat: '', servingDesc: '' });
  };

  const handleGoalSave = () => {
    const g = parseFloat(goalInput);
    if (g > 0) onSetGoal(Math.round(g));
    setEditingGoal(false);
  };

  const previewCalories = selectedProduct
    ? calcNutrient(selectedProduct.nutriments['energy-kcal_100g'])
    : null;

  return (
    <div className="calories">
      <div className="calories-container">

        {/* Daily summary */}
        <div className="cal-summary-card">
          <div className="cal-summary-header">
            <div className="cal-date-row">
              <h2>Calorie Tracker</h2>
              <input
                type="date"
                className="cal-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="cal-goal-row">
              {editingGoal ? (
                <div className="cal-goal-edit">
                  <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="Daily goal (kcal)"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleGoalSave(); if (e.key === 'Escape') setEditingGoal(false); }}
                  />
                  <button className="cal-goal-save-btn" onClick={handleGoalSave}>Save</button>
                  <button className="cal-goal-cancel-btn" onClick={() => setEditingGoal(false)}>✕</button>
                </div>
              ) : (
                <button className="cal-set-goal-btn" onClick={() => { setGoalInput(dailyCalorieGoal?.toString() ?? ''); setEditingGoal(true); }}>
                  {dailyCalorieGoal ? `Goal: ${dailyCalorieGoal} kcal` : 'Set daily goal'}
                </button>
              )}
            </div>
          </div>

          <div className="cal-totals">
            <div className="cal-total-main">
              <span className="cal-total-value">{totalCalories}</span>
              <span className="cal-total-label">kcal{dailyCalorieGoal ? ` / ${dailyCalorieGoal}` : ''}</span>
            </div>
            <div className="cal-macros">
              <span className="macro-tag protein">{totalProtein}g protein</span>
              <span className="macro-tag carbs">{totalCarbs}g carbs</span>
              <span className="macro-tag fat">{totalFat}g fat</span>
            </div>
          </div>

          {dailyCalorieGoal && (
            <div className="cal-progress-bar-container">
              <div className="cal-progress-bar">
                <div
                  className={`cal-progress-fill${goalPct >= 100 ? ' over' : ''}`}
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <span className="cal-progress-text">{Math.round(goalPct)}% of daily goal</span>
            </div>
          )}
        </div>

        {/* Add food */}
        <div className="cal-add-card">
          <div className="cal-mode-toggle">
            <button className={`cal-mode-btn${mode === 'search' ? ' active' : ''}`} onClick={() => setMode('search')}>
              Search Food
            </button>
            <button className={`cal-mode-btn${mode === 'manual' ? ' active' : ''}`} onClick={() => setMode('manual')}>
              Manual Entry
            </button>
          </div>

          {mode === 'search' && (
            <form onSubmit={handleSearchLog} className="cal-search-form">
              <div className="cal-search-row" ref={dropdownRef}>
                <div className="cal-search-input-wrap">
                  <input
                    type="text"
                    className="cal-search-input"
                    placeholder="Search for a food…"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelectedProduct(null); }}
                    onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                    autoComplete="off"
                  />
                  {searching && <span className="cal-searching-indicator">…</span>}
                  {showDropdown && results.length > 0 && (
                    <ul className="cal-dropdown">
                      {results.map((p, i) => (
                        <li key={i} className="cal-dropdown-item" onMouseDown={() => handleSelectProduct(p)}>
                          <span className="cal-dropdown-name">{p.product_name}</span>
                          <span className="cal-dropdown-cal">{Math.round(p.nutriments['energy-kcal_100g'] ?? 0)} kcal/100g</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {showDropdown && results.length === 0 && !searching && query.trim() && (
                    <div className="cal-dropdown cal-dropdown-empty">No results — try manual entry</div>
                  )}
                  {searchError && (
                    <div className="cal-search-error">Search unavailable — use manual entry</div>
                  )}
                </div>

                <div className="cal-grams-wrap">
                  <input
                    type="number"
                    className="cal-grams-input"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                    placeholder="g"
                    step="1"
                    min="1"
                  />
                  <span className="cal-grams-label">g</span>
                </div>
              </div>

              {selectedProduct && previewCalories != null && (
                <div className="cal-preview">
                  <span className="macro-tag protein">{calcNutrient(selectedProduct.nutriments.proteins_100g)}g protein</span>
                  <span className="macro-tag carbs">{calcNutrient(selectedProduct.nutriments.carbohydrates_100g)}g carbs</span>
                  <span className="macro-tag fat">{calcNutrient(selectedProduct.nutriments.fat_100g)}g fat</span>
                  <span className="cal-preview-kcal">{previewCalories} kcal</span>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={!selectedProduct}>
                Log Food
              </button>
            </form>
          )}

          {mode === 'manual' && (
            <form onSubmit={handleManualLog} className="cal-manual-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="m-name">Food name *</label>
                  <input id="m-name" type="text" value={manual.name} onChange={(e) => setManual((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Chicken breast" />
                </div>
                <div className="form-group">
                  <label htmlFor="m-serving">Serving (optional)</label>
                  <input id="m-serving" type="text" value={manual.servingDesc} onChange={(e) => setManual((p) => ({ ...p, servingDesc: e.target.value }))} placeholder="e.g. 200g, 1 cup" />
                </div>
              </div>
              <div className="cal-macro-row">
                <div className="form-group">
                  <label htmlFor="m-cal">Calories (kcal) *</label>
                  <input id="m-cal" type="number" step="1" value={manual.calories} onChange={(e) => setManual((p) => ({ ...p, calories: e.target.value }))} placeholder="e.g. 250" />
                </div>
                <div className="form-group">
                  <label htmlFor="m-protein">Protein (g)</label>
                  <input id="m-protein" type="number" step="0.1" value={manual.protein} onChange={(e) => setManual((p) => ({ ...p, protein: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label htmlFor="m-carbs">Carbs (g)</label>
                  <input id="m-carbs" type="number" step="0.1" value={manual.carbs} onChange={(e) => setManual((p) => ({ ...p, carbs: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label htmlFor="m-fat">Fat (g)</label>
                  <input id="m-fat" type="number" step="0.1" value={manual.fat} onChange={(e) => setManual((p) => ({ ...p, fat: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <button type="submit" className="submit-btn">Log Food</button>
            </form>
          )}
        </div>

        {/* Entries list */}
        <div className="cal-entries-card">
          <h2>
            {selectedDate === format(new Date(), 'yyyy-MM-dd')
              ? "Today's Food Log"
              : `Food Log — ${format(new Date(selectedDate), 'MMM d, yyyy')}`}
          </h2>
          {todayEntries.length === 0 ? (
            <p className="cal-empty">No food logged for this day.</p>
          ) : (
            <ul className="cal-entries-list">
              {todayEntries.map((entry) => (
                <li key={entry.id} className="cal-entry-item">
                  <div className="cal-entry-info">
                    <span className="cal-entry-name">{entry.name}</span>
                    {entry.servingDesc && <span className="cal-entry-serving">{entry.servingDesc}</span>}
                    <div className="cal-entry-macros">
                      <span className="macro-tag protein">{entry.protein}g P</span>
                      <span className="macro-tag carbs">{entry.carbs}g C</span>
                      <span className="macro-tag fat">{entry.fat}g F</span>
                    </div>
                  </div>
                  <div className="cal-entry-right">
                    <span className="cal-entry-kcal">{entry.calories} kcal</span>
                    <button className="cal-delete-btn" onClick={() => onDeleteEntry(entry.id)} aria-label="Delete entry">×</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};
