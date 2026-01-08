import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PreviousGamesScreen = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetch("https://badminton-api-j9ja.onrender.com/get_completed_games")
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((data) => setGames(data))
      .catch((err) => {
        console.error("Failed to fetch completed games:", err);
        setGames([]);
      });
  }, []);

  const deleteGame = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this game and all its stats?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        "https://badminton-api-j9ja.onrender.com/delete_game",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game_id: id }),
        }
      );

      const data = await res.json();

      if (data.status === "ok") {
        alert("✅ Game deleted successfully.");
        setGames((prev) => prev.filter((g) => g.id !== id));
      } else {
        alert("❌ Failed to delete game.");
      }
    } catch (err) {
      console.error("Error deleting game:", err);
      alert("❌ Server error. Try again.");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        📚 Previous Games
      </h2>

      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
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
          🔙 Back to Home
        </button>
      </div>

      {games.length === 0 && (
        <p style={{ textAlign: "center", color: "#888" }}>
          No completed games found.
        </p>
      )}

      {games.map((game) => (
        <div
          key={game.id}
          style={{
            margin: "1rem 0",
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "6px",
            backgroundColor: "#f8f8f8",
          }}
        >
          <p>
            <strong>Game #{game.id}</strong>
          </p>
          <p>Players: {game.players.join(", ")}</p>
          <p>Matches: {game.match_count}</p>
          <p>Started: {new Date(game.created_at).toLocaleString()}</p>
          <p>Ended: {new Date(game.ended_at).toLocaleString()}</p>

          <h4>Results:</h4>
          <ol>
            {game.results.map((res, idx) => {
              const match = game.matches[idx];
              if (
                !match ||
                !match.team1 ||
                !match.team2 ||
                res == null ||
                res.team1 == null ||
                res.team2 == null
              ) {
                return (
                  <li key={idx}>Match {idx + 1}: Incomplete data</li>
                );
              }

              return (
                <li key={idx}>
                  {match.team1.join(" & ")} [{res.team1}] vs [{res.team2}]{" "}
                  {match.team2.join(" & ")}
                </li>
              );
            })}
          </ol>

          <button
            onClick={() => deleteGame(game.id)}
            style={{
              marginTop: "10px",
              backgroundColor: "red",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🗑️ Delete Game
          </button>
        </div>
      ))}
    </div>
  );
};

export default PreviousGamesScreen;
