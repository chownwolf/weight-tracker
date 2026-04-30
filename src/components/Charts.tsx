import React, { useMemo } from 'react';
import type { Profile, WeightEntry } from '../types';
import { useCalculations } from '../hooks/useCalculations';
import { displayWeight, weightUnit } from '../utils/units';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { getWeeklyAverages, projectWeightAtDate } from '../utils/calculations';
import './Charts.css';

interface ChartsProps {
  profile: Profile;
  entries: WeightEntry[];
}

export const Charts: React.FC<ChartsProps> = ({ profile, entries }) => {
  const { stats } = useCalculations(profile, entries);
  const units = profile.units ?? 'metric';
  const unit = weightUnit(units);

  const weightTrendData = useMemo(() => {
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sortedEntries.map((entry) => ({
      date: format(new Date(entry.date), 'MMM d'),
      weight: displayWeight(entry.weight, units),
      bmi: Math.round((entry.weight / ((profile.heightCm / 100) ** 2)) * 100) / 100,
    }));
  }, [entries, profile.heightCm, units]);

  const weeklyData = useMemo(() => {
    return getWeeklyAverages(entries, 12).map((d) => ({
      ...d,
      averageWeight: displayWeight(d.averageWeight, units),
      weight: displayWeight(d.weight, units),
    }));
  }, [entries, units]);

  const projectionData = useMemo(() => {
    if (!stats || !profile.goalWeight) return [];

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sortedEntries.length === 0) return [];

    const goalWeight = displayWeight(profile.goalWeight, units);
    const data: Array<{ date: string; actual?: number; projected?: number; goal: number }> =
      sortedEntries.slice(-20).map((entry) => ({
        date: format(new Date(entry.date), 'MMM d'),
        actual: displayWeight(entry.weight, units),
        goal: goalWeight,
      }));

    const lastDate = new Date(sortedEntries[sortedEntries.length - 1].date);
    for (let i = 1; i <= 12; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i * 7);

      const projectedKg = projectWeightAtDate(
        stats.currentWeight,
        stats.weeklyAverageRate,
        futureDate.toISOString()
      );

      data.push({
        date: format(futureDate, 'MMM d'),
        projected: displayWeight(projectedKg, units),
        goal: goalWeight,
      });
    }

    return data;
  }, [entries, profile.goalWeight, stats, units]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="charts">
      <div className="charts-container">
        <h1>Progress Charts</h1>

        <div className="charts-grid">
          <div className="chart-card">
            <h2>Weight Trend</h2>
            {weightTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weightTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#667eea"
                    dot={{ fill: '#667eea', r: 4 }}
                    activeDot={{ r: 6 }}
                    name={`Weight (${unit})`}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">Add weight entries to see charts</p>
            )}
          </div>

          <div className="chart-card">
            <h2>BMI Trend</h2>
            {weightTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weightTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bmi"
                    stroke="#764ba2"
                    dot={{ fill: '#764ba2', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="BMI"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">Add weight entries to see charts</p>
            )}
          </div>

          <div className="chart-card">
            <h2>Weekly Average Weight</h2>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="averageWeight" fill="#667eea" name={`Avg Weight (${unit})`} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">Add weight entries to see charts</p>
            )}
          </div>

          <div className="chart-card">
            <h2>Goal Projection</h2>
            {profile.goalWeight && projectionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {projectionData.some((d) => d.actual !== undefined) && (
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#667eea"
                      dot={{ fill: '#667eea', r: 4 }}
                      name="Actual Weight"
                    />
                  )}
                  {projectionData.some((d) => d.projected !== undefined) && (
                    <Line
                      type="monotone"
                      dataKey="projected"
                      stroke="#f39c12"
                      strokeDasharray="5 5"
                      dot={false}
                      name="Projection"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="goal"
                    stroke="#27ae60"
                    strokeDasharray="5 5"
                    dot={false}
                    name="Goal"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">Set a weight goal to see projections</p>
            )}
          </div>
        </div>

        {stats && (
          <div className="stats-summary">
            <h2>Summary</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Total Weight Loss:</span>
                <span className="value">{displayWeight(stats.totalWeightLoss, units)} {unit}</span>
              </div>
              <div className="summary-item">
                <span className="label">Weekly Average Loss:</span>
                <span className="value">{displayWeight(Math.abs(stats.weeklyAverageRate), units)} {unit}/week</span>
              </div>
              <div className="summary-item">
                <span className="label">Days Active:</span>
                <span className="value">{stats.daysActive}</span>
              </div>
              <div className="summary-item">
                <span className="label">Entries Logged:</span>
                <span className="value">{stats.entryCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
