import { useEffect, useState } from "react";
import { apiFetch } from "./api";

export function useStatus(poll = true) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await apiFetch("/status");
      setStatus(data);
    } catch {
      setStatus({ backend: "down" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  refresh();

  if (!poll) return;

  const id = setInterval(refresh, 15000);
  return () => clearInterval(id);
}, [poll]);

  return { status, loading, refresh };
}
