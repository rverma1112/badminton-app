from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
import json

DATABASE_URL = "postgresql://postgres:Rv%4096216@db.stnxjphrwhbwhxkggtvs.supabase.co:5432/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# --- Models ---
class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
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
    id = Column(String, primary_key=True)
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
    game_id = Column(String)
    created_at = Column(DateTime)

# --- Init ---
def init_db():
    Base.metadata.create_all(bind=engine)

# --- Functions ---
def add_player_to_db(name):
    db = SessionLocal()
    try:
        player = Player(name=name)
        db.add(player)
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

def save_completed_game(game_data):
    db = SessionLocal()
    game = CompletedGame(
        id=game_data["id"],
        players=game_data["players"],
        teams=game_data["teams"],
        match_count=game_data["match_count"],
        matches=game_data["matches"],
        results=game_data["results"],
        created_at=game_data["created_at"],
        ended_at=game_data["ended_at"]
    )
    db.add(game)
    db.commit()
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
        s = PlayerStats(
            player=stat["name"],
            played=stat["played"],
            won=stat["won"],
            lost=stat["lost"],
            point_diff=float(stat["pointDifferential"]),
            game_id=game_id,
            created_at=created_at
        )
        db.add(s)
    db.commit()
    db.close()

def delete_game(game_id):
    db = SessionLocal()
    db.query(CompletedGame).filter_by(id=game_id).delete()
    db.query(PlayerStats).filter_by(game_id=game_id).delete()
    db.query(Game).filter_by(id=game_id).delete()
    db.commit()
    db.close()
