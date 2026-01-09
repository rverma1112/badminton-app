/* eslint-disable no-loop-func */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";



// ------------------ Allocation & Optimization Helpers ------------------
function generateSinglesSchedule(players, matchCount) {
  if (players.length < 2) {
    throw new Error("Need at least 2 players for singles");
  }

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const n = shuffled.length;

  // If odd, add a dummy bye
  const hasBye = n % 2 === 1;
  const list = hasBye ? [...shuffled, null] : [...shuffled];
  const size = list.length;

  const rounds = [];
  const totalRounds = size - 1;

  let arr = [...list];

  for (let r = 0; r < totalRounds; r++) {
    const round = [];

    for (let i = 0; i < size / 2; i++) {
      const p1 = arr[i];
      const p2 = arr[size - 1 - i];
      if (p1 && p2) {
        round.push([p1, p2]);
      }
    }

    rounds.push(round);

    // Rotate (keep first fixed)
    arr = [
      arr[0],
      arr[size - 1],
      ...arr.slice(1, size - 1),
    ];
  }

  // Flatten rounds into matches
  const allMatches = rounds.flat();

  // If not enough matches, wrap around
  const result = [];
  let idx = 0;

  while (result.length < matchCount) {
    result.push(allMatches[idx % allMatches.length]);
    idx++;
  }

  return result.map(pair => ({
    team1: [pair[0]],
    team2: [pair[1]],
  }));
}

function generateTournamentSchedule(team1, team2, matchCount) {
  if (team1.length < 2 || team2.length < 2) {
    throw new Error("Each team needs at least 2 players");
  }

  function generatePairs(team) {
    const pairs = [];
    for (let i = 0; i < team.length; i++) {
      for (let j = i + 1; j < team.length; j++) {
        pairs.push([team[i], team[j]]);
      }
    }
    return pairs;
  }

  const team1Pairs = generatePairs(team1);
  const team2Pairs = generatePairs(team2);

  // Shuffle once (random seed, structure preserved)
  team1Pairs.sort(() => Math.random() - 0.5);
  team2Pairs.sort(() => Math.random() - 0.5);

  const matches = [];

  // 🔑 CRITICAL FIX: opponent offset
  let opponentOffset = 0;

  for (let i = 0; i < matchCount; i++) {
    const t1Index = i % team1Pairs.length;
    const t2Index =
      (i + opponentOffset) % team2Pairs.length;

    matches.push({
      team1: team1Pairs[t1Index],
      team2: team2Pairs[t2Index],
    });

    // Move opponent offset when we complete a full cycle of team1 pairs
    if ((i + 1) % team1Pairs.length === 0) {
      opponentOffset++;
    }
  }

  return matches;
}


