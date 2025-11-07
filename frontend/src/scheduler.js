export function scheduleRandomDoubles(selectedPlayers, rankings, matchCount) {
  // --- 1) Sort by ranking (descending) ---
  const sorted = [...selectedPlayers].sort(
    (a, b) => (rankings[b] ?? 0) - (rankings[a] ?? 0)
  );

  // --- 2) Build all valid 2-player teams ---
  const pairs = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      pairs.push([sorted[i], sorted[j]]);
    }
  }

  // shuffle lightly – not random-only → ranking kept
  for (let i = pairs.length - 1; i > 0; i--) {
    if (Math.random() < 0.3) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
  }

  // --- 3) Form matches (team1 vs team2) ---
  const matches = [];
  let idx = 0;

  // Player game counts for fairness
  const counts = {};
  sorted.forEach(p => counts[p] = 0);

  while (matches.length < matchCount) {
    const t1 = pairs[idx % pairs.length];
    const t2 = pairs[(idx + 1) % pairs.length];

    // make sure no overlap
    if (t1.some(p => t2.includes(p))) {
      idx++;
      continue;
    }

    matches.push({
      team1: t1,
      team2: t2,
    });

    // update counts
    t1.forEach(p => counts[p]++);
    t2.forEach(p => counts[p]++);

    idx++;
  }

  return { matches, counts };
}
