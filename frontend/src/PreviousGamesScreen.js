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
      setGames([]); // gracefully fallback
    });
}, []);

  return (
    <div>
      <h2>📚 Previous Games</h2>
      <button onClick={onBack}>🔙 Back</button>
      {games.map((game) => (
        <div key={game.id} style={{ margin: "1rem", border: "1px solid #ccc", padding: "10px" }}>
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
                    {match.team1.join(" & ")} [{res.team1}] vs [{res.team2}] {match.team2.join(" & ")}
                </li>
                );
            })}
            </ol>

        </div>
      ))}
    </div>
  );
};

export default PreviousGamesScreen;
