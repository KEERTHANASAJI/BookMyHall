import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Report.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, CartesianGrid
} from "recharts";

const Reports = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/bookings");
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
        setFiltered(data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const total = filtered.length;
  const approved = filtered.filter(b => b.status === "approved").length;
  const pending = filtered.filter(b => b.status === "pending").length;
  const rejected = filtered.filter(b => b.status === "rejected").length;

  const statusData = [
    { name: "Approved", value: approved, color: "#86efac" },
    { name: "Pending", value: pending, color: "#fde047" },
    { name: "Rejected", value: rejected, color: "#fca5a5" }
  ].filter(item => item.value > 0);

  // ✅ FIXED: Only count APPROVED bookings for hall usage
  const hallCount = {};
  filtered
    .filter(b => b.status === "approved") // Only count approved bookings
    .forEach((b) => {
      const hall = b.preferredHall || "Unknown";
      hallCount[hall] = (hallCount[hall] || 0) + 1;
    });

  const hallData = Object.keys(hallCount)
    .map((hall) => ({
      hall: hall,
      count: hallCount[hall],
      percentage: approved > 0 ? ((hallCount[hall] / approved) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="reports-page-custom-tooltip">
          <p style={{ marginBottom: "5px" }}>🏛️ <strong>{data.hall}</strong></p>
          <p className="count">✅ {data.count} approved bookings</p>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "5px" }}>
            📈 {data.percentage}% of approved bookings
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="reports-page">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTop: "3px solid #818cf8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* Back Button */}
      <button className="reports-page-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1 className="reports-page-title">📊 Reports Overview</h1>

      <div className="reports-page-cards">
        <div className="reports-page-card total"><h2>{total}</h2><p>Total Bookings</p></div>
        <div className="reports-page-card approved"><h2>{approved}</h2><p>Approved ✅</p></div>
        <div className="reports-page-card pending"><h2>{pending}</h2><p>Pending ⏳</p></div>
        <div className="reports-page-card rejected"><h2>{rejected}</h2><p>Rejected ❌</p></div>
      </div>

      <div className="reports-page-charts">
        {/* Status Pie Chart */}
        <div className="reports-page-chart-card">
          <h3><span>📈</span> Status Distribution</h3>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  innerRadius={55}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
                    return (
                      <div className="reports-page-custom-tooltip">
                        <p>{`${data.name}: ${data.value}`}</p>
                        <p style={{ fontSize: "12px", color: "#64748b" }}>{`(${percentage}%)`}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>No data available</div>
          )}
        </div>

        {/* Horizontal Bar Chart - Only Approved Bookings */}
        <div className="reports-page-chart-card">
          <h3><span>🏛️</span> Most Booked Halls (Approved Only)</h3>
          {hallData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(350, hallData.length * 45)}>
              <BarChart 
                data={hallData}
                layout="vertical"
                margin={{ top: 20, right: 40, left: 130, bottom: 20 }}
                barCategoryGap="15%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="hall"
                  width={120}
                  tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.1)" }} />
                <Legend verticalAlign="top" height={36} formatter={() => "Approved Bookings"} />
                <Bar 
                  dataKey="count" 
                  name="Approved Bookings"
                  fill="#4ade80"
                  radius={[0, 8, 8, 0]}
                  animationBegin={300}
                  animationDuration={1200}
                  label={{ 
                    position: 'right', 
                    fill: '#1e293b', 
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  {hallData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
                  ))}
                </Bar>
                <defs>
                  {hallData.map((_, index) => (
                    <linearGradient key={`grad-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#86efac" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  ))}
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
              No approved bookings available
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table - Only Approved Bookings */}
      {hallData.length > 0 && (
        <div className="reports-page-details-table">
          <h3><span>📋</span> Hall Usage Statistics (Approved Bookings Only)</h3>
          <div className="reports-page-table-wrapper">
            <table className="reports-page-table">
              <thead>
                <tr>
                  <th>🏛️ Hall Name</th>
                  <th>✅ Approved Bookings</th>
                  <th>📈 % of Approved</th>
                  <th>📉 Trend</th>
                </tr>
              </thead>
              <tbody>
                {hallData.map((hall, index) => (
                  <tr key={index}>
                    <td className="reports-page-hall-name">{hall.hall}</td>
                    <td><span className="reports-page-count-badge">{hall.count}</span></td>
                    <td>{hall.percentage}%</td>
                    <td style={{ width: "150px" }}>
                      <div className="reports-page-percentage-bar">
                        <div 
                          className="reports-page-percentage-fill" 
                          style={{ 
                            width: `${hall.percentage}%`,
                            background: "linear-gradient(90deg, #86efac, #4ade80)"
                          }} 
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ 
            marginTop: "16px", 
            fontSize: "12px", 
            color: "#64748b", 
            textAlign: "center",
            padding: "8px",
            background: "#f1f5f9",
            borderRadius: "8px"
          }}>
            ✅ Only approved bookings are counted. Rejected and cancelled bookings are excluded.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Reports;