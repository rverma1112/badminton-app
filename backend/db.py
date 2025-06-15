import sqlite3

# def init_db():
#     conn = sqlite3.connect("badminton.db")
#     c = conn.cursor()
#     c.execute('''
#         CREATE TABLE IF NOT EXISTS players (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             name TEXT UNIQUE NOT NULL
#         )
#     ''')
#     c.execute('''
#     CREATE TABLE IF NOT EXISTS games (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         players TEXT,
#         teams TEXT,
#         match_count INTEGER,
#         matches TEXT,
#         created_at TEXT,
#         status TEXT DEFAULT 'ongoing'
#     )
# ''')


#     conn.commit()
#     conn.close()

def init_db():
    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            players TEXT,
            teams TEXT,
            match_count INTEGER,
            matches TEXT,
            created_at TEXT,
            status TEXT DEFAULT 'ongoing',
            match_scores TEXT   -- ✅ NEW FIELD
        )
    ''')
    conn.commit()
    conn.close()

def add_player_to_db(name):
    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    try:
        c.execute("INSERT INTO players (name) VALUES (?)", (name,))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_all_players_from_db():
    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    c.execute("SELECT name FROM players")
    players = [row[0] for row in c.fetchall()]
    conn.close()
    return players

def save_game_to_db(players, teams, match_count, matches):
    import json
    from datetime import datetime
    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    created_at = datetime.now().isoformat()

    match_scores = [None] * len(matches)  # ✅ initialize with None

    c.execute("""
        INSERT INTO games (players, teams, match_count, matches, created_at, match_scores)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        json.dumps(players),
        json.dumps(teams),
        match_count,
        json.dumps(matches),
        created_at,
        json.dumps(match_scores)
    ))

    conn.commit()
    game_id = c.lastrowid
    conn.close()
    return game_id



def get_ongoing_game_from_db():
    import json
    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    c.execute("SELECT id, players, teams, match_count, matches, created_at FROM games WHERE status = 'ongoing' ORDER BY id DESC")
    
    
    row = c.fetchone()
    conn.close()
    if row:
        return {
            "id": row[0],
            "players": json.loads(row[1]),
            "teams": json.loads(row[2]),
            "match_count": row[3]
            
        }
    return None



import sqlite3
from datetime import datetime

def create_stats_table():
    conn = sqlite3.connect("badminton.db")
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS player_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player TEXT,
            played INTEGER,
            won INTEGER,
            lost INTEGER,
            point_diff REAL,
            game_id TEXT,
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_player_stats(stats, game_id, created_at):
    create_stats_table()
    conn = sqlite3.connect("badminton.db")
    cur = conn.cursor()
    for stat in stats:
        cur.execute("""
            INSERT INTO player_stats (player, played, won, lost, point_diff, game_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            stat["name"],
            stat["played"],
            stat["won"],
            stat["lost"],
            float(stat["pointDifferential"]),
            game_id,
            created_at
        ))
    conn.commit()
    conn.close()


def get_all_ongoing_games_from_db():
    import json
    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    c.execute("SELECT id, players, teams, match_count, matches, created_at, match_scores FROM games WHERE status = 'ongoing' ORDER BY id DESC")

    rows = c.fetchall()
    conn.close()
    games = []
    for row in rows:
        games.append({
            "id": row[0],
            "players": json.loads(row[1]),
            "teams": json.loads(row[2]),
            "match_count": row[3],
            "matches": json.loads(row[4]),
            "created_at": row[5],
            "match_scores": json.loads(row[6]) if row[6] else []  # ✅ ADD THIS
        })
    return games


def create_completed_games_table():
    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS completed_games (
            id TEXT PRIMARY KEY,
            players TEXT,
            teams TEXT,
            match_count INTEGER,
            matches TEXT,
            results TEXT,
            created_at TEXT,
            ended_at TEXT
        )
    """)
    conn.commit()
    conn.close()


def save_completed_game(game_data):
    create_completed_games_table()
    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    import json
    c.execute("""
        INSERT INTO completed_games 
        (id, players, teams, match_count, matches, results, created_at, ended_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        game_data["id"],
        json.dumps(game_data["players"]),
        json.dumps(game_data["teams"]),
        game_data["match_count"],
        json.dumps(game_data["matches"]),
        json.dumps(game_data["results"]),
        game_data["created_at"],
        game_data["ended_at"]
    ))
    conn.commit()
    conn.close()


def get_all_completed_games():
    create_completed_games_table()  # ✅ Ensure table exists

    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    import json
    c.execute("SELECT * FROM completed_games ORDER BY ended_at DESC")
    rows = c.fetchall()
    conn.close()
    games = []
    for row in rows:
        games.append({
            "id": row[0],
            "players": json.loads(row[1]),
            "teams": json.loads(row[2]),
            "match_count": row[3],
            "matches": json.loads(row[4]),
            "results": json.loads(row[5]),
            "created_at": row[6],
            "ended_at": row[7]
        })
    return games
def mark_game_as_completed(game_id):
    conn = sqlite3.connect("badminton.db")
    cur = conn.cursor()
    cur.execute("UPDATE games SET status = 'completed' WHERE id = ?", (game_id,))
    conn.commit()
    conn.close()
def get_overall_rankings():
    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    c.execute("""
        SELECT player, SUM(played), SUM(won), SUM(lost), SUM(point_diff)
        FROM player_stats
        GROUP BY player
    """)
    raw_stats = c.fetchall()
    conn.close()

    if not raw_stats:
        return []

    max_played = max(row[1] for row in raw_stats)
    max_diff = max(abs(row[4]) for row in raw_stats)
    rankings = []

    # 👇 Partner stats
    partner_stats = get_partner_stats()
    player_to_partners = {}

    for (p1, p2), (wins, total) in partner_stats.items():
        for a, b in [(p1, p2), (p2, p1)]:
            if a not in player_to_partners:
                player_to_partners[a] = []
            player_to_partners[a].append({
                "partner": b,
                "wins": wins,
                "total": total,
                "win_pct": round((wins / total) * 100, 2) if total > 0 else 0
            })

    for row in raw_stats:
        name, played, won, lost, point_diff = row
        win_rate = (won / played) * 100 if played > 0 else 0
        experience_score = (played / max_played) * 100 if max_played else 0
        performance_score = ((point_diff + max_diff) / (2 * max_diff)) * 100 if max_diff else 50
        final_rating = round(0.4 * performance_score + 0.3 * win_rate + 0.2 * experience_score, 2)

        best = worst = None
        if name in player_to_partners:
            sorted_partners = sorted(
                [p for p in player_to_partners[name] if p["total"] >= 2],  # Only show frequent
                key=lambda x: x["win_pct"],
                reverse=True
            )
            if sorted_partners:
                best = sorted_partners[0]
                worst = sorted_partners[-1] if len(sorted_partners) > 1 else None

        rankings.append({
            "name": name,
            "played": played,
            "won": won,
            "lost": lost,
            "point_diff": round(point_diff, 2),
            "win_rate": round(win_rate, 2),
            "experience_score": round(experience_score, 2),
            "performance_score": round(performance_score, 2),
            "final_rating": final_rating,
            "best_partner": best,
            "worst_partner": worst
        })

    rankings.sort(key=lambda x: x["final_rating"], reverse=True)
    return rankings

def get_partner_stats():
    import json
    conn = sqlite3.connect("badminton.db")
    c = conn.cursor()
    c.execute("SELECT matches, results FROM completed_games")
    games = c.fetchall()
    conn.close()

    pair_stats = {}  # (player1, player2): [wins, total]

    def add_pair(p1, p2, won):
        key = tuple(sorted([p1, p2]))
        if key not in pair_stats:
            pair_stats[key] = [0, 0]
        if won:
            pair_stats[key][0] += 1
        pair_stats[key][1] += 1

    for match_json, result_json in games:
        matches = json.loads(match_json)
        results = json.loads(result_json)

        for match, result in zip(matches, results):
            team1 = match["team1"]
            team2 = match["team2"]
            team1_score = int(result["team1"])
            team2_score = int(result["team2"])

            team1_won = team1_score > team2_score
            add_pair(team1[0], team1[1], team1_won)
            add_pair(team2[0], team2[1], not team1_won)

    return pair_stats



def get_player_profile(player_name):
    import json
    conn = sqlite3.connect("badminton.db")
    cur = conn.cursor()

    # Fetch all stats rows for the player
    cur.execute("""
        SELECT played, won, lost, point_diff, game_id, created_at
        FROM player_stats
        WHERE player = ?
        ORDER BY created_at
    """, (player_name,))
    rows = cur.fetchall()

    if not rows:
        return None

    # Time-based rating progression
    history = []
    total_played = total_won = total_lost = 0
    total_point_diff = 0

    for row in rows:
        played, won, lost, point_diff, game_id, created_at = row
        total_played += played
        total_won += won
        total_lost += lost
        total_point_diff += point_diff

        win_rate = (won / played) * 100 if played else 0
        avg_diff = point_diff / played if played else 0
        rating = round(
            0.4 * ((avg_diff + 20) / 40) * 100 +  # assuming max diff ~±20
            0.3 * win_rate +
            0.2 * (total_played / 100) * 100, 2
        )

        history.append({
            "date": created_at,
            "rating": rating,
            "win_rate": round(win_rate, 2),
            "point_diff": round(avg_diff, 2)
        })

    # Best/Worst partner
    cur.execute("SELECT matches, results FROM completed_games")
    games = cur.fetchall()
    conn.close()

    partner_stats = {}
    opponent_stats = {}

    def update_stats(player1, player2, won, stat_map):
        key = tuple(sorted([player1, player2]))
        if player1 == player2:
            return
        if key not in stat_map:
            stat_map[key] = [0, 0]
        if won:
            stat_map[key][0] += 1
        stat_map[key][1] += 1

    for matches_json, results_json in games:
        matches = json.loads(matches_json)
        results = json.loads(results_json)
        for match, res in zip(matches, results):
            t1 = match["team1"]
            t2 = match["team2"]
            s1 = int(res["team1"])
            s2 = int(res["team2"])
            t1_won = s1 > s2

            if player_name in t1:
                teammate = [p for p in t1 if p != player_name]
                opponents = t2
                update_stats(player_name, teammate[0], t1_won, partner_stats)
                for opp in opponents:
                    update_stats(player_name, opp, t1_won, opponent_stats)

            elif player_name in t2:
                teammate = [p for p in t2 if p != player_name]
                opponents = t1
                update_stats(player_name, teammate[0], not t1_won, partner_stats)
                for opp in opponents:
                    update_stats(player_name, opp, not t1_won, opponent_stats)

    def get_best_worst(stat_map):
        pairs = []
        for (p1, p2), (wins, total) in stat_map.items():
            if p1 == player_name:
                win_pct = (wins / total) * 100 if total else 0
                pairs.append((p2, win_pct, total))
            elif p2 == player_name:
                win_pct = (wins / total) * 100 if total else 0
                pairs.append((p1, win_pct, total))
        filtered = [p for p in pairs if p[2] >= 2]  # min 2 matches
        if not filtered:
            return None, None
        best = max(filtered, key=lambda x: x[1])
        worst = min(filtered, key=lambda x: x[1])
        return {"name": best[0], "win_pct": round(best[1], 2)}, {"name": worst[0], "win_pct": round(worst[1], 2)}

    best_partner, worst_partner = get_best_worst(partner_stats)
    best_opp, worst_opp = get_best_worst(opponent_stats)

    return {
        "name": player_name,
        "played": total_played,
        "won": total_won,
        "lost": total_lost,
        "win_rate": round((total_won / total_played) * 100, 2) if total_played else 0,
        "avg_point_diff": round(total_point_diff / total_played, 2) if total_played else 0,
        "rating_progression": history,
        "best_partner": best_partner,
        "worst_partner": worst_partner,
        "favourite_opponent": best_opp,
        "least_favourite_opponent": worst_opp
    }


def update_match_score(game_id, match_index, team1_score, team2_score):
    import json
    conn = sqlite3.connect("badminton.db")
    cur = conn.cursor()

    cur.execute("SELECT match_scores FROM games WHERE id = ?", (game_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return False

    scores = json.loads(row[0]) if row[0] else []
    while len(scores) <= match_index:
        scores.append(None)

    scores[match_index] = {"team1": team1_score, "team2": team2_score}

    cur.execute("UPDATE games SET match_scores = ? WHERE id = ?", (json.dumps(scores), game_id))
    conn.commit()
    conn.close()
    return True
