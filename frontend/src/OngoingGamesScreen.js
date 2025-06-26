import React from "react";

const OngoingGamesScreen = ({ ongoingGames, setCurrentGame, setScreen, onBack }) => {
  const handleClick = (game) => {
    setCurrentGame(game);
    setScreen("game");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>🟢 Ongoing Games</h2>

      {ongoingGames.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888" }}>No ongoing games at the moment.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {ongoingGames.map((game) => (
            <div
              key={game.id}
              style={{
                padding: "1rem",
                border: "1px solid #ccc",
                borderRadius: "10px",
                backgroundColor: "#f9f9f9",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
              onClick={() => handleClick(game)}
            >
              <strong>Game #{game.id}</strong>
              <p><strong>Players:</strong> {game.players.join(", ")}</p>
              <p><strong>Matches:</strong> {game.matches?.length ?? 0}</p>
              <p style={{ fontSize: "0.9rem", color: "#555" }}>
                <strong>Created:</strong> {new Date(game.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        style={{
          marginTop: "2rem",
          padding: "10px 16px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer",
          width: "100%",
        }}
      >
        🔙 Back
      </button>
    </div>
  );
};

export default OngoingGamesScreen;
