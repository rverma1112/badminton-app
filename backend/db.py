from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
import json
import psycopg2

# --- Configuration ---
DATABASE_URL = "postgresql://postgres.stnxjphrwhbwhxkggtvs:Rv%4096216@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# --- Raw psycopg2 connection for manual SQL queries ---
def get_connection():
    return psycopg2.connect(
    dbname="postgres",
    user="postgres.stnxjphrwhbwhxkggtvs",
    password="Rv@96216",
    host="aws-0-ap-south-1.pooler.supabase.com",
    port=6543
)


# --- Models ---
class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True)
    players = Column(JSON)
    teams = Column(JSON)
    match_count = Column(Integer)
    matches = Column(JSON)
    match_scores = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="ongoing")

class CompletedGame(Base):
    __tablename__ = "completed_games"
    id = Column(Integer, primary_key=True)
    players = Column(JSON)
    teams = Column(JSON)
    match_count = Column(Integer)
    matches = Column(JSON)
    results = Column(JSON)
    created_at = Column(DateTime)
    ended_at = Column(DateTime)

class PlayerStats(Base):
    __tablename__ = "player_stats"
    id = Column(Integer, primary_key=True)
    player = Column(String)
    played = Column(Integer)
    won = Column(Integer)
    lost = Column(Integer)
    point_diff = Column(Float)
    game_id = Column(Integer)
    created_at = Column(DateTime)

# --- Initialization ---
def init_db():
    Base.metadata.create_all(bind=engine)

# --- Core Functions ---
def add_player_to_db(name):
    db = SessionLocal()
    try:
        db.add(Player(name=name))
        db.commit()
        return True
    except:
        db.rollback()
        return False
    finally:
        db.close()

def get_all_players_from_db():
    db = SessionLocal()
    players = db.query(Player).all()
    db.close()
    return [p.name for p in players]

def save_game_to_db(players, teams, match_count, matches):
    db = SessionLocal()
    game = Game(
        players=players,
        teams=teams,
        match_count=match_count,
        matches=matches,
        match_scores=[None] * len(matches)
    )
    db.add(game)
    db.commit()
    game_id = game.id
    db.close()
    return game_id

def update_match_score(game_id, match_index, team1_score, team2_score):
    db = SessionLocal()
    game = db.query(Game).filter_by(id=game_id).first()
    if not game:
        db.close()
        return False
    scores = game.match_scores or []
    while len(scores) <= match_index:
        scores.append(None)
    scores[match_index] = {"team1": team1_score, "team2": team2_score}
    game.match_scores = scores
    db.commit()
    db.close()
    return True

def get_all_ongoing_games_from_db():
    db = SessionLocal()
    games = db.query(Game).filter_by(status="ongoing").order_by(Game.id.desc()).all()
    db.close()
    return [{
        "id": g.id,
        "players": g.players,
        "teams": g.teams,
        "match_count": g.match_count,
        "matches": g.matches,
        "match_scores": g.match_scores or [],
        "created_at": g.created_at.isoformat()
    } for g in games]

def mark_game_as_completed(game_id):
    db = SessionLocal()
    game = db.query(Game).filter_by(id=game_id).first()
    if game:
        game.status = "completed"
        db.commit()
    db.close()

def save_completed_game_and_stats(game_data, stats):
    db = SessionLocal()
    try:
        db.add(CompletedGame(
            id=game_data["id"],  # ✅ use as integer
            players=game_data["players"],
            teams=game_data["teams"],
            match_count=game_data["match_count"],
            matches=game_data["matches"],
            results=game_data["results"],
            created_at=game_data["created_at"],
            ended_at=game_data["ended_at"]
        ))

        for stat in stats:
            db.add(PlayerStats(
                player=stat["name"],
                played=stat["played"],
                won=stat["won"],
                lost=stat["lost"],
                point_diff=float(stat.get("pointDifferential", 0)),
                game_id=game_data["id"],  # ✅ ensure string
                created_at=game_data["created_at"]
            ))

        db.commit()
    except Exception as e:
        db.rollback()
        print("🔥 Error in save_completed_game_and_stats:", e)
        raise
    finally:
        db.close()



def get_all_completed_games():
    db = SessionLocal()
    games = db.query(CompletedGame).order_by(CompletedGame.ended_at.desc()).all()
    db.close()
    return [{
        "id": g.id,
        "players": g.players,
        "teams": g.teams,
        "match_count": g.match_count,
        "matches": g.matches,
        "results": g.results,
        "created_at": g.created_at.isoformat(),
        "ended_at": g.ended_at.isoformat()
    } for g in games]

def save_player_stats(stats, game_id, created_at):
    db = SessionLocal()
    for stat in stats:
        db.add(PlayerStats(
            player=stat["name"],
            played=stat["played"],
            won=stat["won"],
            lost=stat["lost"],
            point_diff=float(stat["pointDifferential"]),
            game_id=game_id,
            created_at=created_at
        ))
    db.commit()
    db.close()

def delete_game(game_id):
    db = SessionLocal()
    db.query(CompletedGame).filter_by(id=game_id).delete()
    db.query(PlayerStats).filter_by(game_id=game_id).delete()
    db.query(Game).filter_by(id=game_id).delete()
    db.commit()
    db.close()