function generateScheduleWithBacktracking(playerGameCounts, matchCount) {
  const players = Object.keys(playerGameCounts);
  const MAX_BACKTRACKS = 50;
  let backtracks = 0;

  const initialState = {
    remaining: { ...playerGameCounts },
    matches: Array.from({ length: matchCount }, () => []),
    partnerCount: {},
  };

  function cloneState(state) {
    return {
      remaining: { ...state.remaining },
      matches: state.matches.map(m => [...m]),
      partnerCount: JSON.parse(JSON.stringify(state.partnerCount)),
    };
  }

  function canStillFill(state) {
    const slotsLeft =
      state.matches.reduce((s, m) => s + (4 - m.length), 0);
    const gamesLeft =
      Object.values(state.remaining).reduce((a, b) => a + b, 0);
    return slotsLeft === gamesLeft;
  }

  function getKeyPlayers(state) {
    const max = Math.max(...Object.values(state.remaining));
    return players.filter(p => state.remaining[p] === max);
  }

  function addPartner(p1, p2, state) {
    state.partnerCount[p1] ??= {};
    state.partnerCount[p2] ??= {};
    state.partnerCount[p1][p2] = (state.partnerCount[p1][p2] || 0) + 1;
    state.partnerCount[p2][p1] = (state.partnerCount[p2][p1] || 0) + 1;
  }

  function recurse(state) {
    if (backtracks > MAX_BACKTRACKS) return null;
    if (Object.values(state.remaining).every(v => v === 0)) {
      return state;
    }

    if (!canStillFill(state)) return null;

    const keys = getKeyPlayers(state).sort(() => Math.random() - 0.5);

    for (const key of keys) {
      const gamesNeeded = state.remaining[key];
      const candidateMatches = state.matches
        .map((m, i) => ({ m, i }))
        .filter(x => x.m.length < 4 && !x.m.includes(key));

      if (candidateMatches.length < gamesNeeded) continue;

      const shuffledMatches = [...candidateMatches]
        .sort(() => Math.random() - 0.5)
        .slice(0, gamesNeeded);

      const snapshot = cloneState(state);
      shuffledMatches.forEach(({ m }) => m.push(key));
      state.remaining[key] = 0;

      let teammates = players.filter(p => p !== key && state.remaining[p] > 0);
      let tIdx = 0;

      let failed = false;
      for (const { m } of shuffledMatches) {
        if (m.length >= 2) continue;

        let attempts = 0;
        while (attempts < teammates.length) {
          const t = teammates[tIdx % teammates.length];
          tIdx++;
          attempts++;

          if (state.remaining[t] > 0) {
            m.push(t);
            state.remaining[t]--;
            addPartner(key, t, state);
            break;
          }
        }

        if (m.length < 2) {
          failed = true;
          break;
        }
      }

      if (!failed) {
        const result = recurse(state);
        if (result) return result;
      }

      backtracks++;
      state = snapshot;
    }

    return null;
  }

  const finalState = recurse(initialState);
  if (!finalState) {
    throw new Error("Unable to generate schedule with given constraints");
  }

  // Fill remaining opponent slots greedily (safe)
  players.forEach(p => {
    while (finalState.remaining[p] > 0) {
      const m = finalState.matches.find(
        m => m.length < 4 && !m.includes(p)
      );
      if (!m) break;
      m.push(p);
      finalState.remaining[p]--;
    }
  });

  return finalState.matches.map(m => ({
    team1: [m[0], m[1]],
    team2: [m[2], m[3]],
  }));
}







