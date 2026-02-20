import { useEffect, useState } from "react";

const API = "http://localhost:8000";

function ViewReports({ filterType = "pending" }) {
  const [reports, setReports] = useState([]);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchReports = async () => {
    const res = await fetch(`${API}/reports/`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setReports(data);
  };

  useEffect(() => { fetchReports(); }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/reports/${id}/status?status=${status}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to update status");
      fetchReports();
    } catch (err) { alert(err.message); }
  };

  const statusColor = { pending: "#cc8800", verified: "#228822", rejected: "#cc2222" };

  const filteredReports = reports.filter((r) => {
    if (filterType === "verified-rejected") return r.status === "verified" || r.status === "rejected";
    if (filterType === "pending") return user?.role === "authority" ? r.status === "pending" : true;
    return true;
  });

  return (
    <div className="page-container">
      <h2 className="page-header">
        {filterType === "pending"
          ? (user?.role === "authority" ? "Pending Reports for Verification" : "My Submitted Reports")
          : "All Verified & Rejected Reports"}
      </h2>

      {filteredReports.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "30px" }}>
          <p style={{ color: "#666", fontSize: "13px" }}>No reports found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {filteredReports.map((report) => (
            <div key={report.id} className="glass-card" style={{ borderLeft: `4px solid ${statusColor[report.status] || "#2255cc"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "6px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: 0 }}>{report.location}</h3>
                <span style={{ background: statusColor[report.status], color: "#fff", padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: "bold" }}>
                  {report.status?.toUpperCase()}
                </span>
              </div>
              <p style={{ color: "#555", fontSize: "13px", marginBottom: "6px" }}>{report.description}</p>
              <p style={{ color: "#666", fontSize: "12px", margin: "3px 0" }}>Water Source: {report.water_source}</p>
              {report.created_at && <p style={{ color: "#999", fontSize: "11px", margin: "3px 0" }}>{new Date(report.created_at).toLocaleString()}</p>}
              {user?.role === "authority" && filterType === "pending" && report.status === "pending" && (
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button onClick={() => updateStatus(report.id, "verified")} style={{ fontSize: "12px", padding: "5px 12px" }}>Verify</button>
                  <button onClick={() => updateStatus(report.id, "rejected")} className="btn-danger" style={{ fontSize: "12px", padding: "5px 12px" }}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewReports;
