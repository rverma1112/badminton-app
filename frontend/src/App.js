import React, { useState, useEffect } from "react";
import GameScreen from "./GameScreen";
import DailyRankingScreen from "./DailyRankingScreen";
import PreviousGamesScreen from "./PreviousGamesScreen";
import OverallRankingScreen from "./OverallRankingScreen";
import PlayerProfileScreen from "./PlayerProfileScreen";
import HomeScreen from "./HomeScreen";
import OngoingGamesScreen from "./OngoingGamesScreen";
import CreateGameScreen from "./CreateGameScreen";
import AddPlayerScreen from "./AddPlayerScreen";
import { useStatus } from "./useStatus";


import { Routes, Route, useNavigate } from "react-router-dom";

const API = "https://badminton-api-j9ja.onrender.com";

const App = () => {
  const navigate = useNavigate();

  //const [players, setPlayers] = useState([]);
  const [players, setPlayers] = useState(() => {
  const cached = localStorage.getItem("players");
  return cached ? JSON.parse(cached) : [];
});

  const [currentGame, setCurrentGame] = useState(null);
  const [ongoingGames, setOngoingGames] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);

  useEffect(() => {
  if (players.length > 0) return;

  fetch(`${API}/get_players`)
    .then((res) => res.json())
    .then((data) => {
      const list = data || [];
      setPlayers(list);
      localStorage.setItem("players", JSON.stringify(list));
    })
    .catch(() => setPlayers([]));
}, [players]);


  // Load ongoing games
  useEffect(() => {
    fetch(`${API}/get_ongoing_games`)
      .then((res) => res.json())
      .then((data) => setOngoingGames(data.games));
  }, []);
const { status, loading } = useStatus(false);

if (loading) {
  return <p>Checking backend status…</p>;
}

if (!status || status.backend !== "ok") {
  return <p>Backend is waking up. Please wait…</p>;
}

  // 🔴 COMPLETE GAME (THIS IS THE KEY FIX)
  const endGame = async (wins, scores) => {
    const matchStats = currentGame.matches.map((match, i) => {
      const score = scores[i];
      const team1Score = parseInt(score.team1 || "0");
      const team2Score = parseInt(score.team2 || "0");

      return {
        players: [...match.team1, ...match.team2],
        team1: match.team1,
        team2: match.team2,
        team1Score,
        team2Score,
      };
    });

    const stats = {};

    matchStats.forEach((m) => {
      const margin = Math.abs(m.team1Score - m.team2Score);
      const team1Won = m.team1Score > m.team2Score;

      [...m.team1, ...m.team2].forEach((player) => {
        if (!stats[player]) {
          stats[player] = {
            name: player,
            played: 0,
            won: 0,
            lost: 0,
            pointSum: 0,
          };
        }
      });

      m.team1.forEach((p) => {
        stats[p].played++;
        if (team1Won) {
          stats[p].won++;
          stats[p].pointSum += margin;
        } else {
          stats[p].lost++;
          stats[p].pointSum -= margin;
        }
      });

      m.team2.forEach((p) => {
        stats[p].played++;
        if (!team1Won) {
          stats[p].won++;
          stats[p].pointSum += margin;
        } else {
          stats[p].lost++;
          stats[p].pointSum -= margin;
        }
      });
    });

    const statsArray = Object.values(stats).map((s) => ({
      ...s,
      pointDifferential:
        s.played > 0 ? (s.pointSum / s.played).toFixed(2) : 0,
    }));

    await fetch(`${API}/complete_game`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: currentGame.id,
        players: currentGame.players,
        teams: currentGame.teams,
        match_count: currentGame.match_count,
        matches: currentGame.matches,
        results: scores,
        created_at: currentGame.created_at,
        ended_at: new Date().toISOString(),
        stats: statsArray,
      }),
    });

    await fetch(`${API}/end_game`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_id: currentGame.id }),
    });

    // 🔥🔥🔥 FRONTEND CACHE INVALIDATION (THIS FIXES REFRESH ISSUE)
    localStorage.removeItem("players");
    localStorage.removeItem("rankings_overall");
    localStorage.removeItem("rankings_singles");
    localStorage.removeItem("rankings_doubles");

    Object.keys(localStorage)
      .filter((k) => k.startsWith("player_profile_"))
      .forEach((k) => localStorage.removeItem(k));

    // Update local state
    setOngoingGames((prev) =>
      prev.filter((game) => game.id !== currentGame.id)
    );
    setDailyStats(statsArray);
    setCurrentGame(null);

    navigate("/daily-ranking");
  };

  const handleAddPlayer = async (name) => {
    await fetch(`${API}/add_player`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const updatedPlayers = await fetch(`${API}/get_players`).then((r) =>
      r.json()
    );
    setPlayers(updatedPlayers);
    localStorage.setItem("players", JSON.stringify(updatedPlayers));

  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <Routes>
        <Route path="/" element={<HomeScreen ongoingGames={ongoingGames} />} />
        <Route
          path="/add-player"
          element={<AddPlayerScreen onAddPlayer={handleAddPlayer} />}
        />
        <Route
          path="/ongoing"
          element={
            <OngoingGamesScreen
              ongoingGames={ongoingGames}
              setCurrentGame={setCurrentGame}
            />
          }
        />
        <Route
          path="/create"
          element={
            <CreateGameScreen
              players={players}
              setCurrentGame={setCurrentGame}
              setOngoingGames={setOngoingGames}
            />
          }
        />
        <Route
          path="/game"
          element={<GameScreen game={currentGame} onEndGame={endGame} />}
        />
        <Route path="/previous" element={<PreviousGamesScreen />} />
        <Route path="/rankings" element={<OverallRankingScreen />} />
        <Route path="/profile" element={<PlayerProfileScreen />} />
        <Route
          path="/daily-ranking"
          element={<DailyRankingScreen stats={dailyStats} />}
        />
      </Routes>
    </div>
  );
};

export default App;
