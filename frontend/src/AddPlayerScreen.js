import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddPlayerScreen = ({ onAddPlayer }) => {
  const navigate = useNavigate();
  const [count, setCount] = useState(1);
  const [names, setNames] = useState([""]);

  const handleCountChange = (e) => {
    const newCount = Math.max(1, parseInt(e.target.value) || 1);
    setCount(newCount);
    setNames(Array(newCount).fill(""));
  };

  const handleNameChange = (index, value) => {
    const updated = [...names];
    updated[index] = value;
    setNames(updated);
  };

  const submitPlayers = async () => {
    const trimmed = names.map((n) => n.trim()).filter(Boolean);
    if (trimmed.length !== count) {
      alert("Please fill all player names.");
      return;
    }

    let successCount = 0;

    for (const name of trimmed) {
      const res = await onAddPlayer(name);
      if (res.status === "ok") successCount++;
    }

    alert(`✅ ${successCount} player(s) added!`);
    navigate("/"); // ✅ Go back to Home
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1rem", textAlign: "center" }}>
        ➕ Add Players
      </h2>

      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Number of players:
      </label>
      <input
        type="number"
        value={count}
        onChange={handleCountChange}
        min="1"
        max="50"
        style={{
          padding: "10px",
          width: "80px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          marginBottom: "1.5rem",
        }}
      />

      <div style={{ marginBottom: "2rem" }}>
        {names.map((name, i) => (
          <input
            key={i}
            type="text"
            value={name}
            placeholder={`Player ${i + 1} name`}
            onChange={(e) => handleNameChange(i, e.target.value)}
            style={{
              padding: "10px",
              width: "100%",
              marginBottom: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={submitPlayers}
          className="primary-button"
          style={{ flex: 1 }}
        >
          ➕ Add Players
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            flex: 1,
            cursor: "pointer",
          }}
        >
          🔙 Back
        </button>
      </div>
    </div>
  );
};

export default AddPlayerScreen;
