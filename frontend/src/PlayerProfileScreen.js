import React, { useEffect, useState } from "react";
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

const PlayerProfileScreen = ({ onBack }) => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/get_players")
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data);
        setSelectedPlayer(data[0]);
      });
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      fetch(`http://localhost:5000/get_player_profile?name=${selectedPlayer}`)
        .then((res) => res.json())
        .then((data) => setProfile(data));
    }
  }, [selectedPlayer]);

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
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
            <strong>{profile.won}</strong> | Losses: <strong>{profile.lost}</strong> | Win Rate:{" "}
            <strong>{profile.win_rate}%</strong> | Avg Pt Diff:{" "}
            <strong>{profile.avg_point_diff}</strong>
          </p>

          <div style={{ marginTop: "1rem" }}>
            <h3>🤝 Partnerships</h3>
            <p>
              🥇 Best Partner:{" "}
              {profile.best_partner
                ? `${profile.best_partner.name} (${profile.best_partner.win_pct}%)`
                : "N/A"}
            </p>
            <p>
              😓 Worst Partner:{" "}
              {profile.worst_partner
                ? `${profile.worst_partner.name} (${profile.worst_partner.win_pct}%)`
                : "N/A"}
            </p>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <h3>⚔️ Opponents</h3>
            <p>
              🧠 Favourite Opponent:{" "}
              {profile.favourite_opponent
                ? `${profile.favourite_opponent.name} (${profile.favourite_opponent.win_pct}%)`
                : "N/A"}
            </p>
            <p>
              🔥 Toughest Opponent:{" "}
              {profile.least_favourite_opponent
                ? `${profile.least_favourite_opponent.name} (${profile.least_favourite_opponent.win_pct}%)`
                : "N/A"}
            </p>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h3>📈 Rating Progression</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profile.rating_progression}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(val) => val.split("T")[0]} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rating" stroke="#8884d8" name="Rating" />
                <Line type="monotone" dataKey="win_rate" stroke="#82ca9d" name="Win %" />
                <Line type="monotone" dataKey="point_diff" stroke="#ff7300" name="Pt Diff" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button onClick={onBack}>⬅ Back</button>
      </div>
    </div>
  );
};

export default PlayerProfileScreen;
