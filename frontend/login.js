const API_BASE = "http://127.0.0.1:5000";
const form = document.getElementById("login-form");
const message = document.getElementById("message");
const registerBtn = document.getElementById("register-btn");

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

async function apiRequest(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Request failed.");
  }

  return result;
}

async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    setMessage("Please enter both username and password.", "error");
    return;
  }

  try {
    setMessage("Signing in...", "");
    const result = await apiRequest("/api/login", { username, password });
    localStorage.setItem("taskmanager_session", JSON.stringify({ username: result.username }));
    setMessage("Login successful. Redirecting...", "success");
    window.location.href = "index.html";
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function handleRegister() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    setMessage("Enter a username and password to create an account.", "error");
    return;
  }

  try {
    setMessage("Creating account...", "");
    await apiRequest("/api/register", { username, password });
    setMessage("Account created. Logging you in...", "success");
    const result = await apiRequest("/api/login", { username, password });
    localStorage.setItem("taskmanager_session", JSON.stringify({ username: result.username }));
    window.location.href = "index.html";
  } catch (error) {
    setMessage(error.message, "error");
  }
}

form.addEventListener("submit", handleLogin);
registerBtn.addEventListener("click", handleRegister);
