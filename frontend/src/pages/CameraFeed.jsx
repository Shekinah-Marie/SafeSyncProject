import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";

const CameraFeed = () => {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [serverError, setServerError] = useState(null);
  const videoRef = useRef(null);

  const API_URL = "http://localhost:5000/devices";
  const LOGS_URL = "http://localhost/cctv_system/backend/get_face_logs.php";

  // --- Fetch with retry ---
  const fetchWithRetry = async (url, retries = 3, delay = 1500) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Bad response");
        return await res.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
      }
    }
  };

  // --- Fetch device info ---
  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const devices = await fetchWithRetry(API_URL, 5);
        const found = devices.find((d) => d.id === parseInt(id));
        if (!found) throw new Error("Device not found");
        setDevice(found);
        setServerError(null);
      } catch (err) {
        console.error("Failed to fetch device:", err);
        setServerError("Flask server is offline or unreachable.");
      } finally {
        setLoading(false);
      }
    };
    fetchDevice();
  }, [id]);

  // --- Poll live logs ---
  useEffect(() => {
    if (!device) return;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`${LOGS_URL}?device_id=${device.id}&limit=10`);
        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.logs)) {
          setLogs(data.logs);
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // every 3s
    return () => clearInterval(interval);
  }, [device]);

  // --- Snapshot capture ---
  const handleCapture = () => {
    try {
      const img = videoRef.current;
      if (!img || !img.complete) {
        alert("Camera feed not ready yet.");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = dataUrl;
      link.download = `camera_snapshot_${timestamp}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("Snapshot saved!");
    } catch (err) {
      console.error("Capture failed:", err);
      alert("Failed to capture snapshot");
    }
  };

  const toggleCamera = () => setIsCameraOn((prev) => !prev);

  if (loading)
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;

  if (!device)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>Device not found.</h3>
        <Link to="/home" style={linkStyle}>← Back to Home</Link>
      </div>
    );

  const cameraFeedUrl = `http://localhost:5000/video_feed/${device.id}`;

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>🎥 {device.name}</h1>
        <p style={subTitleStyle}>Location: {device.location} — {device.device_type} Camera</p>
        <Link to="/home" style={linkStyle}>← Back to Dashboard</Link>
      </header>

      {serverError && (
        <div style={{ padding: "15px", backgroundColor: "#ffdede", color: "#a00", borderRadius: "6px", margin: "20px 5vw" }}>
           {serverError}
        </div>
      )}

      <main style={mainStyle}>
        <div style={cameraBox}>
          {isCameraOn ? (
            <img
              ref={videoRef}
              src={cameraFeedUrl}
              alt="Camera Stream"
              style={cameraImage}
              onError={(e) => {
                e.target.src = "";
                e.target.alt = "Unable to load camera feed.";
              }}
            />
          ) : (
            <div style={cameraOffBox}>🚫 Camera is turned off</div>
          )}

          <div style={buttonGroup}>
            <button onClick={toggleCamera} style={btnPrimary}>
              {isCameraOn ? "🛑 Turn Off Camera" : "🎬 Turn On Camera"}
            </button>
            <button onClick={handleCapture} style={btnSecondary}>📸 Capture Snapshot</button>
          </div>
        </div>

        <div style={logsBox}>
          <h3 style={logsTitle}>Live Face Logs</h3>
          {logs.length === 0 ? (
            <p style={{ color: "#777", textAlign: "center" }}>No recent detections.</p>
          ) : (
            <table style={logsTable}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Confidence</th>
                  <th style={thStyle}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.timestamp + i}
                    style={{
                      ...rowStyle,
                      backgroundColor: i === 0 ? "#e6f8e7" : "transparent" // highlight most recent
                    }}
                  >
                    <td style={cellStyle}>{log.name}</td>
                    <td style={cellStyle}>{log.confidence?.toFixed(1) || "--"}%</td>
                    <td style={cellStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

// --- Styles (kept from your current file) ---
const pageStyle = { fontFamily: "'Poppins', sans-serif", color: "#2f2f2f" };
const headerStyle = { background: "linear-gradient(to bottom, #e8eae5, #f5f5f5)", padding: "30px 5vw 20px 5vw", borderBottom: "2px solid #ddd" };
const titleStyle = { fontSize: "2rem", fontWeight: "700", color: "#2c2c2c" };
const subTitleStyle = { fontSize: "1rem", color: "#555" };
const linkStyle = { backgroundColor: "#5c7c47", color: "#fff", padding: "8px 14px", borderRadius: "6px", textDecoration: "none", fontWeight: "500" };
const mainStyle = { padding: "25px 5vw", display: "flex", flexDirection: "column", alignItems: "center", gap: "25px" };
const cameraBox = { backgroundColor: "#f7f7f7", borderRadius: "16px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", padding: "20px", textAlign: "center", width: "100%", maxWidth: "600px" };
const cameraImage = { width: "100%", maxWidth: "600px", borderRadius: "12px", border: "3px solid #5c7c47" };
const cameraOffBox = { width: "100%", height: "300px", display: "flex", justifyContent: "center", alignItems: "center", background: "#efefef", borderRadius: "12px", color: "#666", fontWeight: "500" };
const buttonGroup = { display: "flex", justifyContent: "center", gap: "15px", marginTop: "15px" };
const btnPrimary = { background: "#5c7c47", color: "#fff", padding: "10px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" };
const btnSecondary = { background: "#e6e6e6", color: "#333", padding: "10px 16px", borderRadius: "8px", border: "1px solid #aaa", cursor: "pointer", fontWeight: "600" };
const logsBox = { backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: "20px", width: "100%", maxWidth: "700px", overflowX: "auto" };
const logsTitle = { color: "#2c2c2c", marginBottom: "14px", fontWeight: "600", fontSize: "1.2rem" };
const logsTable = { width: "100%", borderCollapse: "collapse" };
const thStyle = { background: "#5c7c47", color: "#fff", padding: "10px", textAlign: "center", fontSize: "0.95rem", borderRadius: "8px 8px 0 0" };
const rowStyle = { textAlign: "center", borderBottom: "1px solid #ddd" };
const cellStyle = { padding: "10px", fontSize: "0.9rem" };

export default CameraFeed;
