import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { AlertTriangle, Users } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FLASK_SOS_URL, PHP_API_URL } from "../api/config";

const socket = io(FLASK_SOS_URL, {
  transports: ["websocket", "polling"],
});

const generateEmergencyMessage = (username, latitude, longitude, activeContacts) => {
  return `
🚨 Emergency Status:
EMERGENCY! I need immediate help. This is my current location.

📍 My Location:
Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}
(Open in Google Maps: https://www.google.com/maps?q=${latitude},${longitude})

🧑‍🤝‍🧑 Emergency Contacts:
${activeContacts.length > 0 ? activeContacts.join(", ") : "No active contacts available."}
`;
};

const SOS = () => {
  const [username, setUsername] = useState("");
  const [coords, setCoords] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [activeContacts, setActiveContacts] = useState([]);
  const alertSound = useRef(null);
  const hasFetched = useRef(false);

  // Fetch user info and location on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchUserAndLocation = async () => {
      try {
        const res = await axios.get(`${PHP_API_URL}/get_userSOS.php`, {
          withCredentials: true,
        });
        if (res.data.success && res.data.username) {
          setUsername(res.data.username);
          localStorage.setItem("username", res.data.username);
        } else {
          toast.warn("⚠️ Unable to fetch user info. Please log in again.");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        toast.error("Failed to get user info from server.");
      }

      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setCoords([latitude, longitude]);
            toast.success("📍 Location auto-detected successfully!", {
              autoClose: 3000,
              pauseOnHover: false,
              hideProgressBar: true,
              position: "top-center",
            });
          },
          () => {
            toast.warn("⚠️ Unable to auto-detect location. Please click 'Get'.");
          }
        );
      } else {
        toast.error("Geolocation not supported by your browser.");
      }
    };

    fetchUserAndLocation();
  }, []);

  // Real-time username listener
  useEffect(() => {
    const handleRealtimeUserUpdate = (event) => {
      const { username: updatedUsername } = event.detail || {};
      if (updatedUsername) {
        setUsername(updatedUsername);
        localStorage.setItem("username", updatedUsername);
        toast.info(`👤 Username updated to "${updatedUsername}"`, {
          autoClose: 2500,
          position: "bottom-center",
        });
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === "username") {
        setUsername(event.newValue || "");
      }
    };

    window.addEventListener("userUpdated", handleRealtimeUserUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("userUpdated", handleRealtimeUserUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Listen for SOS alerts in real time (sound only — no popup)
  useEffect(() => {
    socket.on("sos_alert", (data) => {
      alertSound.current?.play().catch(() => {});
      toast.warn(`🚨 ${data.username} triggered an SOS!`, {
        position: "top-center",
        autoClose: 5000,
      });
    });
    return () => socket.off("sos_alert");
  }, []);

  const fetchActiveContacts = async () => {
    try {
      const res = await axios.get(`${PHP_API_URL}/active_users.php`);
      if (res.data.success && Array.isArray(res.data.users)) {
        const contacts = res.data.users.map((u) => u.username);
        setActiveContacts(contacts);
        return contacts;
      }
    } catch (err) {
      console.error("Error fetching active contacts:", err);
    }
    setActiveContacts([]);
    return [];
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords([latitude, longitude]);
        toast.success("📍 Location detected successfully!");
      },
      () => {
        toast.error("Failed to get location. Please enable GPS access.");
      }
    );
  };

  const triggerSOS = async () => {
    if (!username) return toast.warn("User not recognized. Please log in again.");
    if (!coords) return toast.warn("Please get your location first!");

    const allContacts = (await fetchActiveContacts()) || [];
    const filteredContacts = allContacts.filter(
      (contact) => contact.toLowerCase() !== username.toLowerCase()
    );

    const [lat, lng] = coords;
    const emergencyMessage = generateEmergencyMessage(username, lat, lng, filteredContacts);

    const payload = {
      username,
      location: `${lat}, ${lng}`,
      message: emergencyMessage,
      activeContacts: filteredContacts,
    };

    setIsSending(true);
    try {
      const res = await axios.post(`${FLASK_SOS_URL}/trigger_sos`, payload);
      if (res.data.success) {
        toast.success(`🚨 SOS sent to ${filteredContacts.length} contact(s)!`);
      } else {
        toast.error("⚠️ Failed to send SOS. Server did not confirm success.");
      }
    } catch {
      toast.error("❌ Failed to send SOS. Check your SOS server connection (port 5002).");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", color: "#2f2f2f" }}>
      {/* Header Section */}
      <header
        style={{
          background: "linear-gradient(to bottom, #d7dbd0, #e8eae5)",
          padding: "30px 5vw 20px 5vw",
          borderBottom: "2px solid #ddd",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#2c2c2c",
            marginBottom: "6px",
          }}
        >
          SOS Emergency Center
        </h1>
        <p style={{ fontSize: "1rem", color: "#555", marginBottom: "15px" }}>
          Stay safe. Trigger alerts and notify all active contacts instantly.
        </p>
      </header>

      {/* Main Section */}
      <main style={{ padding: "25px 5vw" }}>
        <section
          style={{
            backgroundColor: "#f5f6f5",
            borderRadius: "16px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
            padding: "25px",
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: "600",
              marginBottom: "20px",
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangle size={24} /> SOS Alert Form
          </h2>

          {/* Input Fields */}
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="👤 Your Name"
              value={username || ""}
              readOnly
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                marginBottom: "12px",
                color: "#333",
                backgroundColor: "#f1f1f1",
              }}
            />

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <input
                type="text"
                placeholder={
                  coords
                    ? `📍 Lat: ${coords[0].toFixed(4)}, Lng: ${coords[1].toFixed(4)}`
                    : "📍 Your Location"
                }
                disabled
                style={{
                  flex: "1 1 200px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f8f8f8",
                  color: "#444",
                }}
              />
              <button
                onClick={getLocation}
                style={{
                  backgroundColor: "#4e6f3c",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Get
              </button>
            </div>
          </div>

          {/* SOS Button */}
          <button
            onClick={triggerSOS}
            disabled={isSending}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "1.1rem",
              fontWeight: "600",
              borderRadius: "10px",
              border: "none",
              cursor: isSending ? "not-allowed" : "pointer",
              backgroundColor: isSending ? "#888" : "#b22222",
              color: "#fff",
              transition: "all 0.2s ease",
            }}
          >
            {isSending ? "Sending SOS..." : "🚨 Trigger SOS"}
          </button>

          {/* Active Contacts Info */}
          <div
            style={{
              marginTop: "25px",
              textAlign: "center",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "10px",
              padding: "10px",
              fontSize: "0.95rem",
            }}
          >
            <Users size={18} style={{ verticalAlign: "middle" }} />{" "}
            {activeContacts.filter((c) => c.toLowerCase() !== username.toLowerCase()).length > 0 ? (
              <>
                <strong>
                  {
                    activeContacts.filter(
                      (c) => c.toLowerCase() !== username.toLowerCase()
                    ).length
                  }
                </strong>{" "}
                active contact(s) will be notified.
              </>
            ) : (
              <span>No active contacts available.</span>
            )}
          </div>
        </section>
      </main>

      {/* Removed SOS popup alerts */}

      <audio
        ref={alertSound}
        src="https://assets.mixkit.co/sfx/preview/mixkit-alert-quick-chime-766.mp3"
        preload="auto"
      />

      <ToastContainer position="top-center" autoClose={false} closeOnClick pauseOnHover />

      <style>
        {`
        @media (max-width: 768px) {
          header h1 { font-size: 1.6rem; }
          header p { font-size: 0.9rem; }
        }
        @media (max-width: 480px) {
          header { padding: 20px 5vw; }
          header h1 { font-size: 1.4rem; }
          section { padding: 20px; }
          button { font-size: 0.95rem; }
        }
        `}
      </style>
    </div>
  );
};

export default SOS;
