from flask import Flask, request, jsonify
from flask_cors import CORS
from db import (
    init_db, add_player_to_db, get_all_players_from_db,
    save_game_to_db, get_all_ongoing_games_from_db, save_player_stats,
    update_match_score, mark_game_as_completed,
    get_all_completed_games, get_overall_rankings, get_player_profile,
    delete_game
)

import itertools
import random
from collections import defaultdict
import uuid
from datetime import datetime


app = Flask(__name__)
CORS(app)

# Initialize database on server start
init_db()
ongoing_games = {}

# In-memory game storage
games = []
game_id_counter = 1

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
    players = get_all_players_from_db()
    return jsonify(players)


@app.route("/create_game", methods=["POST"])
@app.route("/create_game", methods=["POST"])
def create_game():
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



@app.route("/get_ongoing_games")
def get_ongoing_games():
    games = get_all_ongoing_games_from_db()
    return jsonify({"games": games})

from db import save_completed_game_and_stats

@app.route("/complete_game", methods=["POST"])
def complete_game():
    try:
        data = request.get_json()
        stats = data.get("stats", [])

        print("🚨 /complete_game payload:", data)

        if not stats:
            return jsonify({"status": "error", "message": "Missing stats"}), 400

        save_completed_game_and_stats(data, stats)
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


@app.route("/get_rankings")
def get_rankings():
    rankings = get_overall_rankings()
    return jsonify({"rankings": rankings})



@app.route("/get_player_profile")
def get_player_profile_route():
    player_name = request.args.get("name")
    if not player_name:
        return jsonify({"error": "Missing player name"}), 400

    profile = get_player_profile(player_name)
    if profile is None:
        return jsonify({"error": "Player not found"}), 404

    return jsonify(profile)



@app.route("/update_match_score", methods=["POST"])
def update_match_score_route():
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
    try:
        data = request.get_json()
        game_id = data.get("game_id")

        if game_id is None:
            return jsonify({"status": "error", "message": "game_id is required"}), 400

        delete_game(game_id)
        return jsonify({"status": "ok", "message": f"Game {game_id} deleted."})
    
    except Exception as e:
        print("Error in /delete_game:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
