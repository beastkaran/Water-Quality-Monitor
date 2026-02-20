import { useState, useEffect } from "react";

const API = "http://localhost:8000";

function SubmitReport({ alertId, onDone }) {
  const [stations, setStations] = useState([]);
  const [form, setForm] = useState({ location: "", latitude: "", longitude: "", description: "", water_source: "", station_name: "", alert_id: alertId || null, photo_url: "", status: "pending" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => { fetch(`${API}/stations/`).then((r) => r.json()).then(setStations).catch(() => {}); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhotoChange = (e) => { const file = e.target.files[0]; if (file) setForm({ ...form, photo_url: URL.createObjectURL(file) }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { alert("Please login first"); return; }
    try {
      setLoading(true); setSuccess(false);
      const payload = { ...form };
      if (!payload.alert_id) delete payload.alert_id;
      const response = await fetch(`${API}/reports/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to submit report");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setForm({ location: "", latitude: "", longitude: "", description: "", water_source: "", station_name: "", alert_id: null, photo_url: "", status: "pending" });
      if (onDone) onDone();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "6px 8px", margin: "4px 0 10px 0", border: "1px solid #cccccc", borderRadius: "3px", fontSize: "13px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" };
  const lbl = { display: "block", marginTop: "4px", marginBottom: "2px", fontWeight: "bold", fontSize: "12px", color: "#444" };

  return (
    <div style={{ maxWidth: "580px", margin: "0 auto", padding: "20px 16px" }}>
      <div className="glass-card">
        <h2 className="page-header">{alertId ? "Report Issue for Alert" : "Submit Pollution Report"}</h2>

        {alertId && (
          <div style={{ background: "#fff0f0", border: "1px solid #cc2222", borderRadius: "3px", padding: "8px 12px", marginBottom: "14px", fontSize: "13px", color: "#cc2222" }}>
            This report is linked to Alert #{alertId}
          </div>
        )}

        {success && (
          <div style={{ padding: "8px 12px", background: "#efffef", border: "1px solid #228822", borderRadius: "3px", color: "#228822", fontWeight: "bold", marginBottom: "12px", fontSize: "13px" }}>
            Report submitted successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={lbl}>Station Name</label>
          <select name="station_name" value={form.station_name} onChange={handleChange} style={inp}>
            <option value="">-- Select Station (Optional) --</option>
            {stations.map((s) => <option key={s.id} value={s.name}>{s.name} ({s.location})</option>)}
          </select>

          <label style={lbl}>Location Name *</label>
          <input name="location" placeholder="e.g., Yamuna River, Delhi" value={form.location} onChange={handleChange} style={inp} required />

          <div style={{ background: "#f5f5f5", padding: "10px 12px", border: "1px solid #cccccc", borderRadius: "3px", marginBottom: "8px" }}>
            <div style={{ fontSize: "11px", color: "#666", fontWeight: "bold", marginBottom: "8px", textTransform: "uppercase" }}>Coordinates (Optional)</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}><label style={lbl}>Latitude</label><input name="latitude" placeholder="e.g., 28.6139" value={form.latitude} onChange={handleChange} style={inp} /></div>
              <div style={{ flex: 1 }}><label style={lbl}>Longitude</label><input name="longitude" placeholder="e.g., 77.2090" value={form.longitude} onChange={handleChange} style={inp} /></div>
            </div>
          </div>

          <label style={lbl}>Water Source *</label>
          <input name="water_source" placeholder="e.g., River, Lake, Ocean, Groundwater" value={form.water_source} onChange={handleChange} style={inp} required />

          <label style={lbl}>Description *</label>
          <textarea name="description" placeholder="Describe the pollution details..." value={form.description} onChange={handleChange} style={{ ...inp, minHeight: "100px", resize: "vertical" }} required />

          <label style={lbl}>Upload Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ ...inp, padding: "6px" }} />
          {form.photo_url && <img src={form.photo_url} alt="Preview" style={{ width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "3px", marginBottom: "8px" }} />}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "9px", marginTop: "8px", fontSize: "14px" }}>
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>

        <div style={{ marginTop: "12px", fontSize: "11px", color: "#999", textAlign: "center" }}>Fields marked with * are required</div>
      </div>
    </div>
  );
}

export default SubmitReport;
