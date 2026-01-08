import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const API = "https://badminton-api-j9ja.onrender.com";

const PlayerProfileScreen = () => {
  const navigate = useNavigate();

  // 🔹 Players (cache-first)
  const [players, setPlayers] = useState(() => {
    const cached = localStorage.getItem("players");
    return cached ? JSON.parse(cached) : [];
  });

  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [profile, setProfile] = useState(null);

  // ----------------------------------
  // 1️⃣ Load players (eslint-safe)
  // ----------------------------------
  useEffect(() => {
    // If players already exist, just select first player once
    if (players.length > 0 && !selectedPlayer) {
      setSelectedPlayer(players[0]);
      return;
    }

    // Fetch only if players list is empty
    if (players.length === 0) {
      fetch(`${API}/get_players`)
        .then((res) => res.json())
        .then((data) => {
          const list = data || [];
          setPlayers(list);
          localStorage.setItem("players", JSON.stringify(list));
          if (list.length > 0) setSelectedPlayer(list[0]);
        })
        .catch(() => {
          setPlayers([]);
          setSelectedPlayer("");
        });
    }
  }, [players, selectedPlayer]); // ✅ ESLint-compliant

  // ----------------------------------
  // 2️⃣ Load profile (player-specific cache)
  // ----------------------------------
  useEffect(() => {
    if (!selectedPlayer) {
      setProfile(null);
      return;
    }

    const cacheKey = `player_profile_${selectedPlayer}`;
    const cachedProfile = localStorage.getItem(cacheKey);

    if (cachedProfile) {
      setProfile(JSON.parse(cachedProfile));
      return;
    }

    fetch(
      `${API}/get_player_profile?name=${encodeURIComponent(selectedPlayer)}`
    )
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setProfile(null);
      });
  }, [selectedPlayer]);

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <h2>👤 Player Profile</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="playerSelect">Select Player: </label>
        <select
          id="playerSelect"
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
        >
          {players.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {!profile ? (
        <div>Loading profile...</div>
      ) : (
        <>
          <p>
            Matches: <strong>{profile.played}</strong> | Wins:{" "}
            <strong>{profile.won}</strong> | Losses:{" "}
            <strong>{profile.lost}</strong> | Win Rate:{" "}
            <strong>{profile.win_rate}%</strong> | Avg Pt Diff:{" "}
            <strong>{profile.avg_point_diff}</strong>
          </p>

          <div style={{ marginTop: "2rem" }}>
            <h3>📈 Rating Progression</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profile.rating_progression}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => val.split("T")[0]}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#8884d8"
                  name="Rating"
                />
                <Line
                  type="monotone"
                  dataKey="win_rate"
                  stroke="#82ca9d"
                  name="Win %"
                />
                <Line
                  type="monotone"
                  dataKey="point_diff"
                  stroke="#ff7300"
                  name="Pt Diff"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ⬅ Back to Home
        </button>
      </div>
    </div>
  );
};

export default PlayerProfileScreen;
