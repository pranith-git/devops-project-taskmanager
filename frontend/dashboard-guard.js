(function () {
  const API_BASE = "http://127.0.0.1:5000";
  const sessionKey = "taskmanager_session";

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(sessionKey) || "null");
    } catch {
      return null;
    }
  }

  async function checkSession() {
    try {
      const response = await fetch(`${API_BASE}/api/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Not authenticated");
      }

      const data = await response.json();
      localStorage.setItem(sessionKey, JSON.stringify({ username: data.username }));
      return;
    } catch (error) {
      localStorage.removeItem(sessionKey);
      window.location.href = "login.html";
    }
  }

  if (!getSession()) {
    checkSession();
    return;
  }

  checkSession();
})();
