import { useState } from "react";

const API = "http://localhost:8000";

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("citizen");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Invalid credentials");

        localStorage.setItem("token", data.access_token);

        const meRes = await fetch(`${API}/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const user = await meRes.json();
        if (!meRes.ok) {
          localStorage.removeItem("token");
          throw new Error(user.detail || "Failed to fetch user");
        }

        localStorage.setItem("user", JSON.stringify(user));
        onLogin();
      } else {
        const res = await fetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Registration failed");

        alert("Registered successfully. Please login.");
        setMode("login");
        setName(""); setEmail(""); setPassword(""); setRole("citizen");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0" }}>
      <div style={{ width: "360px", background: "white", border: "1px solid #cccccc", borderRadius: "4px", padding: "28px 24px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "4px", fontSize: "20px" }}>💧 WaterWatch</h2>
        <p style={{ textAlign: "center", color: "#666", fontSize: "13px", marginBottom: "18px" }}>
          {mode === "login" ? "Sign in to your account" : "Create a new account"}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Full Name</label>
                <input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} required />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%" }}>
                  <option value="citizen">Citizen</option>
                  <option value="ngo">NGO Member</option>
                  <option value="authority">Authority</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Email</label>
            <input placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} required />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Password</label>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%" }} required />
          </div>

          {error && (
            <div style={{ background: "#fff0f0", border: "1px solid #cc2222", borderRadius: "3px", padding: "8px 10px", color: "#cc2222", fontSize: "13px", marginBottom: "10px" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "8px", fontSize: "14px" }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <hr style={{ margin: "16px 0", borderColor: "#cccccc" }} />

        <p style={{ fontSize: "13px", textAlign: "center", color: "#555" }}>
          {mode === "login" ? (
            <>Don't have an account? <span style={{ color: "#2255cc", cursor: "pointer" }} onClick={() => { setMode("register"); setError(""); }}>Register</span></>
          ) : (
            <>Already have an account? <span style={{ color: "#2255cc", cursor: "pointer" }} onClick={() => { setMode("login"); setError(""); }}>Sign in</span></>
          )}
        </p>

        {mode === "login" && (
          <div style={{ marginTop: "14px", background: "#f5f8ff", border: "1px solid #c0cff0", borderRadius: "3px", padding: "10px 12px", fontSize: "12px", color: "#444" }}>
            <strong>Demo Credentials:</strong><br />
            User: user@example.com / password123<br />
            Authority: authority@example.com / password123
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
