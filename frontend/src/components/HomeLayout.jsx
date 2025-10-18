import React from "react";
import { useNavigate, Outlet } from "react-router-dom";
import {
  Home,
  UserRound,
  AlertTriangle,
  Settings,
  LogOut,
  Users, 
} from "lucide-react";

const HomeLayout = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const menuItems = [
    { label: "Home", icon: <Home size={20} />, path: "/home" },
    { label: "Face Enrollment", icon: <UserRound size={20} />, path: "/enroll" },
    { label: "Manage Accounts", icon: <UserRound size={20} />, path: "/accounts" },
    { label: "SOS", icon: <AlertTriangle size={20} />, path: "/sos" },
    { label: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Roboto', sans-serif",
        background: "linear-gradient(to bottom, #f7f6f2, #c6c6bc)",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          backgroundColor: "#e3e3e3",
          boxShadow: "2px 0 10px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "20px 10px",
        }}
      >
        {/* Profile Section */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "linear-gradient(to bottom, #9aa58c, #606d5b)",
              margin: "0 auto 10px auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "28px",
              fontWeight: "bold",
            }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
          <p
            style={{
              margin: "0",
              fontWeight: "600",
              color: "#333",
              fontSize: "1.1rem",
            }}
          >
            {username}
          </p>

          <button
            onClick={handleLogout}
            style={{
              marginTop: "10px",
              background: "black",
              color: "white",
              border: "none",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Navigation */}
        <div>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                marginBottom: "10px",
                background:
                  window.location.pathname === item.path
                    ? "linear-gradient(to right, #88967d, #a3b094)"
                    : "transparent",
                border: "none",
                borderRadius: "12px",
                fontWeight: "500",
                fontSize: "1rem",
                color: window.location.pathname === item.path ? "black" : "#333",
                cursor: "pointer",
                transition: "background 0.3s, color 0.3s",
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: "0.8rem",
            color: "#666",
            textAlign: "center",
            marginTop: "auto",
          }}
        >
          SAFE SYNC © 2025
        </p>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: "30px",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default HomeLayout;
