import { useEffect, useState } from "react";

const API = "http://localhost:8000";

function Analytics() {
  const [stations, setStations] = useState([]);
  const [readings, setReadings] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedParameter, setSelectedParameter] = useState("pH");
  const [dateRange, setDateRange] = useState("7days");
  const token = localStorage.getItem("token");

  useEffect(() => { fetchStations(); }, []);
  useEffect(() => { if (selectedStation) fetchReadings(selectedStation); }, [selectedStation]);

  const fetchStations = async () => {
    try {
      const res = await fetch(`${API}/stations/`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setStations(data);
      if (data.length > 0) setSelectedStation(data[0].id);
    } catch (err) { console.error("Failed to fetch stations", err); }
  };

  const fetchReadings = async (stationId) => {
    try {
      const res = await fetch(`${API}/stations/${stationId}/readings`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setReadings(data);
    } catch (err) { console.error("Failed to fetch readings", err); }
  };

  const getFilteredReadings = () => {
    const now = new Date(); let startDate = new Date();
    switch (dateRange) { case "7days": startDate.setDate(now.getDate() - 7); break; case "30days": startDate.setDate(now.getDate() - 30); break; case "90days": startDate.setDate(now.getDate() - 90); break; }
    return readings.filter((r) => new Date(r.recorded_at) >= startDate && r.parameter === selectedParameter).sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  };

  const calculateStats = () => {
    const filtered = getFilteredReadings();
    if (filtered.length === 0) return { min: 0, max: 0, avg: 0 };
    const values = filtered.map((r) => parseFloat(r.value));
    return { min: Math.min(...values).toFixed(2), max: Math.max(...values).toFixed(2), avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) };
  };

  const THRESHOLDS = { pH: 8.5, DO: 4.0, turbidity: 10.0, lead: 0.015, arsenic: 0.01 };
  const filteredReadings = getFilteredReadings();
  const stats = calculateStats();
  const chartHeight = Math.max(...filteredReadings.map((r) => parseFloat(r.value)), THRESHOLDS[selectedParameter] || 0, 10);
  const thresholdValue = THRESHOLDS[selectedParameter];

  const sel = { padding: "6px 8px", border: "1px solid #cccccc", borderRadius: "3px", fontSize: "13px", background: "white" };

  return (
    <div className="page-container">
      <h2 className="page-header">Water Quality Analytics</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        <select value={selectedStation || ""} onChange={(e) => setSelectedStation(parseInt(e.target.value))} style={sel}>
          {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={selectedParameter} onChange={(e) => setSelectedParameter(e.target.value)} style={sel}>
          <option value="pH">pH</option>
          <option value="DO">Dissolved Oxygen</option>
          <option value="turbidity">Turbidity</option>
          <option value="lead">Lead</option>
          <option value="arsenic">Arsenic</option>
        </select>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={sel}>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "14px" }}>
        {[{ label: "Minimum", value: stats.min }, { label: "Maximum", value: stats.max }, { label: "Average", value: stats.avg }, { label: "Data Points", value: filteredReadings.length }].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#222", margin: "4px 0" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ marginBottom: "14px" }}>
        <h3 style={{ marginBottom: "12px" }}>Trend Chart — {selectedParameter}</h3>
        {filteredReadings.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", padding: "30px 0" }}>No data available for selected period</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <svg width="100%" height="300" style={{ minWidth: "600px" }}>
              {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => (
                <line key={`grid-${i}`} x1="50" y1={300 - percent * 250} x2="100%" y2={300 - percent * 250} stroke="#eeeeee" strokeDasharray="4,4" />
              ))}
              {thresholdValue != null && (
                <>
                  <line x1="50" y1={50 + (1 - thresholdValue / chartHeight) * 250} x2="100%" y2={50 + (1 - thresholdValue / chartHeight) * 250} stroke="#cc2222" strokeWidth="1.5" strokeDasharray="6,4" />
                  <text x="55" y={50 + (1 - thresholdValue / chartHeight) * 250 - 5} fill="#cc2222" fontSize="11" fontFamily="Arial">Threshold: {thresholdValue}</text>
                </>
              )}
              <polyline
                points={filteredReadings.map((r, i) => {
                  const x = 50 + (i / (filteredReadings.length - 1)) * (Math.max(0, document.body.offsetWidth - 150));
                  const y = 50 + (1 - parseFloat(r.value) / chartHeight) * 250;
                  return `${x},${y}`;
                }).join(" ")}
                fill="none" stroke="#2255cc" strokeWidth="2"
              />
              {filteredReadings.map((r, i) => {
                const x = 50 + (i / (filteredReadings.length - 1)) * (Math.max(0, document.body.offsetWidth - 150));
                const y = 50 + (1 - parseFloat(r.value) / chartHeight) * 250;
                return <circle key={`pt-${i}`} cx={x} cy={y} r="3" fill="#2255cc" stroke="white" strokeWidth="1.5" />;
              })}
            </svg>
          </div>
        )}
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: "10px" }}>Reading History</h3>
        <div style={{ maxHeight: "360px", overflowY: "auto" }}>
          {filteredReadings.length === 0 ? (
            <p style={{ color: "#666" }}>No readings available</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #cccccc" }}>
                  <th style={{ textAlign: "left", padding: "8px", color: "#444" }}>Date & Time</th>
                  <th style={{ textAlign: "left", padding: "8px", color: "#444" }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredReadings.slice(-20).reverse().map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eeeeee", background: i % 2 === 0 ? "#fafafa" : "white" }}>
                    <td style={{ padding: "7px 8px", color: "#555" }}>{new Date(r.recorded_at).toLocaleString()}</td>
                    <td style={{ padding: "7px 8px", fontWeight: "bold" }}>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
