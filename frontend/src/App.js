import React, { useState, useEffect } from "react";
import GameScreen from "./GameScreen";
import DailyRankingScreen from "./DailyRankingScreen";
import PreviousGamesScreen from "./PreviousGamesScreen";
import OverallRankingScreen from "./OverallRankingScreen";
import PlayerProfileScreen from "./PlayerProfileScreen";
import HomeScreen from "./HomeScreen"; // or wherever you place it
import OngoingGamesScreen from "./OngoingGamesScreen";


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
        id: currentGame.id,
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
      // case "home":
      //   return (
      //     <div className="home-screen" style={{ padding: "2rem" }}>
      //       <h2 style={{ fontSize: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
      //         🏸 <span style={{ color: "#007BFF" }}>Badminton Match Manager</span>
      //       </h2>

      //       <div style={{ display: "grid", gap: "1rem" }}>
      //         <button className="primary-button" onClick={() => setScreen("newGame")}>➕ Create New Game</button>
      //         <button className="primary-button" onClick={() => setScreen("addPlayer")}>🧑 Add New Player</button>
      //         <button className="primary-button" onClick={() => setScreen("games")}>📋 View Previous Games</button>
      //         <button className="primary-button" onClick={() => setScreen("rankings")}>🏆 View Rankings</button>
      //         <button className="primary-button" onClick={() => setScreen("profile")}>👤 View Player Profile</button>
      //       </div>

      //       {ongoingGames.length > 0 && (
      //         <div style={{ marginTop: "2rem" }}>
      //           <h3 style={{ color: "#28a745" }}>🟢 Ongoing Games</h3>
      //           {ongoingGames.map((game) => (
      //             <div key={game.id} style={{
      //               marginBottom: "1rem",
      //               padding: "1rem",
      //               border: "1px solid #ccc",
      //               borderRadius: "10px",
      //               background: "#f8f9fa",
      //               boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      //             }}
      //             onClick={() => {
      //               setCurrentGame(game);
      //               setScreen("game");
      //             }}>
      //               <strong>Game #{game.id}</strong>
      //               <p>Players: {game.players.join(", ")}</p>
      //               <p>Matches: {game.matches?.length ?? 0}</p>
      //               <p style={{ fontSize: "0.9rem", color: "#888" }}>
      //                 Created At: {new Date(game.created_at).toLocaleString()}
      //               </p>
      //             </div>
      //           ))}
      //         </div>
      //       )}
      //     </div>

      //   );
      case "home":
        return <HomeScreen setScreen={setScreen} ongoingGames={ongoingGames} />;

      case "ongoing":
        return (
          <OngoingGamesScreen
            ongoingGames={ongoingGames}
            onBack={() => setScreen("home")}
            setCurrentGame={setCurrentGame}
            setScreen={setScreen}
          />
        );


      case "addPlayer":
        return <AddPlayerScreen onBack={() => setScreen("home")} onAddPlayer={handleAddPlayer} />;
      case "newGame":
        return (
          <CreateGameScreen
            players={players}
            onBack={() => setScreen("home")}
            setCurrentGame={setCurrentGame}
            setOngoingGames={setOngoingGames}
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

  const handleCountChange = (e) => {
    const newCount = Math.max(1, parseInt(e.target.value) || 1);
    setCount(newCount);
    setNames(Array(newCount).fill(""));
  };

  const handleNameChange = (index, value) => {
    const updated = [...names];
    updated[index] = value;
    setNames(updated);
  };

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
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1rem", textAlign: "center" }}>➕ Add Players</h2>

      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Number of players:
      </label>
      <input
        type="number"
        value={count}
        onChange={handleCountChange}
        min="1"
        max="50"
        style={{
          padding: "10px",
          width: "80px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          marginBottom: "1.5rem",
        }}
      />

      <div style={{ marginBottom: "2rem" }}>
        {names.map((name, i) => (
          <input
            key={i}
            type="text"
            value={name}
            placeholder={`Player ${i + 1} name`}
            onChange={(e) => handleNameChange(i, e.target.value)}
            style={{
              padding: "10px",
              width: "100%",
              marginBottom: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <button
          onClick={submitPlayers}
          className="primary-button"
          style={{ flex: 1 }}
        >
          ➕ Add Players
        </button>

        <button
          onClick={onBack}
          style={{
            padding: "10px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            flex: 1,
            cursor: "pointer",
          }}
        >
          🔙 Back
        </button>
      </div>
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
  const [gameType, setGameType] = useState("tournament"); // default


  useEffect(() => {
  setTeams([]);
  setSchedule([]);
  setPlayerGameCounts({});
}, [gameType]);


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
  // ✅ Validate minimum players per game type
  if (
    (gameType === "singles" && selectedPlayers.length < 2) ||
    (gameType === "doubles_random" && selectedPlayers.length < 4) ||
    (gameType === "tournament" && selectedPlayers.length < 2)
  ) {
    alert(
      gameType === "singles"
        ? "Singles requires at least 2 players."
        : gameType === "doubles_random"
        ? "Random Doubles requires at least 4 players."
        : "Tournament requires at least 2 players."
    );
    return;
  }

  const gameCountMap = {};
  selectedPlayers.forEach(p => gameCountMap[p] = 0);
  const schedule = [];

  // ✅ TOURNAMENT
  if (gameType === "tournament") {
    const [team1, team2] = teams;
    if (!team1 || !team2 || team1.length < 1 || team2.length < 1) {
      alert("Generate two teams with at least 1 player each.");
      return;
    }

    for (let m = 0; m < matchCount; m++) {
      const sortedTeam1 = [...team1].sort((a, b) => gameCountMap[a] - gameCountMap[b]);
      const sortedTeam2 = [...team2].sort((a, b) => gameCountMap[a] - gameCountMap[b]);

      const pair1 = sortedTeam1.slice(0, 2).sort(() => Math.random() - 0.5);
      const pair2 = sortedTeam2.slice(0, 2).sort(() => Math.random() - 0.5);

      if (pair1.length < 1 || pair2.length < 1) continue;

      schedule.push({ team1: pair1, team2: pair2 });
      [...pair1, ...pair2].forEach(p => gameCountMap[p]++);
    }
  }

  // ✅ SINGLES
  else if (gameType === "singles") {
    const combinations = [];

    for (let i = 0; i < selectedPlayers.length; i++) {
      for (let j = i + 1; j < selectedPlayers.length; j++) {
        combinations.push({ team1: [selectedPlayers[i]], team2: [selectedPlayers[j]] });
      }
    }

    const shuffled = combinations.sort(() => Math.random() - 0.5);
    const maxGamesPerPlayer = Math.ceil((matchCount * 2) / selectedPlayers.length);
    let index = 0;

    while (schedule.length < matchCount) {
      if (index >= shuffled.length) {
        index = 0;
        shuffled.sort(() => Math.random() - 0.5);
      }

      const match = shuffled[index++];
      const [p1] = match.team1;
      const [p2] = match.team2;

      if (gameCountMap[p1] < maxGamesPerPlayer && gameCountMap[p2] < maxGamesPerPlayer) {
        schedule.push(match);
        gameCountMap[p1]++;
        gameCountMap[p2]++;
      }
    }
  }

  // ✅ RANDOM DOUBLES
  else if (gameType === "doubles_random") {
    const allPlayers = [...selectedPlayers];

    // helper to get all 4-player combinations
    const getAllQuads = (players) => {
      const quads = [];
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          for (let k = j + 1; k < players.length; k++) {
            for (let l = k + 1; l < players.length; l++) {
              quads.push([players[i], players[j], players[k], players[l]]);
            }
          }
        }
      }
      return quads;
    };

    // build match pool with all possible 2v2 pairings from all quads
    const buildMatchPool = () => {
      const matches = [];
      const quads = getAllQuads(allPlayers);

      for (const quad of quads) {
        const [a, b, c, d] = quad;
        matches.push({ team1: [a, b], team2: [c, d] });
        matches.push({ team1: [a, c], team2: [b, d] });
        matches.push({ team1: [a, d], team2: [b, c] });
      }

      return matches;
    };

    const matchPool = buildMatchPool();
    if (matchPool.length === 0) {
      alert("Not enough players to create valid doubles matches.");
      return;
    }

    const maxGamesPerPlayer = Math.ceil((matchCount * 4) / allPlayers.length);
    let matchIndex = 0;
    matchPool.sort(() => Math.random() - 0.5);

    while (schedule.length < matchCount) {
      if (matchIndex >= matchPool.length) {
        matchIndex = 0;
        matchPool.sort(() => Math.random() - 0.5);
      }

      const match = matchPool[matchIndex++];
      const all = [...match.team1, ...match.team2];

      if (all.every(p => gameCountMap[p] < maxGamesPerPlayer)) {
        schedule.push(match);
        all.forEach(p => gameCountMap[p]++);
      }
    }
  }

  // ❌ Unknown game type
  else {
    alert("Unknown game type selected.");
    return;
  }

  // ✅ Done
  if (schedule.length === 0) {
    alert("Could not generate schedule. Try different players or match count.");
    return;
  }

  setSchedule(schedule);
  setPlayerGameCounts(gameCountMap);
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
    alert("✅ Game created!");

    setCurrentGame(data.game);

    const updatedOngoingGames = await fetch("https://badminton-api-j9ja.onrender.com/get_ongoing_games")
      .then((res) => res.json());
    setOngoingGames(updatedOngoingGames.games);
    onBack();
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center" }}>🎮 Create New Game</h2>

      <div style={{ margin: "1rem 0" }}>
        <label style={{ fontWeight: "bold" }}>Select Players:</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "0.5rem" }}>
          {players.map((player) => (
            <button
              key={player}
              onClick={() => togglePlayer(player)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: selectedPlayers.includes(player) ? "#28a745" : "#6c757d",
                color: "white",
                cursor: "pointer",
              }}
            >
              {player}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label><strong>Select Game Type:</strong></label>
        <select
          value={gameType}
          onChange={(e) => setGameType(e.target.value)}
          style={{ marginLeft: "10px", padding: "8px", borderRadius: "5px" }}
        >
          <option value="tournament">Tournament (Team 1 vs Team 2)</option>
          <option value="singles">Singles (1v1)</option>
          <option value="doubles_random">Doubles Random</option>
        </select>
      </div>

      <div style={{ margin: "1rem 0" }}>
        <label style={{ fontWeight: "bold" }}>Total Matches:</label>
        <input
          type="number"
          value={matchCount}
          onChange={(e) => setMatchCount(parseInt(e.target.value))}
          min="1"
          style={{ padding: "8px", width: "80px", marginLeft: "10px", borderRadius: "5px" }}
        />
      </div>

      {gameType === "tournament" && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <button className="primary-button" onClick={generateTeams}>🎲 Generate Teams</button>
          <button className="primary-button" onClick={generateSchedule}>📅 Generate Schedule</button>
        </div>
      )}

      {(gameType === "singles" || gameType === "doubles_random") && (
        <div style={{ marginTop: "1rem" }}>
          <button className="primary-button" onClick={generateSchedule}>📅 Generate Schedule</button>
        </div>
      )}


      {teams.length === 2 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h4>🏁 Teams</h4>
          <p><strong>Team 1:</strong> {teams[0].join(", ")}</p>
          <p><strong>Team 2:</strong> {teams[1].join(", ")}</p>
        </div>
      )}

      {schedule.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h4>📋 Match Schedule</h4>
          <ol>
            {schedule.map((match, idx) => (
              <li key={idx}>
                {match.team1.join(" & ")} vs {match.team2.join(" & ")}
              </li>
            ))}
          </ol>

          <h4>📊 Player Game Counts</h4>
          <ul>
            {Object.entries(playerGameCounts).map(([player, count]) => (
              <li key={player}>{player}: {count} game{count > 1 ? "s" : ""}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
        <button className="primary-button" onClick={createGame}>✅ Start Game</button>
        <button
          onClick={onBack}
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
          🔙 Back
        </button>
      </div>
    </div>
  );
};


export default App;
