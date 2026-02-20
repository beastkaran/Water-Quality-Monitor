import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API = "http://localhost:8000";

function StationMap() {
  const [stations, setStations] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/stations/`).then((res) => res.json()).then((data) => setStations(data)).catch((err) => console.error("Failed to load stations", err));
    if (token) {
      fetch(`${API}/reports/`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()).then((data) => setReports(data.filter((r) => r.latitude && r.longitude))).catch((err) => console.error("Failed to load reports", err));
    }
  }, []);

  return (
    <div className="page-container">
      <h2 className="page-header">Real-time Station Map</h2>
      <div className="glass-card" style={{ padding: "4px" }}>
        <div style={{ height: "500px", borderRadius: "3px", overflow: "hidden" }}>
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
            {stations.map((station) => (
              <Marker key={`station-${station.id}`} position={[station.latitude, station.longitude]}>
                <Popup><strong>{station.name}</strong><br />Location: {station.location}</Popup>
              </Marker>
            ))}
            {reports.map((report) => (
              <Marker key={`report-${report.id}`} position={[parseFloat(report.latitude), parseFloat(report.longitude)]}>
                <Popup><strong>Report: {report.location}</strong><br />Description: {report.description}<br />Water Source: {report.water_source}<br />Status: {report.status}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default StationMap;
