import { useState } from "react";
import "./App.css";
import StationMap from "./components/StationMap";
import Navbar from "./components/Navbar";
import SubmitReport from "./components/SubmitReport";
import ViewReports from "./components/ViewReports";
import Login from "./components/Login";
import Alerts from "./components/Alerts";
import Collaborations from "./components/Collaborations";
import Analytics from "./components/Analytics";
import PredictiveAlerts from "./components/PredictiveAlerts";
import Dashboard from "./components/Dashboard";
import NgoProjects from "./components/NgoProjects";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );
  const [page, setPage] = useState("dashboard");
  const [reportAlertId, setReportAlertId] = useState(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const handleReportAlert = (alertId) => {
    setReportAlertId(alertId);
    setPage("report");
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <Navbar
        activePage={page}
        onNavigate={(p) => { setPage(p); setReportAlertId(null); }}
        onLogout={handleLogout}
      />
      <main className="page-content" key={page}>
        {page === "dashboard" && <Dashboard />}
        {page === "map" && <StationMap />}
        {page === "report" && <SubmitReport alertId={reportAlertId} onDone={() => { setReportAlertId(null); setPage("dashboard"); }} />}
        {page === "view" && <ViewReports filterType="pending" />}
        {page === "all_reports" && <ViewReports filterType="verified-rejected" />}
        {page === "alerts" && <Alerts onReportAlert={handleReportAlert} />}
        {page === "collaborations" && <Collaborations />}
        {page === "analytics" && <Analytics />}
        {page === "predictive" && <PredictiveAlerts />}
        {page === "ngo_projects" && <NgoProjects />}
      </main>
    </div>
  );
}

export default App;
