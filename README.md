# Weight Loss Tracker

A local-first weight tracking app built with React, TypeScript, and Vite. No account required — all data stored in your browser.

## Features

- **Dashboard** — current weight, BMI, weekly rate, days active, and entry streak
- **Goal tracking** — set a target weight and date, see projected goal date based on current rate
- **Progress charts** — weight trend, BMI trend, weekly averages, and goal projection
- **Weight history** — view, edit, and delete past entries with date filtering
- **CSV export** — download your full weight history
- **Metric / Imperial** — switch between kg/cm and lbs/ft at setup; all displays update throughout
- **Dark mode** — toggle in the nav bar, persists across sessions
- **Fully offline** — no server, no account, data lives in `localStorage`

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Charts | Recharts |
| Date utils | date-fns |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx      # Stats, weight entry form, goal progress
│   ├── Charts.tsx         # Weight trend, BMI, weekly avg, projection charts
│   ├── WeightHistory.tsx  # Entry table with edit/delete and CSV export
│   ├── Navigation.tsx     # Nav bar with dark mode toggle
│   └── ProfileSetup.tsx   # Onboarding form (units, height, weight, goal)
├── hooks/
│   ├── useWeightData.ts   # localStorage read/write
│   └── useCalculations.ts # BMI, stats, goal projection, streak
├── utils/
│   ├── calculations.ts    # Pure calculation functions
│   ├── storage.ts         # localStorage helpers
│   └── units.ts           # Metric ↔ imperial conversion
└── types/
    └── index.ts           # Shared TypeScript types
```

## Data & Privacy

All data is stored in `localStorage` under the key `weight-tracker-app-state`. Nothing is sent to any server. Use the **Export CSV** button in History to back up your data, or **Reset** in the nav bar to wipe everything.


## Hosted Option

I have a version running [https://wtrkr.cmwolford.com/](https://wtrkr.cmwolford.com/) in your browser of choice. 