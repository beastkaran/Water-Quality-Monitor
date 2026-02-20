import React, { useState, useEffect } from 'react';

const PredictiveAlerts = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lookbackDays, setLookbackDays] = useState(7);
  const [autoAnalysis, setAutoAnalysis] = useState(false);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { fetchStations(); }, []);

  const fetchStations = async () => {
    try {
      const response = await fetch('http://localhost:8000/stations/', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      setStations(data);
      if (data.length > 0) setSelectedStation(data[0].id);
    } catch (error) { console.error('Error fetching stations:', error); }
  };

  const analyzePredictions = async () => {
    if (!selectedStation) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/predict/analyze/${selectedStation}?lookback_days=${lookbackDays}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      setPredictions(data.predicted_alerts);
    } catch (error) { console.error('Error analyzing predictions:', error); }
    finally { setLoading(false); }
  };

  const getTrendAnalysis = async () => {
    if (!selectedStation) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/predict/trends/${selectedStation}?lookback_days=${lookbackDays}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      setTrends(data); setPredictions(data.predictions);
    } catch (error) { console.error('Error fetching trends:', error); }
    finally { setLoading(false); }
  };

  const runAutoAnalysis = async () => {
    if (user?.role !== 'authority') { alert('Only authorities can run auto-prediction analysis'); return; }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/predict/auto-predict', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      const data = await response.json();
      alert(`Analysis complete! Created ${data.alerts_created} alerts from ${data.stations_analyzed} stations.`);
      setAutoAnalysis(true); setTimeout(() => setAutoAnalysis(false), 3000);
    } catch (error) { alert('Error running auto-prediction analysis'); }
    finally { setLoading(false); }
  };

  const getSeverityColor = (severity) => ({ 'critical': '#880000', 'high': '#cc2222', 'medium': '#cc8800', 'low': '#228822' }[severity] || '#666');

  const sel = { padding: '6px 8px', border: '1px solid #cccccc', borderRadius: '3px', fontSize: '13px', background: 'white', width: '100%' };

  return (
    <div className="page-container">
      <h2 className="page-header">Predictive Alerts</h2>
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '14px' }}>AI-powered water quality trend analysis and predictions</p>

      <div className="glass-card" style={{ marginBottom: '14px' }}>
        <h3 style={{ marginBottom: '12px' }}>Analysis Settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Select Station</label>
            <select value={selectedStation || ''} onChange={(e) => setSelectedStation(Number(e.target.value))} style={sel}>
              <option value="">Choose a station...</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Look-back Period</label>
            <select value={lookbackDays} onChange={(e) => setLookbackDays(Number(e.target.value))} style={sel}>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={analyzePredictions} disabled={!selectedStation || loading} style={{ width: '100%' }}>
              {loading ? 'Analyzing...' : 'Analyze Trends'}
            </button>
          </div>
        </div>

        {user?.role === 'authority' && (
          <div style={{ borderTop: '1px solid #cccccc', paddingTop: '12px' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '13px' }}>Authority Actions</h3>
            <button onClick={runAutoAnalysis} disabled={loading} className="btn-secondary">
              {autoAnalysis ? 'Analysis Completed' : 'Run Auto-Prediction for All Stations'}
            </button>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>Analyzes all stations and automatically creates alerts for critical predictions.</p>
          </div>
        )}
      </div>

      {trends && (
        <div className="glass-card" style={{ marginBottom: '14px' }}>
          <h3 style={{ marginBottom: '10px' }}>Water Quality Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {Object.entries(trends.statistics).map(([param, stats]) => (
              <div key={param} className="stat-card">
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2255cc' }}>{stats.avg.toFixed(2)}</div>
                <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginTop: '4px' }}>{param.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>{stats.min.toFixed(2)} – {stats.max.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: '14px' }}>
        <h3 style={{ marginBottom: '10px' }}>Predicted Alerts</h3>
        {loading && <p style={{ color: '#666', fontSize: '13px' }}>Analyzing water quality data...</p>}

        {!loading && predictions.length === 0 && (
          <p style={{ color: '#228822', fontSize: '13px', padding: '14px 0' }}>No concerning trends detected. Water quality appears normal.</p>
        )}

        {!loading && predictions.length > 0 && (
          <div>
            <div style={{ display: 'flex', gap: '14px', marginBottom: '12px', fontSize: '12px' }}>
              <span style={{ color: '#880000', fontWeight: 'bold' }}>Critical: {predictions.filter(p => p.severity === 'critical').length}</span>
              <span style={{ color: '#cc2222', fontWeight: 'bold' }}>High: {predictions.filter(p => p.severity === 'high').length}</span>
              <span style={{ color: '#cc8800', fontWeight: 'bold' }}>Medium: {predictions.filter(p => p.severity === 'medium').length}</span>
            </div>
            {predictions.map((prediction, idx) => (
              <div key={idx} style={{ border: `1px solid ${getSeverityColor(prediction.severity)}`, borderLeft: `4px solid ${getSeverityColor(prediction.severity)}`, borderRadius: '3px', padding: '12px', marginBottom: '8px', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ background: getSeverityColor(prediction.severity), color: 'white', padding: '1px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold' }}>{prediction.severity?.toUpperCase()}</span>
                  <strong style={{ fontSize: '13px' }}>{prediction.parameter.replace(/_/g, ' ').toUpperCase()}</strong>
                </div>
                <p style={{ margin: '4px 0', color: '#444', fontSize: '13px' }}>{prediction.message}</p>
                <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  <span>Current: <strong>{prediction.recent_value.toFixed(3)}</strong></span>
                  <span>Trend: <strong>{prediction.trend}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {trends && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          <div className="stat-card" style={{ borderTop: '3px solid #cc2222' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#cc2222' }}>{trends.critical_alerts}</div>
            <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginTop: '4px' }}>Critical Alerts</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #cc8800' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#cc8800' }}>{trends.warning_alerts}</div>
            <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginTop: '4px' }}>Warning Alerts</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #2255cc' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2255cc' }}>{trends.analysis_period_days}</div>
            <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginTop: '4px' }}>Days Analyzed</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveAlerts;
