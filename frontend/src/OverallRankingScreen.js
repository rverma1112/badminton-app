import React, { useEffect, useState } from "react";

const OverallRankingScreen = ({ onBack }) => {
  const [rankings, setRankings] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "final_rating", direction: "desc" });

  useEffect(() => {
    fetch("https://badminton-api-j9ja.onrender.com/get_rankings")
      .then((res) => res.json())
      .then((data) => setRankings(data.rankings || []));
  }, []);

  const sortedRankings = [...rankings].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
    if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getHeader = (label, key) => (
    <th style={thStyle} onClick={() => requestSort(key)}>
      {label} {sortConfig.key === key ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div style={{ padding: "1rem", maxWidth: "900px", margin: "0 auto", fontFamily: "Segoe UI, sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>🌐 Overall Player Rankings</h2>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ background: "#f0f0f0", textAlign: "left", cursor: "pointer" }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Player</th>
            {getHeader("P", "played")}
            {getHeader("W", "won")}
            {getHeader("L", "lost")}
            {getHeader("Win%", "win_rate")}
            {getHeader("Rating", "final_rating")}
          </tr>
        </thead>
        <tbody>
          {sortedRankings.map((r, i) => (
            <tr
              key={r.name}
              style={{
                background: i % 2 === 0 ? "#fff" : "#f9f9f9",
                borderBottom: "1px solid #eee",
              }}
            >
              <td style={tdStyle}>{i + 1}</td>
              <td style={tdStyle}>
                <strong>{r.name}</strong>
                <div style={{ fontSize: "0.75rem", color: "#555" }}>
                  {r.best_partner ? `Best: ${r.best_partner.partner} (${r.best_partner.win_pct}%)` : "Best: -"}<br />
                  {r.worst_partner ? `Worst: ${r.worst_partner.partner} (${r.worst_partner.win_pct}%)` : "Worst: -"}
                </div>
              </td>
              <td style={tdStyle}>{r.played}</td>
              <td style={tdStyle}>{r.won}</td>
              <td style={tdStyle}>{r.lost}</td>
              <td style={tdStyle}>{r.win_rate}%</td>
              <td style={{ ...tdStyle, fontWeight: "bold", color: "#007bff" }}>{r.final_rating}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button
          onClick={onBack}
          style={{
            padding: "10px 20px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          ⬅ Back to Home
        </button>
      </div>
    </div>
  );
};

const thStyle = {
  padding: "10px 6px",
  borderBottom: "2px solid #ddd",
  userSelect: "none",
};

const tdStyle = {
  padding: "8px 6px",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

export default OverallRankingScreen;
