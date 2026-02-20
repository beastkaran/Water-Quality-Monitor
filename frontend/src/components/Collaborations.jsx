import { useEffect, useState } from "react";

const API = "http://localhost:8000";

function Collaborations() {
  const [collaborations, setCollaborations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ngo_name: "", project_name: "", contact_email: "", phone: "", location: "", description: "", website: "" });
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchCollaborations = async () => {
    try {
      const res = await fetch(`${API}/collaborations/`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCollaborations(data);
    } catch (err) { console.error("Failed to fetch collaborations", err); }
  };

  useEffect(() => { fetchCollaborations(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API}/collaborations/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      if (res.ok) {
        fetchCollaborations(); setShowForm(false);
        setForm({ ngo_name: "", project_name: "", contact_email: "", phone: "", location: "", description: "", website: "" });
        alert("Collaboration added successfully!");
      }
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const deleteCollaboration = async (id) => {
    if (window.confirm("Are you sure you want to delete this collaboration?")) {
      try {
        const res = await fetch(`${API}/collaborations/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) fetchCollaborations();
      } catch (err) { alert(err.message); }
    }
  };

  const inp = { width: "100%", padding: "6px 8px", margin: "4px 0 10px 0", border: "1px solid #cccccc", borderRadius: "3px", fontSize: "13px", boxSizing: "border-box" };
  const lbl = { display: "block", fontWeight: "bold", fontSize: "12px", color: "#444" };

  return (
    <div className="page-container">
      <h2 className="page-header">NGO Collaborations</h2>

      {user?.role === "authority" && (
        <button onClick={() => setShowForm(!showForm)} style={{ marginBottom: "12px" }}>{showForm ? "Cancel" : "Add Collaboration"}</button>
      )}

      {showForm && user?.role === "authority" && (
        <form onSubmit={handleSubmit} className="glass-card" style={{ maxWidth: "560px", marginBottom: "16px" }}>
          <h3 style={{ marginBottom: "12px" }}>New Collaboration</h3>
          <label style={lbl}>NGO Name *</label>
          <input name="ngo_name" placeholder="NGO Name" value={form.ngo_name} onChange={handleChange} style={inp} required />
          <label style={lbl}>Project Name *</label>
          <input name="project_name" placeholder="Project Name" value={form.project_name} onChange={handleChange} style={inp} required />
          <label style={lbl}>Contact Email *</label>
          <input name="contact_email" type="email" placeholder="Contact Email" value={form.contact_email} onChange={handleChange} style={inp} required />
          <label style={lbl}>Phone</label>
          <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} style={inp} />
          <label style={lbl}>Location *</label>
          <input name="location" placeholder="Location" value={form.location} onChange={handleChange} style={inp} required />
          <label style={lbl}>Description</label>
          <textarea name="description" placeholder="Project Description" value={form.description} onChange={handleChange} style={{ ...inp, minHeight: "80px", resize: "vertical" }} />
          <label style={lbl}>Website</label>
          <input name="website" placeholder="Website (Optional)" value={form.website} onChange={handleChange} style={inp} />
          <button type="submit" style={{ width: "100%", marginTop: "4px" }} disabled={loading}>{loading ? "Creating..." : "Create Collaboration"}</button>
        </form>
      )}

      {collaborations.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "30px" }}>
          <p style={{ color: "#666" }}>No collaborations yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {collaborations.map((collab) => (
            <div key={collab.id} className="glass-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                <div>
                  <h3 style={{ marginBottom: "2px" }}>{collab.ngo_name}</h3>
                  <p style={{ color: "#2255cc", fontSize: "13px", margin: "0" }}>{collab.project_name}</p>
                </div>
                {user?.role === "authority" && (
                  <button onClick={() => deleteCollaboration(collab.id)} className="btn-danger" style={{ fontSize: "12px", padding: "4px 10px" }}>Delete</button>
                )}
              </div>
              <p style={{ color: "#555", fontSize: "13px", marginBottom: "10px" }}>{collab.description}</p>
              <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.9" }}>
                <div>Location: {collab.location}</div>
                <div>Email: {collab.contact_email}</div>
                {collab.phone && <div>Phone: {collab.phone}</div>}
                {collab.website && <div>Website: <a href={collab.website} target="_blank" rel="noopener noreferrer">{collab.website}</a></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Collaborations;
