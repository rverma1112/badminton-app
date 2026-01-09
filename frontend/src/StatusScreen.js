import { useStatus } from "./useStatus";
import { apiFetch } from "./api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";



export default function StatusScreen() {
  const { status, loading, refresh } = useStatus();
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  async function runHeavy() {
    setMsg("Running heavy tasks...");
    try {
      const res = await apiFetch("/run_heavy_tasks", { method: "POST" });
      setMsg(res.status === "ok" ? "✅ Done" : "⏭️ Skipped");
    } catch {
      setMsg("❌ Error");
    }
    refresh();
  }

  if (loading) return <p>Loading status…</p>;

  return (
    <div>
    <div>
      <h2>Status</h2>
      <p>Backend: {status.backend}</p>
      <p>Database: {status.database}</p>
      <p>Idle seconds: {status.idle_seconds}</p>
      <p>Safe for heavy: {status.safe_for_heavy ? "Yes" : "No"}</p>

      <button
        disabled={!status.safe_for_heavy}
        onClick={runHeavy}
      >
        Run Rankings & Profiles
      </button>

      {msg && <p>{msg}</p>}
    </div>
<div style={{ textAlign: "center", marginTop: "2rem" }}>
  <button
    onClick={() => navigate("/")}
    style={{
      padding: "10px 16px",
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    ⬅ Back to Home
  </button>
</div>
</div>
    
  );
}

