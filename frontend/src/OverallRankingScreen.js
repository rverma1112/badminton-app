import React, { useEffect, useState } from "react";

const OverallRankingScreen = ({ onBack }) => {
  const [overall, setOverall] = useState([]);
  const [singles, setSingles] = useState([]);
  const [doubles, setDoubles] = useState([]);

  useEffect(() => {
    fetch("https://badminton-api-j9ja.onrender.com/get_rankings")
      .then((res) => res.json())
      .then((data) => setOverall(data.rankings || []));

    fetch("https://badminton-api-j9ja.onrender.com/get_singles_rankings")
      .then((res) => res.json())
      .then((data) => setSingles(data.rankings || []));

    fetch("https://badminton-api-j9ja.onrender.com/get_doubles_rankings")
      .then((res) => res.json())
      .then((data) => setDoubles(data.rankings || []));
  }, []);

  const renderTable = (title, rankings) => (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ textAlign: "center", marginBottom: "0.5rem" }}>{title}</h3>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.95rem",
          }}
        >
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
                key={r.name + title}
                style={{
                  background: i % 2 === 0 ? "#fff" : "#f9f9f9",
                  borderBottom: "1px solid #eee",
                }}
              >
                <td style={tdStyle}>{i + 1}</td>
                <td style={tdStyle}>
                  <strong>{r.name}</strong>
                </td>
                <td style={tdStyle}>{r.played}</td>
                <td style={tdStyle}>{r.won}</td>
                <td style={tdStyle}>{r.lost}</td>
                <td style={tdStyle}>{r.win_rate}%</td>
                <td style={tdStyle}>{r.point_diff}</td>
                <td
                  style={{
                    ...tdStyle,
                    fontWeight: "bold",
                    color: "#007bff",
                  }}
                >
                  {r.final_rating}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        🌐 Player Rankings
      </h2>

      {renderTable("🏆 Overall Rankings", overall)}
      {renderTable("🎯 Singles Rankings", singles)}
      {renderTable("🤝 Doubles Rankings", doubles)}

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
            cursor: "pointer",
          }}
        >
          ⬅ Back to Home
        </button>
      </div>
    </div>
  );
};

// Table header style
const thStyle = {
  padding: "12px 10px",
  borderBottom: "2px solid #ddd",
};

// Table cell style
const tdStyle = {
  padding: "10px 8px",
  whiteSpace: "nowrap",
};

export default OverallRankingScreen;
