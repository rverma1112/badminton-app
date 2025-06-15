import React, { useEffect, useState } from "react";

const PreviousGamesScreen = ({ onBack }) => {
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
      const res = await fetch("https://badminton-api-j9ja.onrender.com/delete_game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: id }),
      });

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
    <div>
      <h2>📚 Previous Games</h2>
      <button onClick={onBack}>🔙 Back</button>
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
          <p><strong>Game #{game.id}</strong></p>
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
                return <li key={idx}>Match {idx + 1}: Incomplete data</li>;
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
              fontWeight: "bold"
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
