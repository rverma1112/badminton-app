from flask import Flask, request, jsonify
from flask_cors import CORS
from db import (
    init_db, add_player_to_db, get_all_players_from_db,
    save_game_to_db, get_all_ongoing_games_from_db, save_player_stats,
    update_match_score, mark_game_as_completed,
    get_all_completed_games, get_overall_rankings, get_player_profile,
    delete_game, compute_rankings_by_type, 
)

import itertools
import random
from collections import defaultdict
import uuid
from datetime import datetime
from activity import mark_active
from idle_worker import start_idle_worker

import os


app = Flask(__name__)
CORS(app)

# Initialize database on server start
#init_db()

@app.route("/")
def root():
    return "OK", 200

ongoing_games = {}

# In-memory game storage
games = []
game_id_counter = 1

# Caches
RANKINGS_CACHE = {
    "overall": None,
    "singles": None,
    "doubles": None
}

PLAYER_PROFILE_CACHE = {}
if os.environ.get("ENABLE_IDLE_WORKER") == "true":
    start_idle_worker()

# ---- Match Scheduling Logic ---- #
def generate_balanced_schedule(team1, team2, total_matches):
    team1_pairs = list(itertools.combinations(team1, 2))
    team2_pairs = list(itertools.combinations(team2, 2))
    all_matches = list(itertools.product(team1_pairs, team2_pairs))
    random.shuffle(all_matches)

    player_match_counts = defaultdict(int)
    selected_matches = []

    def can_add_match(t1_pair, t2_pair):
        temp_counts = player_match_counts.copy()
        for p in t1_pair + t2_pair:
            temp_counts[p] += 1
        values = list(temp_counts.values())
        return max(values) - min(values) <= 1

    for match in all_matches:
        t1_pair, t2_pair = match
        if can_add_match(t1_pair, t2_pair):
            selected_matches.append((t1_pair, t2_pair))
            for p in t1_pair + t2_pair:
                player_match_counts[p] += 1
        if len(selected_matches) == total_matches:
            break

    return selected_matches


# ---- API Endpoints ---- #

@app.route("/add_player", methods=["POST"])
def add_player():
    mark_active()
    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"status": "error", "message": "Empty name"}), 400

    success = add_player_to_db(name)
    if not success:
        return jsonify({"status": "error", "message": "Player already exists"}), 400

    return jsonify({"status": "ok"})


@app.route("/get_players", methods=["GET"])
def get_players():
    mark_active()
    players = get_all_players_from_db()
    return jsonify(players)
# @app.route("/warmup", methods=["GET"])
# def warmup():
#     try:
#         db = SessionLocal()
#         db.execute("SELECT 1")
#         db.close()
#         return {"status": "db ready"}, 200
#     except Exception as e:
#         return {"status": "db not ready"}, 503

import time
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

@app.route("/warmup", methods=["GET"])
def warmup():
    for attempt in range(5):  # ~20 seconds max
        try:
            db = SessionLocal()
            db.execute(text("SELECT 1"))
            db.close()
            return {"status": "db ready"}, 200
        except OperationalError:
            wait = 2 + attempt * 3
            print(f"⏳ DB warming up, retrying in {wait}s...")
            time.sleep(wait)

    return {"status": "db not ready"}, 503

@app.route("/health")
def health():
    return jsonify({
        "backend": "ok",
        "time": datetime.utcnow().isoformat()
    })
from db import SessionLocal

@app.route("/db_health")
def db_health():
    try:
        db = SessionLocal()
        db.execute("SELECT 1").scalar()
        return jsonify({"database": "ok"})
    except Exception as e:
        return jsonify({"database": "down"}), 500
    finally:
        try:
            db.close()
        except:
            pass


from activity import seconds_since_last_active

@app.route("/capabilities")
def capabilities():
    idle_seconds = seconds_since_last_active()

    return jsonify({
        "essential": {
            "get_players": True,
            "create_game": True,
            "save_scores": True,
            "ongoing_games": True,
            "completed_games": True
        },
        "heavy": {
            "rankings": idle_seconds > 60,
            "player_profiles": idle_seconds > 60
        },
        "idle_seconds": int(idle_seconds)
    })



@app.route("/status")
def status():
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db_ok = True
    except:
        db_ok = False
    finally:
        try:
            db.close()
        except:
            pass

    idle_seconds = seconds_since_last_active()

    return jsonify({
        "backend": "ok",
        "database": "ok" if db_ok else "down",
        "idle_seconds": int(idle_seconds),
        "safe_for_heavy": idle_seconds > 60,
        "last_checked": datetime.utcnow().isoformat()
    })

from heavy_tasks import run_heavy_tasks

@app.route("/run_heavy_tasks", methods=["POST"])
def run_heavy_tasks_route():
    result = run_heavy_tasks(force=True)
    return jsonify(result)


@app.route("/create_game", methods=["POST"])
def create_game():
    mark_active()
    data = request.get_json()
    players = data["players"]
    teams = data["teams"]
    match_count = data["match_count"]
    matches = data["matches"]

    game_id = save_game_to_db(players, teams, match_count, matches)

    return jsonify({"status": "ok", "game_id": game_id})



# @app.route("/get_ongoing_games")
# def get_ongoing_games():
#     return jsonify({"games": ongoing_games})