def get_overall_rankings():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT player, SUM(played), SUM(won), SUM(lost), SUM(point_diff)
        FROM player_stats GROUP BY player
    """)
    raw_stats = cur.fetchall()

    cur.execute("SELECT matches, results FROM completed_games")
    games = cur.fetchall()
    conn.close()

    if not raw_stats:
        return []

    # Partner win% logic
    partner_stats = {}
    for matches, results in games:
        if not matches or not results:
            continue
        for match, result in zip(matches, results):
            t1, t2 = match["team1"], match["team2"]
            s1, s2 = int(result["team1"]), int(result["team2"])
            t1_won = s1 > s2

            def add(p1, p2, won):
                key = tuple(sorted([p1, p2]))
                if key not in partner_stats:
                    partner_stats[key] = [0, 0]
                if won:
                    partner_stats[key][0] += 1
                partner_stats[key][1] += 1

            if len(t1) == 2:
                add(t1[0], t1[1], t1_won)
            if len(t2) == 2:
                add(t2[0], t2[1], not t1_won)

    player_to_partners = {}
    for (p1, p2), (wins, total) in partner_stats.items():
        for a, b in [(p1, p2), (p2, p1)]:
            player_to_partners.setdefault(a, []).append({
                "partner": b, "wins": wins, "total": total,
                "win_pct": round((wins / total) * 100, 2) if total else 0
            })

    # Normalize performance, win%, experience
    max_played = max(row[1] for row in raw_stats)
    diffs = [row[4] for row in raw_stats]
    min_diff = min(diffs)
    max_diff = max(diffs)
    raw_win_rates = [(row[0], (row[2] / row[1]) * 100 if row[1] else 0) for row in raw_stats]
    max_win_rate = max(w for _, w in raw_win_rates)
    name_to_win_rate = dict(raw_win_rates)

    rankings = []

    for name, played, won, lost, diff in raw_stats:
        # Normalized Experience
        exp_score = (played / max_played) * 100 if max_played else 0

        # Normalized Performance
        if max_diff != min_diff:
            perf_score = ((diff - min_diff) / (max_diff - min_diff)) * 100
        else:
            perf_score = 50

        # Normalized Win Rate
        raw_win = name_to_win_rate[name]
        win_rate = round(raw_win, 2)
        win_score = (raw_win / max_win_rate) * 100 if max_win_rate else 0
        win_score = (raw_win / max_win_rate) * 100 if max_win_rate else 0

        # Final Rating
        rating = round(0.35 * perf_score + 0.45 * win_score + 0.2 * exp_score, 2)

        # Optional partner stats
        best = worst = None
        if name in player_to_partners:
            partners = sorted(
                [p for p in player_to_partners[name] if p["total"] >= 2],
                key=lambda x: x["win_pct"],
                reverse=True
            )
            if partners:
                best = partners[0]
                worst = partners[-1] if len(partners) > 1 else None

        rankings.append({
            "name": name,
            "played": played,
            "won": won,
            "lost": lost,
            "point_diff": round(diff, 2),
            "win_score": round(win_score, 2),
            "experience_score": round(exp_score, 2),
            "performance_score": round(perf_score, 2),
            "final_rating": rating,
            "best_partner": best,
            "worst_partner": worst
        })

    return sorted(rankings, key=lambda x: x["final_rating"], reverse=True)


def get_player_profile(player_name):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT played, won, lost, point_diff, game_id, created_at
        FROM player_stats WHERE player = %s ORDER BY created_at
    """, (player_name,))
    rows = cur.fetchall()

    if not rows:
        conn.close()
        return None

    history = []
    tp, tw, tl, pd = 0, 0, 0, 0
    for played, won, lost, point_diff, game_id, created_at in rows:
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        tp += played
        tw += won
        tl += lost
        pd += point_diff
        wr = (won / played) * 100 if played else 0
        avg = point_diff / played if played else 0
        rating = round(0.4 * ((avg + 20) / 40) * 100 + 0.3 * wr + 0.2 * (tp / 100) * 100, 2)
        history.append({
            "date": created_at.isoformat(),
            "rating": rating,
            "win_rate": round(wr, 2),
            "point_diff": round(avg, 2)
        })

    cur.execute("SELECT matches, results FROM completed_games")
    games = cur.fetchall()
    conn.close()

    partner_stats, opponent_stats = {}, {}

    def update(p1, p2, won, target):
        key = tuple(sorted([p1, p2]))
        if key not in target:
            target[key] = [0, 0]
        if won:
            target[key][0] += 1
        target[key][1] += 1

    for matches, results in games:  # ✅ already lists, no json.loads needed
        if not matches or not results:
            continue
        for m, r in zip(matches, results):
            t1, t2 = m["team1"], m["team2"]
            s1, s2 = int(r["team1"]), int(r["team2"])
            t1_won = s1 > s2
            if player_name in t1:
                team = t1
                opp = t2
                won = t1_won
            elif player_name in t2:
                team = t2
                opp = t1
                won = not t1_won
            else:
                continue
            teammate = [p for p in team if p != player_name][0]
            update(player_name, teammate, won, partner_stats)
            for o in opp:
                update(player_name, o, won, opponent_stats)

    def best_worst(stats):
        filtered = [(p2, w / t * 100, t) for (p1, p2), (w, t) in stats.items() if p1 == player_name and t >= 2]
        if not filtered:
            return None, None
        best = max(filtered, key=lambda x: x[1])
        worst = min(filtered, key=lambda x: x[1])
        return {"name": best[0], "win_pct": round(best[1], 2)}, {"name": worst[0], "win_pct": round(worst[1], 2)}

    best_p, worst_p = best_worst(partner_stats)
    best_o, worst_o = best_worst(opponent_stats)

    return {
        "name": player_name,
        "played": tp,
        "won": tw,
        "lost": tl,
        "win_rate": round((tw / tp) * 100, 2),
        "avg_point_diff": round(pd / tp, 2),
        "rating_progression": history,
        "best_partner": best_p,
        "worst_partner": worst_p,
        "favourite_opponent": best_o,
        "least_favourite_opponent": worst_o
    }
