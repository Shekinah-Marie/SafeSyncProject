import React from "react";
import { Home, UserPlus, Bell, Users, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Home", icon: <Home size={22} />, path: "/home" },
    { label: "Face Enrollment", icon: <UserPlus size={22} />, path: "/enroll" },
    { label: "SOS", icon: <Bell size={22} />, path: "/sos" },
    { label: "Manage Accounts", icon: <Users size={22} />, path: "/manage-accounts" },
    { label: "Settings", icon: <Settings size={22} />, path: "/settings" },
  ];

  const username = localStorage.getItem("username") || "User";

  return (
    <div
      style={{
        width: "240px",
        height: "100vh",
        backgroundColor: "#e3e3e3",
        boxShadow: "2px 0 6px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Top Profile Section */}
      <div>
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #ccc",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#bbb",
              margin: "0 auto 10px",
            }}
          ></div>
          <h5 style={{ margin: 0 }}>{username}</h5>
        </div>

        {/* Navigation Items */}
        <div style={{ marginTop: "20px" }}>
          {menuItems.map((item) => (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                cursor: "pointer",
                backgroundColor:
                  location.pathname === item.path ? "#c6c6bc" : "transparent",
                fontWeight:
                  location.pathname === item.path ? "600" : "normal",
                transition: "0.2s",
              }}
            >
              {item.icon}
              <span style={{ marginLeft: "12px" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
