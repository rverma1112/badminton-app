# Badminton Tracker App

A full‑stack web application to manage and analyze badminton games, players, statistics, and rankings.

## 🚀 Features

* Create games with doubles or singles format
* Random team generation and fair game distribution
* Score input with lock/edit functionality
* Match persistence across reloads
* Game completion and historical archive
* Automatic stat collection & ranking updates
* Player profiles with advanced insights
* Downloadable player data
* Responsive React UI (no UI library)

## 🏗️ Tech Stack

### Frontend

* React
* Plain CSS (responsive layout)

### Backend

* Flask (Python)
* SQLAlchemy ORM
* PostgreSQL (via Supabase)

## 📂 Project Structure

```
project/
│── frontend/       # React application
│── backend/        # Flask server
│   ├── app.py      # API endpoints
│   ├── db.py       # Database models & functions
│── README.md
│── .gitignore
```

## ⚙️ Backend Highlights

* Uses PostgreSQL via Supabase for persistence
* Game lifecycle: create → update → complete → archive
* Stores match scores, completed games, & player stats
* Ranking formula:

```
Rating = 0.4 × Performance + 0.3 × Win% + 0.2 × Experience
```

## 📊 Player Profiles

Each player profile displays:

* Best/Worst partner
* Favourite/Least favourite opponent
* Top X partners & opponents
* Filter stats by date range (7d, 30d, all time)
* Download data

## 🧠 Planned AI/ML Insights

* Insights from historical performance
* Trend graphs for rating & stats progression

## 🖼️ Screens

* Home
* Create Game
* Game Screen (score entry)
* Rankings
* Players
* Previous Games
* Player Detail

## 🔒 Match Entry Rules

* Two input boxes per match (team1, team2)
* Save button locks score
* Edit button unlocks
* Scores persist on reload
* Partial entry not allowed

## 📦 Setup

### Backend

```
pip install -r requirements.txt
python app.py
```

### Frontend

```
npm install
npm start
```

## 🔧 Configuration

Environment variables required:

```
SUPABASE_URL=
SUPABASE_DB_CONNECTION_STRING=
```

## 🧹 .gitignore

Includes typical React + Python ignores

## ✅ Status

✅ Migrated to PostgreSQL
✅ Stats + Ranking updates on game completion
⬜ AI/ML insights (in progress)

## 📜 License

MIT License
