const API =
  process.env.REACT_APP_API_URL ||
  "https://badminton-api-j9ja.onrender.com";
;

export async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "API error");
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}
