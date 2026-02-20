import { useEffect, useState, useRef } from "react";

const API = "http://localhost:8000";

function Alerts({ onReportAlert }) {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ type: "boil_notice", message: "", location: "", latitude: "", longitude: "", severity: "medium" });
  const [creating, setCreating] = useState(false);
  const [notification, setNotification] = useState(null);
  const notifTimerRef = useRef(null);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotification(null), 4000);
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API}/alerts/`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAlerts(data);
      filterAlerts(data, filterType);
    } catch (err) { console.error("Failed to fetch alerts", err); }
  };

  const filterAlerts = (alertsList, type) => {
    setFilteredAlerts(type === "all" ? alertsList : alertsList.filter((a) => a.type === type));
  };

  useEffect(() => { fetchAlerts(); const interval = setInterval(fetchAlerts, 30000); return () => clearInterval(interval); }, []);

  const handleFilterChange = (type) => { setFilterType(type); filterAlerts(alerts, type); };

  const resolveAlert = async (alertId) => {
    try {
      const res = await fetch(`${API}/alerts/${alertId}/resolve`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchAlerts();
    } catch (err) { console.error("Failed to resolve alert", err); }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      const res = await fetch(`${API}/alerts/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(createForm) });
      if (res.ok) {
        setShowCreateForm(false);
        setCreateForm({ type: "boil_notice", message: "", location: "", latitude: "", longitude: "", severity: "medium" });
        fetchAlerts();
        showNotification("Alert created successfully!", "success");
      } else {
        const data = await res.json().catch(() => ({}));
        showNotification(data.detail || "Failed to create alert", "error");
      }
    } catch (err) { showNotification("Error: " + err.message, "error"); }
    finally { setCreating(false); }
  };

  const getSeverityColor = (severity) => ({ low: "#228822", medium: "#cc8800", high: "#cc2222", critical: "#880000" }[severity] || "#2255cc");

  const inp = { width: "100%", padding: "6px 8px", margin: "4px 0 10px 0", border: "1px solid #cccccc", borderRadius: "3px", fontSize: "13px", boxSizing: "border-box" };
  const lbl = { display: "block", fontWeight: "bold", fontSize: "12px", color: "#444" };

  return (
    <div className="page-container">
      <h2 className="page-header">Water Quality Alerts</h2>

      {notification && (
        <div style={{ padding: "8px 12px", marginBottom: "12px", borderRadius: "3px", fontSize: "13px", background: notification.type === "success" ? "#efffef" : "#fff0f0", border: `1px solid ${notification.type === "success" ? "#228822" : "#cc2222"}`, color: notification.type === "success" ? "#228822" : "#cc2222" }}>
          {notification.msg}
        </div>
      )}

      {(user?.role === "authority" || user?.role === "admin") && (
        <div style={{ marginBottom: "12px" }}>
          <button onClick={() => setShowCreateForm(!showCreateForm)}>{showCreateForm ? "Cancel" : "Create New Alert"}</button>
        </div>
      )}

      {showCreateForm && (user?.role === "authority" || user?.role === "admin") && (
        <form onSubmit={handleCreateAlert} className="glass-card" style={{ maxWidth: "560px", marginBottom: "16px" }}>
          <h3 style={{ marginBottom: "12px" }}>Create New Alert</h3>
          <label style={lbl}>Alert Type *</label>
          <select value={createForm.type} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })} style={inp} required>
            <option value="boil_notice">Boil Notice</option>
            <option value="contamination">Contamination</option>
            <option value="outage">Outage</option>
          </select>
          <label style={lbl}>Message *</label>
          <textarea value={createForm.message} onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })} placeholder="Describe the alert details..." style={{ ...inp, minHeight: "70px", resize: "vertical" }} required />
          <label style={lbl}>Location *</label>
          <input value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} placeholder="e.g., Yamuna River, Delhi" style={inp} required />
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}><label style={lbl}>Latitude</label><input value={createForm.latitude} onChange={(e) => setCreateForm({ ...createForm, latitude: e.target.value })} placeholder="e.g., 28.6139" style={inp} /></div>
            <div style={{ flex: 1 }}><label style={lbl}>Longitude</label><input value={createForm.longitude} onChange={(e) => setCreateForm({ ...createForm, longitude: e.target.value })} placeholder="e.g., 77.2090" style={inp} /></div>
          </div>
          <label style={lbl}>Severity *</label>
          <select value={createForm.severity} onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value })} style={inp} required>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button type="submit" disabled={creating} style={{ width: "100%", marginTop: "4px" }}>{creating ? "Creating..." : "Create Alert"}</button>
        </form>
      )}

      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
        {[{ key: "all", label: "All" }, { key: "boil_notice", label: "Boil Notices" }, { key: "contamination", label: "Contamination" }, { key: "outage", label: "Outages" }].map((f) => (
          <button key={f.key} onClick={() => handleFilterChange(f.key)}
            style={{ background: filterType === f.key ? "#2255cc" : "white", color: filterType === f.key ? "white" : "#2255cc", border: "1px solid #2255cc", borderRadius: "3px", padding: "4px 12px", fontSize: "12px", cursor: "pointer" }}>
            {f.label}
          </button>
        ))}
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "30px" }}>
          <p style={{ fontSize: "14px", color: "#228822" }}>No active alerts — all parameters within safe limits</p>
        </div>
      ) : (
        filteredAlerts.map((al) => (
          <div key={al.id} className="glass-card" style={{ marginBottom: "10px", borderLeft: `4px solid ${getSeverityColor(al.severity)}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: "bold" }}>{al.location}</div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                  <span style={{ background: getSeverityColor(al.severity), color: "#fff", padding: "1px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: "bold" }}>{al.severity?.toUpperCase()}</span>
                  <span style={{ fontSize: "11px", color: "#666" }}>{new Date(al.issued_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: "13px", color: "#444", marginBottom: "10px" }}>{al.message}</p>
            {al.latitude && al.longitude && <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>Lat: {al.latitude}, Lon: {al.longitude}</p>}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {(user?.role === "authority" || user?.role === "admin") && al.is_active === "true" && (
                <button onClick={() => resolveAlert(al.id)} className="btn-danger" style={{ fontSize: "12px", padding: "5px 12px" }}>Mark as Resolved</button>
              )}
              {!al.report_id && onReportAlert && (
                <button onClick={() => onReportAlert(al.id)} style={{ fontSize: "12px", padding: "5px 12px" }}>Report Issue</button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Alerts;
