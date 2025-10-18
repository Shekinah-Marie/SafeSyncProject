import React, { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  Home,
  UserPlus,
  Bell,
  Settings,
  LogOut,
  Users,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Menu,
  X,
  MapPin,
} from "lucide-react";
import { PHP_API_URL, FLASK_SOS_URL } from "../api/config";
import { toast } from "react-toastify"; 
import io from "socket.io-client";

const socket = io(FLASK_SOS_URL, { transports: ["websocket", "polling"] });

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const [username, setUsername] = useState(localStorage.getItem("username") || "User");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || null);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const [sosAlerts, setSosAlerts] = useState([]);
  const alertSound = useRef(null);

  // Listen for SOS alerts in real time
  useEffect(() => {
    const handleSos = (data) => {
      setSosAlerts((prev) => [...prev, { ...data, id: Date.now() + Math.random() }]);
      alertSound.current?.play().catch(() => {});
    };
    socket.on("sos_alert", handleSos);
    return () => socket.off("sos_alert", handleSos);
  }, []);

  const closeAlert = (id) => {
    setSosAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  // Sync username + avatar in real time
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "username") setUsername(event.newValue || "User");
      if (event.key === "avatar") setAvatar(event.newValue || null);
    };
    const handleUserRealtime = (event) => {
      const { username, email, contact } = event.detail || {};
      if (username) {
        setUsername(username);
        localStorage.setItem("username", username);
      }
      if (email) localStorage.setItem("email", email);
      if (contact) localStorage.setItem("contact", contact);
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userUpdated", handleUserRealtime);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleUserRealtime);
    };
  }, []);

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${PHP_API_URL}/get_user.php?id=${userId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data?.username) {
          setUsername(data.username);
          localStorage.setItem("username", data.username);
        }
      } catch (err) {
        console.error("Failed to fetch username:", err);
      }
    };
    fetchUserInfo();
  }, [userId]);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
      else setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch avatar
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${PHP_API_URL}/get_avatar.php?user_id=${userId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.status === "success" && data.avatar_url) {
          const avatarUrl = data.avatar_url.startsWith("http")
            ? data.avatar_url
            : `${PHP_API_URL.replace("/backend", "")}/backend/${data.avatar_url}`;
          setAvatar(avatarUrl);
          localStorage.setItem("avatar", avatarUrl);
        }
      } catch (err) {
        console.error("Failed to fetch avatar:", err);
      }
    };
    if (!avatar && userId) fetchAvatar();
  }, [userId, avatar]);

  // Upload avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("user_id", userId);
    try {
      const response = await fetch(`${PHP_API_URL}/upload_avatar.php`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await response.json();
      if (data.status === "success") {
        const avatarUrl = data.avatar_url.startsWith("http")
          ? data.avatar_url
          : `${PHP_API_URL.replace("/backend", "")}/backend/${data.avatar_url}`;
        setAvatar(avatarUrl);
        localStorage.setItem("avatar", avatarUrl);
        toast.success("Profile picture updated!", { toastId: "avatar-update", autoClose: 1200 });
      } else {
        toast.error(data.message || "Failed to upload avatar", { toastId: "avatar-error" });
      }
    } catch (error) {
      console.error("Avatar upload failed:", error);
      toast.error("Upload failed. Please try again.", { toastId: "avatar-fail" });
    }
  };

  const handleLogout = async () => {
    try {
      if (userId) {
        await fetch(`${PHP_API_URL}/logout.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
          credentials: "include",
        });
      }
      toast.success("Logged out successfully!", {
        toastId: "logout-success",
        position: "top-center",
        autoClose: 1000,
      });
      setTimeout(() => {
        localStorage.clear();
        navigate("/", { replace: true });
      }, 1100);
    } catch (error) {
      toast.error("Logout failed. Please try again.", {
        toastId: "logout-failed",
        position: "top-center",
        autoClose: 2000,
      });
      console.error("Logout error:", error);
    }
  };

  // --- Styles ---
  const sidebarStyle = {
    width: collapsed ? "80px" : "240px",
    height: "100vh",
    background: "linear-gradient(to bottom, #9aa58c, #606d5b)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: collapsed ? "center" : "flex-start",
    padding: collapsed ? "20px 10px" : "20px",
    position: "fixed",
    left: isMobile && !mobileMenuOpen ? "-250px" : "0",
    top: 0,
    transition: "all 0.3s ease",
    boxShadow: "2px 0 6px rgba(0,0,0,0.15)",
    zIndex: 30,
  };

  const toggleBox = {
    position: "fixed",
    left: collapsed ? "79px" : "239px",
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1b0",
    borderRadius: "0 10px 10px 0",
    width: "40px",
    height: "40px",
    display: isMobile ? "none" : "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    cursor: "pointer",
    transition: "left 0.3s ease",
    zIndex: 25,
  };

  const mobileMenuBtn = {
    position: "fixed",
    top: "15px",
    right: "15px",
    zIndex: 40,
    backgroundColor: "#e7ede2",
    borderRadius: "10px",
    width: "40px",
    height: "40px",
    display: isMobile ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", overflowX: "hidden" }}>
      {/* Mobile Hamburger */}
      <div style={mobileMenuBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <X size={22} color="#4a5942" /> : <Menu size={22} color="#4a5942" />}
      </div>

      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 20,
          }}
        />
      )}

      {/* Sidebar */}
      <div style={sidebarStyle}>
        {/* Profile */}
        <div style={{ textAlign: "center", width: "100%", marginBottom: "25px", position: "relative" }}>
          <div
            style={{
              width: collapsed ? "45px" : "95px",
              height: collapsed ? "45px" : "95px",
              borderRadius: "50%",
              backgroundColor: "white",
              color: "#48ff00ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: collapsed ? "18px" : "32px",
              fontWeight: "bold",
              margin: "0 auto 8px",
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              username?.charAt(0)
            )}
            {hovered && (
              <div
                style={{
                  height: collapsed ? "45px" : "95px",
                  width: collapsed ? "45px" : "95px",
                  borderRadius: "50%",
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  
              margin: "0 auto 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <label htmlFor="avatar-upload" style={{ cursor: "pointer" }}>
                  <ImagePlus size={22} color="#fff" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>
          {!collapsed && <h5 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>{username}</h5>}
        </div>

        {/* Nav */}
        <nav style={{ width: "100%" }}>
          {[
            { to: "/home", label: "Home", icon: <Home /> },
            { to: "/enroll", label: "Face Enrollment", icon: <UserPlus /> },
            { to: "/accounts", label: "Manage Accounts", icon: <Users /> },
            { to: "/sos", label: "SOS", icon: <Bell /> },
            { to: "/settings", label: "Settings", icon: <Settings /> },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                color: "white",
                textDecoration: "none",
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "8px",
                fontSize: "15px",
                fontWeight: "500",
                backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "transparent",
              })}
              onClick={() => isMobile && setMobileMenuOpen(false)}
            >
              <span style={{ marginRight: collapsed ? 0 : 12 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: "auto",
            width: collapsed ? "60px" : "100%",
            background: "rgba(0,0,0,0.4)",
            border: "none",
            color: "white",
            borderRadius: "8px",
            padding: "10px",
            cursor: "pointer",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: collapsed ? "0" : "8px",
          }}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Toggle Button (Desktop Only) */}
      {!isMobile && (
        <div style={toggleBox} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={18} color="#4a5942" /> : <ChevronLeft size={18} color="#4a5942" />}
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : collapsed ? "80px" : "240px",
          backgroundColor: "#f8faf8",
          minHeight: "100vh",
          overflowY: "auto",
          transition: "margin 0.3s ease",
        }}
      >
        {children}
      </div>

      {/* SOS ALERT POPUPS */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          zIndex: 9999,
        }}
      >
        {sosAlerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              backgroundColor: "#fff",
              border: "3px solid #b22222",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              padding: "20px",
              width: "320px",
              color: "#333",
              animation: "slideInRight 0.6s ease-out, pulseGlow 1.5s infinite",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ color: "#b22222", fontWeight: "700", marginBottom: "10px" }}>🚨 Emergency Alert!</h4>
              <button
                onClick={() => closeAlert(alert.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#b22222",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✖
              </button>
            </div>
            <p><strong>{alert.username}</strong> triggered an SOS alert.</p>
            <p style={{ fontSize: "0.9rem", color: "#555" }}>
              <MapPin size={14} style={{ marginRight: "5px", verticalAlign: "middle" }} />
              {alert.location}
            </p>
            <a
              href={`https://www.google.com/maps?q=${alert.location}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#4e6f3c",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              🌐 Open in Google Maps
            </a>
          </div>
        ))}
      </div>

      {/* Audio */}
      <audio
        ref={alertSound}
        src="https://assets.mixkit.co/sfx/preview/mixkit-alert-quick-chime-766.mp3"
        preload="auto"
      />

      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(178,34,34, 0.5); }
            70% { box-shadow: 0 0 10px 8px rgba(178,34,34, 0); }
            100% { box-shadow: 0 0 0 0 rgba(178,34,34, 0); }
          }
        `}
      </style>
    </div>
  );
};

export default Layout;
