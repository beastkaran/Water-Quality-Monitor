import { useEffect, useState } from "react";

const API = "http://localhost:8000";

function NgoProjects() {
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ project_name: "", contact_email: "", description: "" });
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${API}/ngo-projects/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setProjects(await res.json());
        } catch (err) { console.error("Failed to fetch NGO projects", err); }
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await fetch(`${API}/ngo-projects/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
            if (res.ok) { setShowForm(false); setForm({ project_name: "", contact_email: "", description: "" }); fetchProjects(); alert("Project published successfully!"); }
            else { const d = await res.json(); alert(d.detail || "Failed to publish project"); }
        } catch (err) { alert("Error: " + err.message); }
        finally { setLoading(false); }
    };

    const inp = { width: "100%", padding: "6px 8px", margin: "4px 0 10px 0", border: "1px solid #cccccc", borderRadius: "3px", fontSize: "13px", boxSizing: "border-box" };
    const lbl = { display: "block", fontWeight: "bold", fontSize: "12px", color: "#444" };

    return (
        <div className="page-container">
            <h2 className="page-header">NGO Projects</h2>

            {user?.role === "ngo" && (
                <button onClick={() => setShowForm(!showForm)} style={{ marginBottom: "12px" }}>{showForm ? "Cancel" : "Publish New Project"}</button>
            )}

            {showForm && user?.role === "ngo" && (
                <form onSubmit={handleSubmit} className="glass-card" style={{ maxWidth: "480px", marginBottom: "16px" }}>
                    <h3 style={{ marginBottom: "12px" }}>Publish Project</h3>
                    <label style={lbl}>Project Name *</label>
                    <input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} placeholder="e.g., Clean River Initiative" style={inp} required />
                    <label style={lbl}>Contact Email *</label>
                    <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="e.g., contact@ngo.org" style={inp} required />
                    <label style={lbl}>Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your project..." style={{ ...inp, minHeight: "70px", resize: "vertical" }} />
                    <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "4px" }}>{loading ? "Publishing..." : "Publish Project"}</button>
                </form>
            )}

            {projects.length === 0 ? (
                <div className="glass-card" style={{ textAlign: "center", padding: "30px" }}>
                    <p style={{ color: "#666" }}>No projects published yet</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                    {projects.map((p) => (
                        <div key={p.id} className="glass-card" style={{ borderLeft: "4px solid #2255cc" }}>
                            <h3 style={{ marginBottom: "4px" }}>{p.project_name}</h3>
                            <p style={{ color: "#555", fontSize: "13px", marginBottom: "8px" }}>{p.description || "No description"}</p>
                            <p style={{ color: "#2255cc", fontSize: "12px", margin: "4px 0" }}>{p.contact_email}</p>
                            <p style={{ color: "#999", fontSize: "11px", margin: "4px 0" }}>Published: {new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NgoProjects;
