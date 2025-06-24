import React, { useState, useEffect } from "react";
import GameScreen from "./GameScreen";
import DailyRankingScreen from "./DailyRankingScreen";
import PreviousGamesScreen from "./PreviousGamesScreen";
import OverallRankingScreen from "./OverallRankingScreen";
import PlayerProfileScreen from "./PlayerProfileScreen";

// 🔸 Main App Component
const App = () => {
  const [screen, setScreen] = useState("home");
  const [players, setPlayers] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [ongoingGames, setOngoingGames] = useState([]);
  // const [viewedPlayer, setViewedPlayer] = useState(null);

  useEffect(() => {
    fetch("https://badminton-api-j9ja.onrender.com/get_players")
      .then((res) => res.json())
      .then((data) => setPlayers(data));
  }, []);
  const [dailyStats, setDailyStats] = useState([]);
  

  useEffect(() => {
    fetch("https://badminton-api-j9ja.onrender.com/get_ongoing_games")
      .then((res) => res.json())
      .then((data) => setOngoingGames(data.games));
  }, []);
  
  const endGame = async(wins, scores) => {
    const matchStats = currentGame.matches.map((match, i) => {
      const score = scores[i];
      const team1Score = parseInt(score.team1 || "0");
      const team2Score = parseInt(score.team2 || "0");

      return {
        players: [...match.team1, ...match.team2],
        team1: match.team1,
        team2: match.team2,
        team1Score,
        team2Score,
      };
    });

    // Player-level stats
    const stats = {};

    matchStats.forEach((m) => {
      const margin = Math.abs(m.team1Score - m.team2Score);
      const team1Won = m.team1Score > m.team2Score;

      const allPlayers = [...m.team1, ...m.team2];

      allPlayers.forEach((player) => {
        if (!stats[player]) {
          stats[player] = {
            name: player,
            played: 0,
            won: 0,
            lost: 0,
            pointSum: 0,
          };
        }
      });

      m.team1.forEach((p) => {
        stats[p].played += 1;
        if (team1Won) {
          stats[p].won += 1;
          stats[p].pointSum += margin;
        } else {
          stats[p].lost += 1;
          stats[p].pointSum -= margin;
        }
      });

      m.team2.forEach((p) => {
        stats[p].played += 1;
        if (!team1Won) {
          stats[p].won += 1;
          stats[p].pointSum += margin;
        } else {
          stats[p].lost += 1;
          stats[p].pointSum -= margin;
        }
      });
    });

    const statsArray = Object.values(stats).map((s) => ({
      ...s,
      pointDifferential: s.played > 0 ? (s.pointSum / s.played).toFixed(2) : 0,
    }));

    // Sort by point differential
    statsArray.sort((a, b) => b.pointDifferential - a.pointDifferential);
    //const now = new Date().toISOString();

    // await fetch("https://badminton-api-j9ja.onrender.com/save_stats", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     stats: statsArray,
    //     game_id: currentGame.id,
    //     created_at: now,
    //   }),
    // });

    await fetch("https://badminton-api-j9ja.onrender.com/complete_game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: String(currentGame.id),
        players: currentGame.players,
        teams: currentGame.teams,
        match_count: currentGame.match_count,
        matches: currentGame.matches,
        results: scores,
        created_at: currentGame.created_at,
        ended_at: new Date().toISOString(),
        stats: statsArray, // ✅ Add this line
      }),
    });

    setOngoingGames(prev =>
      Object.values(prev).filter(game => game.id !== currentGame.id)
    );
    await fetch("https://badminton-api-j9ja.onrender.com/end_game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_id: currentGame.id }),
    });

    setDailyStats(statsArray);
    setCurrentGame(null);
    setScreen("dailyRanking");
  };

  
  const handleAddPlayer = async (name) => {
    const res = await fetch("https://badminton-api-j9ja.onrender.com/add_player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    const updatedPlayers = await fetch("https://badminton-api-j9ja.onrender.com/get_players").then((r) =>
      r.json()
    );
    setPlayers(updatedPlayers);

    return data;
  };

  const renderScreen = () => {
    switch (screen) {
      case "home":
        return (
          <div className="card">
            <h2>🏸 Badminton Match Manager</h2>
            <button onClick={() => setScreen("newGame")}>➕ Create New Game</button>
            <button onClick={() => setScreen("addPlayer")}>🧑 Add New Player</button>
            <button onClick={() => setScreen("games")}>📋 View Previous Games</button>
            <button onClick={() => setScreen("rankings")}>🏆 View Rankings</button>
            <button onClick={() => setScreen("profile")}>👤 View Player Profile</button>

            {ongoingGames.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h3>🟢 Ongoing Games</h3>
              {ongoingGames.map((game) => (
                <div
                  key={game.id}
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    background: "#f9f9f9",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setCurrentGame(game);
                    setScreen("game");
                  }}
                >
                  <p><strong>Game #{game.id}</strong></p>
                  <p>Players: {game.players.join(", ")}</p>
                  <p>Matches: {game.matches?.length ?? 0}</p>
                  <p style={{ fontSize: "12px", color: "#888" }}>
                    Created At: {new Date(game.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          </div>
        );


      case "addPlayer":
        return <AddPlayerScreen onBack={() => setScreen("home")} onAddPlayer={handleAddPlayer} />;
      case "newGame":
        return (
          <CreateGameScreen
            players={players}
            onBack={() => setScreen("home")}
            setCurrentGame={setCurrentGame}
            setOngoingGames={setOngoingGames} // ✅ add this line
          />
        );
        
      case "game":
        return <GameScreen game={currentGame} onEndGame={endGame} />;
      case "games":
        return <PreviousGamesScreen onBack={() => setScreen("home")} />;
      case "rankings":
        return <OverallRankingScreen onBack={() => setScreen("home")} />;
      case "profile":
        return <PlayerProfileScreen onBack={() => setScreen("home")} />;
                
      case "dailyRanking":
        return <DailyRankingScreen stats={dailyStats} onBack={() => setScreen("home")} />;
      
      default:
        return <div>Coming soon...</div>;
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      {renderScreen()}
    </div>
  );
};

const AddPlayerScreen = ({ onBack, onAddPlayer }) => {
  const [count, setCount] = useState(1);
  const [names, setNames] = useState([""]);

  // Handle player count change
  const handleCountChange = (e) => {
    const newCount = Math.max(1, parseInt(e.target.value) || 1);
    setCount(newCount);
    setNames(Array(newCount).fill("")); // reset names array
  };

  // Handle individual name change
  const handleNameChange = (index, value) => {
    const updated = [...names];
    updated[index] = value;
    setNames(updated);
  };

  // Add all players to DB
  const submitPlayers = async () => {
    const trimmed = names.map((n) => n.trim()).filter(Boolean);
    if (trimmed.length !== count) {
      alert("Please fill all player names.");
      return;
    }

    let successCount = 0;

    for (const name of trimmed) {
      const res = await onAddPlayer(name);
      if (res.status === "ok") successCount++;
    }

    alert(`✅ ${successCount} player(s) added!`);
    setCount(1);
    setNames([""]);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add Multiple Players</h2>

      <label>Number of players to add:</label>
      <input
        type="number"
        value={count}
        onChange={handleCountChange}
        min="1"
        max="50"
        style={{ padding: "8px", width: "60px", marginLeft: "10px" }}
      />

      <div style={{ marginTop: "1rem" }}>
        {names.map((name, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={name}
              placeholder={`Player ${i + 1} name`}
              onChange={(e) => handleNameChange(i, e.target.value)}
              style={{
                padding: "8px",
                width: "250px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={submitPlayers}
        style={{
          padding: "10px 16px",
          backgroundColor: "green",
          color: "white",
          border: "none",
          borderRadius: "6px",
          marginTop: "1rem",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        ➕ Add Players
      </button>

      <br />
      <br />
      <button
        onClick={onBack}
        style={{
          padding: "8px 16px",
          backgroundColor: "gray",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        🔙 Back
      </button>
    </div>
  );
};


// 🔸 CreateGameScreen Component
const CreateGameScreen = ({ players, onBack, setCurrentGame, setOngoingGames }) => {

  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [matchCount, setMatchCount] = useState(3);
  const [teams, setTeams] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [playerGameCounts, setPlayerGameCounts] = useState({});


  const togglePlayer = (name) => {
    setSelectedPlayers((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
    setTeams([]);
    setSchedule([]);
  };

  const generateTeams = () => {
    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    const team1 = shuffled.slice(0, mid);
    const team2 = shuffled.slice(mid);
    setTeams([team1, team2]);
  };

  const generateSchedule = () => {
  const [team1, team2] = teams;

  if (team1.length < 2 || team2.length < 2) {
    alert("Each team must have at least 2 players to generate valid matches.");
    return;
  }

  const playerGameCount = {};
  const newSchedule = [];

  [...team1, ...team2].forEach((p) => (playerGameCount[p] = 0));

  for (let m = 0; m < matchCount; m++) {
    const sortedTeam1 = [...team1].sort((a, b) => playerGameCount[a] - playerGameCount[b]);
    const sortedTeam2 = [...team2].sort((a, b) => playerGameCount[a] - playerGameCount[b]);

    const pair1 = sortedTeam1.slice(0, 2).sort(() => Math.random() - 0.5);
    const pair2 = sortedTeam2.slice(0, 2).sort(() => Math.random() - 0.5);

    if (pair1.length < 2 || pair2.length < 2) {
      alert("Not enough players to create fair teams.");
      return;
    }

    newSchedule.push({ team1: pair1, team2: pair2 });

    [...pair1, ...pair2].forEach((p) => (playerGameCount[p] += 1));
  }

  setSchedule(newSchedule);
  setPlayerGameCounts(playerGameCount);
};


  const createGame = async () => {
    const res = await fetch("https://badminton-api-j9ja.onrender.com/create_game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        players: selectedPlayers,
        match_count: matchCount,
        teams,
        matches: schedule,
      }),
    });
  
    const data = await res.json();
    alert("Game created! 🎉");
  
    setCurrentGame(data.game);
  
    const updatedOngoingGames = await fetch("https://badminton-api-j9ja.onrender.com/get_ongoing_games")
      .then((res) => res.json());
    setOngoingGames(updatedOngoingGames.games);
  
    onBack();
  };
  
  

  return (
    <div>
      <h2>Create Game</h2>

      <div>
        <p>Select Players:</p>
        {players.map((player) => (
          <button
            key={player}
            onClick={() => togglePlayer(player)}
            style={{
              background: selectedPlayers.includes(player) ? "green" : "gray",
              color: "white",
              margin: "5px",
              padding: "5px 10px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {player}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label>Total Matches: </label>
        <input
          type="number"
          value={matchCount}
          onChange={(e) => setMatchCount(parseInt(e.target.value))}
          min="1"
          style={{ marginLeft: "10px", padding: "5px", width: "60px" }}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={generateTeams}
          style={{
            padding: "10px",
            backgroundColor: "orange",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          🎲 Random Team Distribution
        </button>
      </div>

      {teams.length === 2 && (
        <div style={{ marginTop: "1rem" }}>
          <h4>Team 1: {teams[0].join(", ")}</h4>
          <h4>Team 2: {teams[1].join(", ")}</h4>
        </div>
      )}
      <div style={{ marginTop: "1rem" }}>
          <button
      onClick={generateSchedule}
      style={{
        padding: "10px",
        backgroundColor: "#17a2b8",
        color: "white",
        border: "none",
        borderRadius: "5px",
        marginTop: "1rem",
        cursor: "pointer"
      }}
    >
      📅 Generate Schedule
    </button>
</div>
      {schedule.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3>🔁 Match Schedule Preview</h3>
          <ol>
            {schedule.map((match, idx) => (
              <li key={idx}>
                {match.team1.join(" & ")} vs {match.team2.join(" & ")}
              </li>
            ))}
          </ol>

          <h4>📊 Player Match Counts</h4>
          <ul>
            {Object.entries(playerGameCounts).map(([player, count]) => (
              <li key={player}>
                {player}: {count} game{count > 1 ? "s" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={createGame}
        style={{
          marginTop: "1rem",
          padding: "10px",
          background: "blue",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        ✅ Create Game
      </button>

      <br />
      <button
        onClick={onBack}
        style={{
          marginTop: "1rem",
          padding: "8px 16px",
          backgroundColor: "gray",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        🔙 Back
      </button>
    </div>
  );
};

export default App;
