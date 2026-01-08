import React from "react";
import { useNavigate } from "react-router-dom";

const HomeScreen = ({ ongoingGames = [] }) => {
  const navigate = useNavigate();

  const buttons = [
    { label: "CREATE GAME", route: "/create" },
    { label: "ADD NEW PLAYER", route: "/add-player" },
    { label: "VIEW RANKINGS", route: "/rankings" },
    { label: "ONGOING GAMES", route: "/ongoing" },
    { label: "VIEW PREVIOUS GAMES", route: "/previous" },
    { label: "VIEW PROFILES", route: "/profile" },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.logoSection}>
        <div style={styles.logo}>
          <img src="/shuttle-icon-1.png" alt="Shuttle" style={styles.logoImage} />
          <h1 style={styles.logoText}>BADMINTON STATS TRACKER</h1>
        </div>
      </div>

      <div style={styles.grid}>
        {buttons.map((btn, i) => (
          <div
            key={i}
            style={{
              ...styles.card,
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)),
                url('/wave-overlay.svg'),
                url('/bg${i % 4 + 1}.png')
              `,
            }}
            onClick={() => navigate(btn.route)}
          >
            <span style={styles.cardText}>{btn.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundImage: "linear-gradient(to bottom right, #004d86, #000000, #366e00)",
    color: "#fff",
    minHeight: "100vh",
    padding: "2rem",
    fontFamily: "'Orbitron', sans-serif",
  },
  logoSection: {
    marginBottom: "2rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  logoText: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#ffff66",
    margin: 0,
  },
  logoImage: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    boxShadow: "0 0 6px #ffff66",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    position: "relative",
    border: "1px solid #ffff66",
    borderRadius: "12px",
    padding: "2rem",
    textAlign: "center",
    cursor: "pointer",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#ffff66",
    fontSize: "1.2rem",
    fontWeight: "bold",
    transition: "transform 0.2s",
  },
  cardText: {
    textShadow: "0 0 5px #000",
  },
};

export default HomeScreen;
