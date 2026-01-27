import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import api from "../api/axios";

interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  location: string;
}

const Dashboard = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await api.get("/stations");
        setStations(res.data);
      } catch (err) {
        console.error("Failed to load stations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-blue-700">Total Stations</h3>
            <p className="text-3xl font-bold">{stations.length}</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-green-700">Reports</h3>
            <p className="text-3xl font-bold">--</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-red-600">Alerts</h3>
            <p className="text-3xl font-bold">--</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-4">Water Stations Map</h3>

          {loading ? (
            <p>Loading map...</p>
          ) : (
            <MapView stations={stations} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
