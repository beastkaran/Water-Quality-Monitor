import { useEffect, useState, useRef } from "react";

const API = "http://localhost:8000";

function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");
    const pieAlertRef = useRef(null);
    const pieReportRef = useRef(null);
    const boxPlotRef = useRef(null);

    useEffect(() => { fetchDashboard(); }, []);
    useEffect(() => {
        if (data) { drawAlertPie(); drawReportPie(); drawBoxPlot(); }
    }, [data]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch(`${API}/dashboard-data/`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await res.json();
            setData(d);
        } catch (err) {
            console.error("Dashboard fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    const drawPie = (canvas, counts, labels, colors) => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width, h = canvas.height;
        const pieAreaH = h - 60;
        const cx = w / 2, cy = pieAreaH / 2;
        const r = Math.min(w, pieAreaH) / 2 - 20;
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        ctx.clearRect(0, 0, w, h);
        if (total === 0) { ctx.fillStyle = "#666"; ctx.font = "14px Arial"; ctx.textAlign = "center"; ctx.fillText("No data", cx, cy); return; }
        let startAngle = -Math.PI / 2;
        const keys = Object.keys(counts);
        keys.forEach((key, i) => {
            const slice = (counts[key] / total) * 2 * Math.PI;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, startAngle, startAngle + slice);
            ctx.fillStyle = colors[i % colors.length]; ctx.fill();
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
            if (counts[key] > 0) {
                const mid = startAngle + slice / 2;
                ctx.fillStyle = "#fff"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillText(String(counts[key]), cx + (r * 0.6) * Math.cos(mid), cy + (r * 0.6) * Math.sin(mid));
            }
            startAngle += slice;
        });
        const legendY = pieAreaH + 10;
        const legendItemWidth = w / keys.length;
        keys.forEach((key, i) => {
            const lx = legendItemWidth * i + legendItemWidth / 2;
            ctx.beginPath(); ctx.arc(lx - 40, legendY + 10, 6, 0, Math.PI * 2);
            ctx.fillStyle = colors[i % colors.length]; ctx.fill();
            ctx.fillStyle = "#444"; ctx.font = "12px Arial"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
            ctx.fillText(`${labels[i]}: ${counts[key]}`, lx - 28, legendY + 10);
        });
    };

    const drawAlertPie = () => {
        if (!data?.alert_status_counts) return;
        drawPie(pieAlertRef.current, data.alert_status_counts, ["Active", "Resolved"], ["#cc2222", "#228822"]);
    };

    const drawReportPie = () => {
        if (!data?.report_status_counts) return;
        drawPie(pieReportRef.current, data.report_status_counts, ["Pending", "Verified", "Rejected"], ["#cc8800", "#228822", "#cc2222"]);
    };

    const drawBoxPlot = () => {
        const canvas = boxPlotRef.current;
        if (!canvas || !data?.parameter_stats) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const params = Object.keys(data.parameter_stats);
        if (params.length === 0) return;
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const plotW = w - margin.left - margin.right, plotH = h - margin.top - margin.bottom;
        const barWidth = Math.min(40, plotW / params.length - 20);
        let globalMax = 0;
        params.forEach((p) => { const s = data.parameter_stats[p]; if (s.max > globalMax) globalMax = s.max; });
        globalMax = globalMax * 1.15;
        const colors = ["#2255cc", "#228822", "#cc8800", "#cc2222", "#880088"];
        params.forEach((param, i) => {
            const s = data.parameter_stats[param];
            const cx = margin.left + (i + 0.5) * (plotW / params.length);
            const scale = (v) => margin.top + plotH - (v / globalMax) * plotH;
            const yMin = scale(s.min), yQ1 = scale(s.q1), yMed = scale(s.median), yQ3 = scale(s.q3), yMax = scale(s.max);
            ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx, yMin); ctx.lineTo(cx, yQ1); ctx.moveTo(cx, yQ3); ctx.lineTo(cx, yMax); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - barWidth / 4, yMin); ctx.lineTo(cx + barWidth / 4, yMin); ctx.moveTo(cx - barWidth / 4, yMax); ctx.lineTo(cx + barWidth / 4, yMax); ctx.stroke();
            ctx.fillStyle = colors[i % colors.length] + "33"; ctx.strokeStyle = colors[i % colors.length];
            ctx.fillRect(cx - barWidth / 2, yQ3, barWidth, yQ1 - yQ3); ctx.strokeRect(cx - barWidth / 2, yQ3, barWidth, yQ1 - yQ3);
            ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(cx - barWidth / 2, yMed); ctx.lineTo(cx + barWidth / 2, yMed); ctx.stroke();
            ctx.fillStyle = "#444"; ctx.font = "12px Arial"; ctx.textAlign = "center"; ctx.fillText(param, cx, h - margin.bottom + 20);
        });
        ctx.strokeStyle = "#cccccc"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, margin.top + plotH); ctx.stroke();
        for (let i = 0; i <= 5; i++) {
            const v = (globalMax / 5) * i, y = margin.top + plotH - (v / globalMax) * plotH;
            ctx.fillStyle = "#666"; ctx.font = "11px Arial"; ctx.textAlign = "right"; ctx.fillText(v.toFixed(2), margin.left - 8, y + 4);
            ctx.strokeStyle = "#eeeeee"; ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(w - margin.right, y); ctx.stroke();
        }
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "Arial" }}>Loading Dashboard...</div>;
    if (!data) return <div style={{ padding: "40px", textAlign: "center", color: "#cc2222", fontFamily: "Arial" }}>Failed to load dashboard</div>;

    const severityColor = { low: "#228822", medium: "#cc8800", high: "#cc2222", critical: "#880000" };
    const statusColor = { pending: "#cc8800", verified: "#228822", rejected: "#cc2222" };

    return (
        <div className="page-container">
            <h2 className="page-header">Dashboard</h2>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                {[
                    { label: "Water Stations", value: data.total_stations },
                    { label: "Total Readings", value: data.total_readings },
                    { label: "Avg Readings/Station", value: data.avg_readings_per_station },
                    { label: "Avg Reports/Station", value: data.avg_reports_per_station },
                ].map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase" }}>{stat.label}</div>
                        <div style={{ fontSize: "28px", fontWeight: "bold", color: "#222", margin: "4px 0" }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Pie Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                <div className="glass-card">
                    <h3>Alert Status</h3>
                    <canvas ref={pieAlertRef} width={340} height={280} style={{ width: "100%", maxWidth: "340px", display: "block", margin: "0 auto" }} />
                </div>
                <div className="glass-card">
                    <h3>Report Status</h3>
                    <canvas ref={pieReportRef} width={400} height={280} style={{ width: "100%", maxWidth: "400px", display: "block", margin: "0 auto" }} />
                </div>
            </div>

            {/* Box Plot */}
            <div className="glass-card" style={{ marginBottom: "16px" }}>
                <h3>Parameter Statistics</h3>
                <canvas ref={boxPlotRef} width={700} height={320} style={{ width: "100%", maxWidth: "700px", display: "block", margin: "0 auto" }} />
            </div>

            {/* Latest Alerts & Reports */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "10px" }}>
                <div className="glass-card">
                    <h3 style={{ marginBottom: "10px" }}>Latest Alerts</h3>
                    {data.latest_alerts.length === 0 ? (
                        <p style={{ color: "#666", fontSize: "13px" }}>No alerts yet</p>
                    ) : (
                        data.latest_alerts.map((a) => (
                            <div key={a.id} style={{ padding: "10px", marginBottom: "8px", border: "1px solid #cccccc", borderLeft: `4px solid ${severityColor[a.severity] || "#2255cc"}`, borderRadius: "3px", background: "#fafafa" }}>
                                <div style={{ fontWeight: "bold", fontSize: "13px" }}>{a.location}</div>
                                <div style={{ fontSize: "12px", color: "#555", margin: "4px 0" }}>{a.message}</div>
                                <span style={{ background: severityColor[a.severity], color: "#fff", padding: "1px 6px", borderRadius: "3px", fontSize: "10px", fontWeight: "bold" }}>
                                    {a.severity?.toUpperCase()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
                <div className="glass-card">
                    <h3 style={{ marginBottom: "10px" }}>Latest Reports</h3>
                    {data.latest_reports.length === 0 ? (
                        <p style={{ color: "#666", fontSize: "13px" }}>No reports yet</p>
                    ) : (
                        data.latest_reports.map((r) => (
                            <div key={r.id} style={{ padding: "10px", marginBottom: "8px", border: "1px solid #cccccc", borderLeft: `4px solid ${statusColor[r.status] || "#2255cc"}`, borderRadius: "3px", background: "#fafafa" }}>
                                <div style={{ fontWeight: "bold", fontSize: "13px" }}>{r.location}</div>
                                <div style={{ fontSize: "12px", color: "#555", margin: "4px 0" }}>{r.description?.slice(0, 100)}</div>
                                <span style={{ background: statusColor[r.status], color: "#fff", padding: "1px 6px", borderRadius: "3px", fontSize: "10px", fontWeight: "bold" }}>
                                    {r.status?.toUpperCase()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
