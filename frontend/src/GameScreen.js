import React, { useState, useEffect } from "react";

const GameScreen = ({ game, onEndGame }) => {
  const { teams, matches, created_at } = game;
  const [scores, setScores] = useState(game.match_scores || []);

  const [wins, setWins] = useState({ team1: 0, team2: 0 });
  const [editMode, setEditMode] = useState(() =>
    (game.match_scores || []).map((s) => !s)
  );

  const handleScoreChange = (matchIndex, teamKey, value) => {
    const updated = [...scores];
    if (!updated[matchIndex]) updated[matchIndex] = { team1: "", team2: "" };
    updated[matchIndex][teamKey] = value;
    setScores(updated);
  };

  const submitScore = async (matchIndex) => {
    const matchScore = scores[matchIndex];
    const team1Score = matchScore?.team1;
    const team2Score = matchScore?.team2;

    if (team1Score === "" || team2Score === "") return;

    const res = await fetch("http://localhost:5000/update_match_score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: game.id,
        match_index: matchIndex,
        team1_score: team1Score,
        team2_score: team2Score,
      }),
    });

    if (res.ok) {
      const updatedEdit = [...editMode];
      updatedEdit[matchIndex] = false;
      setEditMode(updatedEdit);
    }
  };

  useEffect(() => {
    const tally = { team1: 0, team2: 0 };
    scores.forEach((s) => {
      if (!s || s.team1 === "" || s.team2 === "") return;
      const a = parseInt(s.team1, 10);
      const b = parseInt(s.team2, 10);
      if (!isNaN(a) && !isNaN(b)) {
        if (a > b) tally.team1++;
        else if (b > a) tally.team2++;
      }
    });
    setWins(tally);
  }, [scores]);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "960px", margin: "0 auto", fontFamily: "Segoe UI, sans-serif" }}>
      {/* Team Info Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 45%" }}>
            <h3>Team A</h3>
            <ul>{teams[0].map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <h3>Team B</h3>
            <ul>{teams[1].map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: "0.9rem", color: "#777", marginTop: "1rem" }}>
          {new Date(created_at).toLocaleString()}
        </div>
      </div>

      {/* Scoreboard Card */}
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <h2>🏆 {wins.team1} : {wins.team2}</h2>
      </div>

      {/* Match Schedule */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: "1rem" }}>Match Schedule & Scores</h4>
        {matches.map((match, i) => {
          const score = scores[i] == null ? { team1: "", team2: "" } : scores[i];
          const isEditing = editMode[i];

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                {match.team1.join(" & ")} vs {match.team2.join(" & ")}
              </div>

              <input
                type="number"
                value={score.team1}
                disabled={!isEditing}
                placeholder="0"
                onChange={(e) => handleScoreChange(i, "team1", e.target.value)}
                style={inputStyle}
              />
              <span>–</span>
              <input
                type="number"
                value={score.team2}
                disabled={!isEditing}
                placeholder="0"
                onChange={(e) => handleScoreChange(i, "team2", e.target.value)}
                style={inputStyle}
              />

              {isEditing ? (
                <button
                  onClick={() => submitScore(i)}
                  disabled={score.team1 === "" || score.team2 === ""}
                  style={buttonStyle}
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => {
                    const updated = [...editMode];
                    updated[i] = true;
                    setEditMode(updated);
                  }}
                  style={{ ...buttonStyle, backgroundColor: "#6c757d" }}
                >
                  Edit
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* End Game Button */}
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <button
          onClick={() => onEndGame(wins, scores)}
          style={{
            ...buttonStyle,
            padding: "12px 24px",
            backgroundColor: "#28a745",
            fontSize: "1rem",
          }}
        >
          ✅ End Game
        </button>
      </div>
    </div>
  );
};

// Reusable styles
const cardStyle = {
  background: "#fff",
  padding: "1.5rem",
  marginBottom: "1.5rem",
  borderRadius: "12px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
};

const inputStyle = {
  width: "50px",
  padding: "6px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  textAlign: "center",
};

const buttonStyle = {
  padding: "6px 12px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default GameScreen;
