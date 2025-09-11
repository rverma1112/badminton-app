import React, { useEffect, useState } from "react";

const OverallRankingScreen = ({ onBack }) => {
  const [overall, setOverall] = useState([]);
  const [singles, setSingles] = useState([]);
  const [doubles, setDoubles] = useState([]);

  useEffect(() => {
    fetch("https://badminton-api-j9ja.onrender.com/get_overall_rankings")
      .then((res) => res.json())
      .then((data) => setOverall(data.rankings || []));

    fetch("https://badminton-api-j9ja.onrender.com/get_singles_rankings")
      .then((res) => res.json())
      .then((data) => setSingles(data.rankings || []));

    fetch("https://badminton-api-j9ja.onrender.com/get_doubles_rankings")
      .then((res) => res.json())
      .then((data) => setDoubles(data.rankings || []));
  }, []);

  const renderTable = (title, rankings, showPartners = false) => (
    <div style={{ marginBottom: "3rem" }}>
      <h3 style={{ textAlign: "center", margin: "1rem 0" }}>{title}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
        <thead>
          <tr style={{ background: "#f0f0f0", textAlign: "left" }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Player</th>
            <th style={thStyle}>Played</th>
            <th style={thStyle}>Won</th>
            <th style={thStyle}>Lost</th>
            <th style={thStyle}>Win%</th>
            <th style={thStyle}>Pt Diff</th>
            <th style={thStyle}>Rating</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r, i) => (
            <tr
              key={r.name}
              style={{
                background: i % 2 === 0 ? "#fff" : "#f9f9f9",
                borderBottom: "1px solid #eee"
              }}
            >
              <td style={tdStyle}>{i + 1}</td>
              <td style={tdStyle}>
                <strong>{r.name}</strong>
                {showPartners && (
                  <div style={{ fontSize: "0.8rem", color: "#555" }}>
                    {r.best_partner && (
                      <div>Best: {r.best_partner.partner} ({r.best_partner.win_pct}%)</div>
                    )}
                    {r.worst_partner && (
                      <div>Worst: {r.worst_partner.partner} ({r.worst_partner.win_pct}%)</div>
                    )}
                  </div>
                )}
              </td>
              <td style={tdStyle}>{r.played}</td>
              <td style={tdStyle}>{r.won}</td>
              <td style={tdStyle}>{r.lost}</td>
              <td style={tdStyle}>{r.win_rate}%</td>
              <td style={tdStyle}>{r.point_diff}</td>
              <td style={{ ...tdStyle, fontWeight: "bold", color: "#007bff" }}>{r.final_rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto", fontFamily: "Segoe UI, sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>🌐 Player Rankings</h2>

      {renderTable("🏸 Overall Rankings", overall, true)}
      {renderTable("👤 Singles Rankings", singles, false)}
      {renderTable("🤝 Doubles Rankings", doubles, true)}

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button
          onClick={onBack}
          style={{
            padding: "10px 20px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          ⬅ Back to Home
        </button>
      </div>
    </div>
  );
};

// Styles
const thStyle = {
  padding: "12px 10px",
  borderBottom: "2px solid #ddd",
};

const tdStyle = {
  padding: "10px 8px",
  verticalAlign: "top"
};

export default OverallRankingScreen;