const CreateGameScreen = ({ players, setCurrentGame, setOngoingGames }) => {
  const navigate = useNavigate();
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

  // ✅ Suggest ideal number of matches
  function suggestMatchCounts(selectedPlayers) {
    const n = selectedPlayers.length;
    if (n < 4) return [];

    const base = Math.round(n * 1.5);
    const max = Math.round(n * 2.5);

    const suggestions = [];

    for (let x = base; x <= max; x += n) {
      suggestions.push(x);
    }

    return [base, ...suggestions.slice(1, 3)];
  }
  function allocatePlayerGames(players, matchCount) {
  const totalSlots = matchCount * 4;
  const minGames = Math.floor(totalSlots / players.length);
  const remainder = totalSlots % players.length;

  const allocation = {};
  players.forEach(p => {
    allocation[p] = minGames;
  });

  // random assignment of extra slots
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  for (let i = 0; i < remainder; i++) {
    allocation[shuffled[i]] += 1;
  }

  return allocation;
}
const generateTournamentScheduleHandler = () => {
  if (teams.length !== 2) {
    alert("❗ Generate teams first");
    return;
  }

  try {
    const matches = generateTournamentSchedule(
      teams[0],
      teams[1],
      matchCount
    );
    setSchedule(matches);
  } catch (e) {
    alert(e.message);
  }
};
const generateSinglesScheduleHandler = () => {
  try {
    const matches = generateSinglesSchedule(
      selectedPlayers,
      matchCount
    );
    setSchedule(matches);
  } catch (e) {
    alert(e.message);
  }
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

  if (gameType !== "doubles_random") {
    alert("❗ This step only supports doubles_random.");
    return;
  }

  const allocation = allocatePlayerGames(selectedPlayers, matchCount);
  setPlayerGameCounts(allocation);
  setSchedule([]); // matches generated later
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
    navigate("/game");

  };

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

        {/* ✅ Suggested counts */}
        {gameType === "doubles_random" && selectedPlayers.length >= 4 && (
          <div style={{ marginTop: "0.5rem" }}>
            <label style={{ fontSize: "0.9rem", color: "#8f8" }}>
              ✅ Suggested Games:
            </label>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
              {suggestMatchCounts(selectedPlayers).map((m) => (
                <button
                  key={m}
                  style={{
                    padding: "6px 12px",
                    background: "#333",
                    border: "1px solid #ffff66",
                    borderRadius: "6px",
                    color: "#ffff66",
                    cursor: "pointer",
                  }}
                  onClick={() => setMatchCount(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {(gameType === "tournament") && (
        <div style={styles.buttonRow}>
          <button className="primary-button" onClick={generateTeams}>🎲 Generate Teams</button>
          <button
  className="primary-button"
  onClick={generateTournamentScheduleHandler}
>
  📅 Generate Schedule
</button>
        </div>
      )}
{gameType === "singles" && (
  <div style={{ marginTop: "1rem" }}>
    <button
      className="primary-button"
      onClick={generateSinglesScheduleHandler}
    >
      📅 Generate Singles Schedule
    </button>
  </div>
)}

      {gameType === "doubles_random" && (
  <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
    <button className="primary-button" onClick={generateSchedule}>
      🎯 Allocate Games
    </button>

<button
  className="primary-button"
  onClick={() => {
    const total = Object.values(playerGameCounts)
      .reduce((a, b) => a + b, 0);

    if (total !== matchCount * 4) {
      alert("❗ Invalid allocation");
      return;
    }

    try {
      const matches = generateScheduleWithBacktracking(
        playerGameCounts,
        matchCount
      );
      setSchedule(matches);
    } catch (e) {
      alert("❌ Could not generate a valid schedule. Try adjusting counts.");
    }
  }}
>
  🧠 Generate Schedule
</button>

  </div>
)}
{schedule.length > 0 && (
  <div style={styles.section}>
    <h4>📋 Optimized Match Schedule</h4>
    <ol>
      {schedule.map((match, idx) => (
        <li key={idx} style={{ marginBottom: "6px" }}>
          <strong>Match {idx + 1}:</strong>{" "}
          {match.team1.join(" & ")}{" "}
          <span style={{ color: "#8f8" }}>vs</span>{" "}
          {match.team2.join(" & ")}
        </li>
      ))}
    </ol>
  </div>
)}


      {teams.length === 2 && (
        <div style={styles.section}>
          <h4>🏁 Teams</h4>
          <p><strong>Team 1:</strong> {teams[0].join(", ")}</p>
          <p><strong>Team 2:</strong> {teams[1].join(", ")}</p>
        </div>
      )}

{Object.keys(playerGameCounts).length > 0 && (
  <div style={styles.section}>
    <h4>📊 Player Game Allocation</h4>

    <ul style={{ listStyle: "none", padding: 0 }}>
      {Object.entries(playerGameCounts).map(([p, c]) => (
        <li key={p} style={{ marginBottom: "8px" }}>
          <strong>{p}</strong>
          <input
            type="number"
            min="0"
            value={c}
            style={{
              width: "60px",
              marginLeft: "10px",
              padding: "4px",
              borderRadius: "4px",
            }}
            onChange={(e) =>
              setPlayerGameCounts(prev => ({
                ...prev,
                [p]: Number(e.target.value),
              }))
            }
          />{" "}
          games
        </li>
      ))}
    </ul>

    <p style={{ marginTop: "10px", fontSize: "0.9rem", color: "#8f8" }}>
      Total slots used:{" "}
      {Object.values(playerGameCounts).reduce((a, b) => a + b, 0)} /{" "}
      {matchCount * 4}
    </p>
  </div>
)}


      <div style={styles.buttonRow}>
        <button className="primary-button" onClick={createGame}>✅ Start Game</button>
        <button
  onClick={() => navigate("/", { replace: true })}
  style={styles.backBtn}
>
  🔙 Back
</button>

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
