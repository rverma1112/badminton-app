// src/DailyRankingScreen.js
import React from "react";

const DailyRankingScreen = ({ stats, onBack }) => {
  return (
    <div style={{ padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
      <h2>🏆 Daily Rankings</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Rank</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Player</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Played</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Won</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Lost</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Pt Diff</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((player, idx) => (
            <tr key={player.name}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{idx + 1}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{player.name}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{player.played}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{player.won}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{player.lost}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{player.pointDifferential}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button onClick={onBack}>⬅ Back to Home</button>
      </div>
    </div>
  );
};

export default DailyRankingScreen;
