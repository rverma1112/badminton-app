// ---------------------------------------------------
// Balanced Random Doubles Scheduler
// ---------------------------------------------------

// Get rankings → high-ranked players play more if needed
async function fetchRankings() {
  try {
    const res = await fetch("https://badminton-api-j9ja.onrender.com/get_rankings");
    const data = await res.json();
    // Rankings format: [{ name, rating }, ...]
    return (data.rankings || []).reduce((map, p) => {
      map[p.name] = p.rating;
      return map;
    }, {});
  } catch (e) {
    console.log("⚠ Unable to fetch rankings → fallback", e);
    return {};
  }
}

export async function scheduleRandomDoubles(players, matchCount) {
  if (players.length < 4) return [];

  const rankings = await fetchRankings();

  // Sort players so that highest ranked are first → prioritized for games
  const sorted = [...players].sort(
    (a, b) => (rankings[b] || 0) - (rankings[a] || 0)
  );

  // Start with all possible doubles combos
  const combos = [];

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      combos.push([sorted[i], sorted[j]]);
    }
  }

  // Track usage
  const pairCount = {};
  const playerCount = {};

  sorted.forEach(p => (playerCount[p] = 0));

  function pairKey(p) {
    return p.slice().sort().join("-");
  }

  function playersHavePlayedEnough(p) {
    // Favor higher-ranked players
    return playerCount[p] > Math.max(...Object.values(playerCount));
  }

  function scorePair(p) {
    const key = pairKey(p);
    return (pairCount[key] || 0);
  }

  // Try to pick best pair
  function pickBestPair(exclude = []) {
    const valid = combos.filter(
      p =>
        !exclude.includes(p) &&
        !(playersHavePlayedEnough(p[0]) && playersHavePlayedEnough(p[1]))
    );

    if (!valid.length) return null;

    valid.sort((a, b) => scorePair(a) - scorePair(b));
    return valid[0];
  }

  const matches = [];

  for (let m = 0; m < matchCount; m++) {
    let used = new Set();

    const t1 = pickBestPair();
    if (!t1) break;

    used.add(t1[0]);
    used.add(t1[1]);

    const t2 = pickBestPair(
      combos.filter(p => used.has(p[0]) || used.has(p[1]))
    );

    if (!t2) break;

    matches.push({
      team1: t1,
      team2: t2
    });

    // update counts
    function bump(p) {
      playerCount[p] = (playerCount[p] || 0) + 1;
    }
    bump(t1[0]); bump(t1[1]);
    bump(t2[0]); bump(t2[1]);

    pairCount[pairKey(t1)] = (pairCount[pairKey(t1)] || 0) + 1;
    pairCount[pairKey(t2)] = (pairCount[pairKey(t2)] || 0) + 1;
  }

  return { matches, playerCount };
}