# @app.route("/ongoing_game", methods=["GET"])
# def get_ongoing_game():
#     return jsonify(games[0] if games else {})


from flask import Flask, request, jsonify
  # 👈 import this

@app.route("/save_stats", methods=["POST"])
def save_stats():
    data = request.get_json()
    stats = data.get("stats", [])
    game_id = data.get("game_id")
    created_at = data.get("created_at")

    save_player_stats(stats, game_id, created_at)

    return jsonify({"status": "ok"})

from db import SessionLocal, compute_rankings_by_type

@app.route("/get_singles_rankings")
def get_singles_rankings():
    if RANKINGS_CACHE["singles"] is not None:
        return jsonify({"rankings": RANKINGS_CACHE["singles"]})

    db = SessionLocal()
    try:
        rankings = compute_rankings_by_type(db, "singles")
        RANKINGS_CACHE["singles"] = rankings
        return jsonify({"rankings": rankings})
    finally:
        db.close()



@app.route("/get_doubles_rankings")
def get_doubles_rankings():
    if RANKINGS_CACHE["doubles"] is not None:
        return jsonify({"rankings": RANKINGS_CACHE["doubles"]})

    db = SessionLocal()
    try:
        rankings = compute_rankings_by_type(db, "doubles")
        RANKINGS_CACHE["doubles"] = rankings
        return jsonify({"rankings": rankings})
    finally:
        db.close()



@app.route("/get_ongoing_games")
def get_ongoing_games():
    mark_active()
    games = get_all_ongoing_games_from_db()
    return jsonify({"games": games})

from db import save_completed_game_and_stats



@app.route("/complete_game", methods=["POST"])
def complete_game():
    mark_active()
    try:
        data = request.get_json()
        stats = data.get("stats", [])

        print("🚨 /complete_game payload:", data)

        if not stats:
            return jsonify({"status": "error", "message": "Missing stats"}), 400

        # 1️⃣ Save data to DB
        save_completed_game_and_stats(data, stats)

        # 2️⃣ 🔥 STEP 5 — invalidate backend cache
        RANKINGS_CACHE["overall"] = None
        RANKINGS_CACHE["singles"] = None
        RANKINGS_CACHE["doubles"] = None
        PLAYER_PROFILE_CACHE.clear()

        return jsonify({"status": "ok"})

    except Exception as e:
        print("🔥 Error in /complete_game:", e)
        return jsonify({"status": "error", "message": str(e)}), 500




@app.route("/get_completed_games")
def get_completed_games():
    return jsonify(get_all_completed_games())



@app.route("/end_game", methods=["POST"])
def end_game():
    data = request.get_json()
    game_id = data.get("game_id")
    if not game_id:
        return jsonify({"status": "error", "message": "Missing game_id"}), 400

    mark_game_as_completed(game_id)
    return jsonify({"status": "ok"})


from db import SessionLocal, get_overall_rankings

@app.route("/get_rankings")
def get_rankings():
    if RANKINGS_CACHE["overall"] is not None:
        return jsonify({"rankings": RANKINGS_CACHE["overall"]})

    db = SessionLocal()
    try:
        rankings = get_overall_rankings(db)
        RANKINGS_CACHE["overall"] = rankings
        return jsonify({"rankings": rankings})
    except Exception as e:
        print("🔥 ERROR in /get_rankings:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()




from db import get_player_profile

@app.route("/get_player_profile")
def get_player_profile_route():
    player_name = request.args.get("name")
    if not player_name:
        return jsonify({"error": "Missing player name"}), 400

    if player_name in PLAYER_PROFILE_CACHE:
        return jsonify(PLAYER_PROFILE_CACHE[player_name])

    db = SessionLocal()
    try:
        profile = get_player_profile(db, player_name)
        if profile is None:
            return jsonify({"error": "Player not found"}), 404

        PLAYER_PROFILE_CACHE[player_name] = profile
        return jsonify(profile)
    finally:
        db.close()




@app.route("/update_match_score", methods=["POST"])
def update_match_score_route():
    mark_active()
    data = request.get_json()
    success = update_match_score(
        data["game_id"],
        data["match_index"],
        data["team1_score"],
        data["team2_score"]
    )
    return jsonify({"status": "ok" if success else "error"})

from flask import Flask, request, jsonify
  # ✅ import your function

@app.route("/delete_game", methods=["POST"])
def handle_delete_game():
    mark_active()
    try:
        data = request.get_json()
        game_id = data.get("game_id")

        if game_id is None:
            return jsonify({"status": "error", "message": "game_id is required"}), 400

        # 1️⃣ Delete game from DB
        delete_game(game_id)

        # 2️⃣ 🔥 STEP 5 — invalidate backend cache
        RANKINGS_CACHE["overall"] = None
        RANKINGS_CACHE["singles"] = None
        RANKINGS_CACHE["doubles"] = None
        PLAYER_PROFILE_CACHE.clear()

        return jsonify({
            "status": "ok",
            "message": f"Game {game_id} deleted."
        })

    except Exception as e:
        print("Error in /delete_game:", e)
        return jsonify({"status": "error", "message": str(e)}), 500



if __name__ == "__main__":
    init_db
    app.run(host="0.0.0.0", port=10000)
