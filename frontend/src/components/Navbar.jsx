import { useState, useEffect } from "react";

function Navbar({ activePage, onNavigate, onLogout }) {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch (e) {}
    }
  }, []);

  const getRoleBadge = (role) => {
    const badges = { citizen: "Citizen", user: "User", ngo: "NGO", authority: "Authority", admin: "Admin" };
    return badges[role] || role;
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "map", label: "Map" },
    { key: "report", label: "Report" },
    { key: "all_reports", label: "Reports" },
    ...(user?.role === "authority" || user?.role === "admin" ? [{ key: "view", label: "Verify" }] : []),
    { key: "alerts", label: "Alerts" },
    { key: "collaborations", label: "Collabs" },
    { key: "analytics", label: "Analytics" },
    { key: "predictive", label: "Predict" },
    ...(user?.role === "ngo" ? [{ key: "ngo_projects", label: "Projects" }] : []),
  ];

  return (
    <nav style={{ background: "#2255cc", borderBottom: "2px solid #1a3fa0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px" }}>
        <span
          onClick={() => onNavigate("dashboard")}
          style={{ color: "white", fontWeight: "bold", fontSize: "17px", cursor: "pointer", fontFamily: "Arial, sans-serif" }}
        >
          💧 WaterWatch
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user && (
            <span style={{ color: "white", fontSize: "12px", fontFamily: "Arial, sans-serif" }}>
              {user.name} &nbsp;
              <span style={{ background: "white", color: "#2255cc", padding: "1px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: "bold" }}>
                {getRoleBadge(user.role)}
              </span>
            </span>
          )}
          <button
            onClick={onLogout}
            style={{ background: "white", color: "#cc2222", border: "1px solid #cc2222", borderRadius: "3px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "Arial, sans-serif" }}
          >
            Logout
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", padding: "4px 14px 6px", background: "#1a3fa0" }}>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
            style={{
              background: activePage === item.key ? "white" : "transparent",
              color: activePage === item.key ? "#2255cc" : "white",
              border: "1px solid " + (activePage === item.key ? "white" : "rgba(255,255,255,0.3)"),
              borderRadius: "3px",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: activePage === item.key ? "bold" : "normal",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
