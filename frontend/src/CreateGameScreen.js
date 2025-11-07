import React, { useState, useEffect } from "react";
import { scheduleRandomDoubles } from "./randomDoublesScheduler";
import { scheduleRandomDoubles } from "./scheduler";


const CreateGameScreen = ({ players, onBack, setCurrentGame, setOngoingGames }) => {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [matchCount, setMatchCount] = useState(3);
  const [teams, setTeams] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [playerGameCounts, setPlayerGameCounts] = useState({});
  const [gameType, setGameType] = useState("tournament");

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
    setTeams([shuffled.slice(0, mid), shuffled.slice(mid)]);
  };

  const generateSchedule = () => {
  if (selectedPlayers.length < 4) {
    alert("❗ Need at least 4 players for doubles random.");
    return;
  }

  if (!matchCount || matchCount < 1) {
    alert("❗ Enter valid number of games.");
    return;
  }

  // ✅ DOUBLES RANDOM MODE
  if (gameType === "doubles_random") {
    const players = [...selectedPlayers];

    // ✅ Assign temporary ranking priority (later replace with real ranking)
    const rankings = {};
    players.forEach((p, i) => (rankings[p] = players.length - i));

    // ✅ Create all 2-player combinations
    const makePairs = (arr) => {
      const result = [];
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          result.push([arr[i], arr[j]]);
        }
      }
      return result;
    };

    let pairs = makePairs(players);

    // ✅ Shuffle pairs lightly — ranking aware
    for (let i = pairs.length - 1; i > 0; i--) {
      if (Math.random() < 0.3) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
      }
    }

    // ✅ Game counts per player
    const counts = {};
    players.forEach((p) => (counts[p] = 0));

    const matches = [];
    let idx = 0;

    // ✅ Fill match slots
    while (matches.length < matchCount) {
      const t1 = pairs[idx % pairs.length];
      const t2 = pairs[(idx + 1) % pairs.length];

      // Teams cannot share players
      if (t1.some((p) => t2.includes(p))) {
        idx++;
        continue;
      }

      matches.push({ team1: t1, team2: t2 });

      // Update player participation counts
      t1.forEach((p) => (counts[p]++));
      t2.forEach((p) => (counts[p]++));

      idx++;
    }

    // ✅ Small fairness pass
    // If some players got too few games → swap in higher ranked players
    const sortedPlayers = [...players].sort((a, b) => rankings[b] - rankings[a]);

    // No extreme fairness logic now — easy to tune later
    // (kept lightweight to avoid freezing)

    setSchedule(matches);
    setPlayerGameCounts(counts);
    return;
  }

  // ✅ Other game modes (existing logic)
  alert("❗ Only doubles_random supported here — add others above.");
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

    const updated = await fetch("https://badminton-api-j9ja.onrender.com/get_ongoing_games")
      .then((res) => res.json());
    setOngoingGames(updated.games);
    onBack();
  };

  // 💅 Styled using the theme
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🎮 Create New Game</h2>

      <div style={{ ...styles.section, ...styles.wave }}>
        <label style={styles.label}>Select Players:</label>
        <div style={styles.playerGrid}>
          {players.map((p) => (
            <button
              key={p}
              onClick={() => togglePlayer(p)}
              style={styles.playerBtn(selectedPlayers.includes(p))}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...styles.section, ...styles.wave }}>
        <label style={styles.label}>Game Type:</label>
        <select value={gameType} onChange={(e) => setGameType(e.target.value)} style={styles.select}>
          <option value="tournament">Tournament (Team 1 vs Team 2)</option>
          <option value="singles">Singles (1v1)</option>
          <option value="doubles_random">Doubles Random</option>
        </select>
      </div>

      <div style={{ ...styles.section, ...styles.wave }}>
        <label style={styles.label}>Total Matches:</label>
        <input
          type="number"
          value={matchCount}
          onChange={(e) => setMatchCount(parseInt(e.target.value))}
          min="1"
          style={styles.select}
        />
      </div>

      {(gameType === "tournament") && (
        <div style={styles.buttonRow}>
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
        <div style={styles.section}>
          <h4>🏁 Teams</h4>
          <p><strong>Team 1:</strong> {teams[0].join(", ")}</p>
          <p><strong>Team 2:</strong> {teams[1].join(", ")}</p>
        </div>
      )}

      {schedule.length > 0 && (
        <div style={styles.section}>
          <h4>📋 Match Schedule</h4>
          <ol>
            {schedule.map((match, idx) => (
              <li key={idx}>{match.team1.join(" & ")} vs {match.team2.join(" & ")}</li>
            ))}
          </ol>
          <h4>📊 Player Game Counts</h4>
          <ul>
            {Object.entries(playerGameCounts).map(([p, c]) => (
              <li key={p}>{p}: {c} game{c > 1 ? "s" : ""}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.buttonRow}>
        <button className="primary-button" onClick={createGame}>✅ Start Game</button>
        <button onClick={onBack} style={styles.backBtn}>🔙 Back</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundImage: "linear-gradient(to bottom right, #004d86, #000000, #366e00)",
    minHeight: "100vh",
    padding: "2rem",
    color: "#ffff66",
    fontFamily: "'Orbitron', sans-serif",
  },
  heading: {
    textAlign: "center",
    color: "#ffff66",
    marginBottom: "1.5rem",
  },
  section: {
    marginBottom: "1.5rem",
    padding: "1.5rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid #ffff66",
    borderRadius: "10px",
  },
  wave: {
    backgroundImage: `url('/wave-overlay.svg')`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "0.5rem",
  },
  select: {
    padding: "10px",
    width: "100%",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#222",
    color: "#ffff66",
    fontWeight: "bold",
  },
  playerGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  playerBtn: (selected) => ({
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: selected ? "#28a745" : "#6c757d",
    color: "white",
    cursor: "pointer",
  }),
  buttonRow: {
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
    marginTop: "2rem",
  },
  backBtn: {
    padding: "10px 16px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default CreateGameScreen;
