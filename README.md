# FocusTrack — Full-Stack Study & Monthly Tracker App

A modern, responsive full-stack study and monthly habit tracker built from scratch with **React 18**, **Vite**, **Tailwind CSS**, **Express.js**, and a persistent **local SQLite database**.

---

## 🌟 Key Features

### 1. 📅 Interactive Monthly Calendar View
- Visual month matrix with previous/next month navigation and "Today" shortcut.
- Color-coded intensity levels indicating study hours (0m, <1h, 1-2h, 2-4h, 4h+).
- Subject colored pills/dots displayed right on each day.
- **Day Details Modal**: Click any calendar day to inspect all sessions logged on that date, delete entries, or log a new study session for that day.
- Quick hover `+` button to log a session directly onto that date.

### 2. 🔥 GitHub-Style Activity & Streak Heatmap
- Continuous 52-week (1-year) or 26-week (6-month) activity contribution grid.
- Dynamic color intensity levels matching your daily study volume.
- Real-time statistics:
  - **Current Streak** (in days with active status check)
  - **Longest Record Streak**
  - **Total Active Study Days**
  - **All-Time Hours Studied**
- Interactive hover tooltips showing date, hours/minutes, and session counts.

### 3. ⏱️ Built-in Pomodoro & Focus Timer
- Modes: **Pomodoro (25m)**, **Short Break (5m)**, **Long Break (15m)**, and **Stopwatch / Open Focus**.
- Circular animated SVG countdown ring.
- Subject selector dropdown.
- Audio alert chime synthesized via Web Audio API (zero external sound files needed).
- **One-Click Session Logging**: Directly transfers elapsed study time into a persisted SQLite database record!
- Minimizable floating widget so you can browse the calendar while studying.

### 4. 📚 Subject & Topic Management
- Custom subject categories with customizable color accents.
- Weekly target hours per subject.
- All-time study duration tracking per category.
- Full CRUD (Create, Edit, Delete with cascade protection).

### 5. 🎯 Monthly Goals & Analytics
- Monthly target hour goal with live percentage progress bar.
- Inline goal editor.
- Category distribution breakdown (percentage and hours).
- Recent sessions activity feed with focus ratings (1–5 stars).

### 6. 🗄️ Local SQLite Database
- Database stored in `server/data/tracker.sqlite`.
- Uses Node.js native `node:sqlite` engine (no external C++ compilers or node-gyp native build issues).
- Automatically seeds realistic sample study data on first run so your calendar and heatmap look full and alive right away!
- Reset database button available anytime in the footer.

---

## 🚀 Quick Start Guide

### Start Development Server (Full-Stack)
Run both the Express backend and React Vite frontend concurrently:

```bash
npm run dev
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🛠️ Tech Stack & Architecture

```
dev_2/
├── client/                     # Frontend (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Navigation header with timer toggle & quick log
│   │   │   ├── StatsOverview.jsx       # 4 top metric cards & monthly goal progress
│   │   │   ├── CalendarView.jsx        # Monthly calendar grid with intensity styling
│   │   │   ├── HeatmapView.jsx         # 52-week GitHub-style contribution heatmap
│   │   │   ├── PomodoroTimer.jsx       # Circular focus timer & audio chime
│   │   │   ├── SubjectManager.jsx      # Subject CRUD & color selector
│   │   │   ├── SessionLoggerModal.jsx  # Study log modal with presets & ratings
│   │   │   └── DayDetailsModal.jsx     # Date inspection modal
│   │   ├── api.js                      # REST API client
│   │   ├── App.jsx                     # Main application layout
│   │   └── index.css                   # Tailwind styles & heatmap grid CSS
│   ├── vite.config.js                  # Vite server & /api proxy to localhost:5000
│   └── package.json
├── server/                     # Backend (Express.js + SQLite)
│   ├── db.js                   # node:sqlite database migrations, queries, and seeding
│   ├── index.js                # Express REST API routes & static client serving
│   ├── data/
│   │   └── tracker.sqlite      # SQLite database file
│   └── package.json
├── start-dev.js                # Unified startup script
└── package.json
```

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & server timestamp |
| `GET` | `/api/subjects` | List all study subjects with total minutes |
| `POST` | `/api/subjects` | Create a new subject |
| `PUT` | `/api/subjects/:id` | Update subject details |
| `DELETE` | `/api/subjects/:id` | Delete subject |
| `GET` | `/api/sessions` | Get sessions (supports `?startDate`, `?endDate`, `?month`, `?year`, `?subjectId`) |
| `POST` | `/api/sessions` | Log a new study session |
| `PUT` | `/api/sessions/:id` | Update an existing session |
| `DELETE` | `/api/sessions/:id` | Delete a session |
| `GET` | `/api/calendar` | Monthly summary & daily minutes for calendar (`?year=YYYY&month=MM`) |
| `GET` | `/api/stats/heatmap` | 365-day daily minutes array for GitHub-style heatmap |
| `GET` | `/api/stats/summary` | Dashboard statistics (streak, today, week, month, recent sessions) |
| `GET` | `/api/goals/monthly` | Get target goal for month |
| `POST` | `/api/goals/monthly` | Set target hours for month |
| `POST` | `/api/reset` | Reset and reseed sample data |
