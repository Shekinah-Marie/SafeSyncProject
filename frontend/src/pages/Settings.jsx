import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { PHP_API_URL } from "../api/config";
import { Trash2, Edit } from "lucide-react";

const Settings = () => {
  const userId = localStorage.getItem("user_id");
  const [user, setUser] = useState({
    id: "",
    username: "",
    email: "",
    contact: "",
    current_password: "",
    new_password: "",
  });

  const [hotlines, setHotlines] = useState([]);
  const [newHotline, setNewHotline] = useState({
    name: "",
    contact: "",
    address: "",
  });
  const [editingHotline, setEditingHotline] = useState(null);

  /* Fetch User Details */
  const fetchUserDetails = useCallback(async () => {
    try {
      const res = await axios.get(`${PHP_API_URL}/get_user.php?id=${userId}`);
      if (res.data && res.data.username) {
        setUser((u) => ({
          ...u,
          id: res.data.id,
          username: res.data.username,
          email: res.data.email,
          contact: res.data.contact || "",
        }));
      } else {
        console.warn("No user data returned:", res.data);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      alert("Failed to load user details.");
    }
  }, [userId]);

  /* Fetch Hotlines */
  const fetchHotlines = useCallback(async () => {
    try {
      const res = await axios.get(`${PHP_API_URL}/get_hotlines.php`);
      if (Array.isArray(res.data)) setHotlines(res.data);
    } catch (err) {
      console.error("Error fetching hotlines:", err);
      alert("Failed to load hotlines.");
    }
  }, []);

  /* Load user & hotlines on mount */
  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchHotlines();
    }
  }, [userId, fetchUserDetails, fetchHotlines]);

  /* Update Account Info */
  const handleUserUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: userId,
        username: user.username,
        email: user.email,
        contact: user.contact,
      };

      const res = await axios.post(`${PHP_API_URL}/update_user.php`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.status === "success") {
        localStorage.setItem("username", user.username);
        localStorage.setItem("email", user.email || "");
        localStorage.setItem("contact", user.contact || "");

        window.dispatchEvent(
          new CustomEvent("userUpdated", {
            detail: {
              username: user.username,
              email: user.email,
              contact: user.contact,
            },
          })
        );

        alert("Account updated successfully!");
        fetchUserDetails();
      } else {
        alert(res.data.message || "Failed to update account.");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Error updating user info.");
    }
  };

  /* Change Password */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!user.current_password || !user.new_password) {
      alert("Please fill both current and new password.");
      return;
    }
    try {
      const payload = {
        id: userId,
        current_password: user.current_password,
        new_password: user.new_password,
      };
      const res = await axios.post(
        `${PHP_API_URL}/change_password.php`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      alert(res.data.message || "Password changed successfully!");
      setUser((u) => ({ ...u, current_password: "", new_password: "" }));
    } catch (err) {
      console.error("Error changing password:", err);
      alert("Error changing password.");
    }
  };

  /* Add Hotline */
  const handleAddHotline = async (e) => {
    e.preventDefault();
    if (!newHotline.name || !newHotline.contact || !newHotline.address) {
      alert("All hotline fields are required.");
      return;
    }
    try {
      const res = await axios.post(`${PHP_API_URL}/add_hotline.php`, newHotline, {
        headers: { "Content-Type": "application/json" },
      });
      alert(res.data.message || "Hotline added!");
      setNewHotline({ name: "", contact: "", address: "" });
      fetchHotlines();
    } catch (err) {
      console.error("Error adding hotline:", err);
      alert("Error adding hotline.");
    }
  };

  /* Edit Hotline */
  const handleEditHotline = (hotline) => {
    setEditingHotline({ ...hotline });
  };

  /* Update Hotline */
  const handleUpdateHotline = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${PHP_API_URL}/update_hotline.php`,
        editingHotline,
        { headers: { "Content-Type": "application/json" } }
      );
      alert(res.data.message || "Hotline updated!");
      setEditingHotline(null);
      fetchHotlines();
    } catch (err) {
      console.error("Error updating hotline:", err);
      alert("Error updating hotline.");
    }
  };

  /* Delete Hotline */
  const handleDeleteHotline = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hotline?")) return;
    try {
      const res = await axios.post(
        `${PHP_API_URL}/delete_hotline.php`,
        { id },
        { headers: { "Content-Type": "application/json" } }
      );
      alert(res.data.message || "Hotline deleted!");
      fetchHotlines();
    } catch (err) {
      console.error("Error deleting hotline:", err);
      alert("Error deleting hotline.");
    }
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", color: "#2f2f2f" }}>
      {/* Header */}
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
          Settings & Preferences
        </h1>
        <p style={{ fontSize: "1rem", color: "#555" }}>
          Manage your account details and emergency hotlines easily.
        </p>
      </header>

      {/* Main Content */}
      <main style={{ padding: "25px 5vw" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          {/* Account Info Section */}
          <section
            style={{
              backgroundColor: "#f5f6f5",
              borderRadius: "16px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
              padding: "25px",
              flex: "2 1 400px",
            }}
          >
            <h2 style={sectionHeader}>👤 Account Information</h2>
            <form
              onSubmit={handleUserUpdate}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "15px",
              }}
            >
              <input
                type="text"
                placeholder="Username"
                value={user.username}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
                style={inputStyle}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                style={inputStyle}
                required
              />
              <input
                type="text"
                placeholder="Contact"
                value={user.contact}
                onChange={(e) => setUser({ ...user, contact: e.target.value })}
                style={inputStyle}
              />
              <button type="submit" style={buttonStyle}>
                💾 Save Info
              </button>
            </form>
          </section>

          {/* Change Password */}
          <section
            style={{
              backgroundColor: "#f5f6f5",
              borderRadius: "16px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
              padding: "25px",
              flex: "1 1 300px",
            }}
          >
            <h2 style={sectionHeader}>🔒 Change Password</h2>
            <form
              onSubmit={handlePasswordChange}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <input
                type="password"
                placeholder="Current Password"
                value={user.current_password}
                onChange={(e) =>
                  setUser({ ...user, current_password: e.target.value })
                }
                style={inputStyle}
                required
              />
              <input
                type="password"
                placeholder="New Password"
                value={user.new_password}
                onChange={(e) =>
                  setUser({ ...user, new_password: e.target.value })
                }
                style={inputStyle}
                required
              />
              <button type="submit" style={{ ...buttonStyle, width: "100%" }}>
                🔁 Change Password
              </button>
            </form>
          </section>
        </div>

        {/* Emergency Hotlines */}
        <section
          style={{
            backgroundColor: "#f5f6f5",
            borderRadius: "16px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
            padding: "25px",
          }}
        >
          <h2 style={sectionHeader}>🚨 Emergency Hotlines</h2>

          <form
            onSubmit={handleAddHotline}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <input
              type="text"
              placeholder="Office Name"
              value={newHotline.name}
              onChange={(e) =>
                setNewHotline({ ...newHotline, name: e.target.value })
              }
              style={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Contact"
              value={newHotline.contact}
              onChange={(e) =>
                setNewHotline({ ...newHotline, contact: e.target.value })
              }
              style={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={newHotline.address}
              onChange={(e) =>
                setNewHotline({ ...newHotline, address: e.target.value })
              }
              style={inputStyle}
              required
            />
            <button type="submit" style={buttonStyle}>
              ➕ Add Hotline
            </button>
          </form>

          <div style={{ overflowX: "auto" }}>
            {hotlines.length === 0 ? (
              <p style={{ textAlign: "center", color: "#555" }}>
                No hotlines available.
              </p>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Office Name</th>
                    <th style={thStyle}>Contact</th>
                    <th style={thStyle}>Address</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hotlines.map((h, idx) => (
                    <tr
                      key={h.id ?? idx}
                      style={{
                        backgroundColor:
                          idx % 2 === 0 ? "#ffffff" : "#f0f0f0",
                      }}
                    >
                      <td style={tdStyle}>{h.name}</td>
                      <td style={tdStyle}>{h.contact}</td>
                      <td style={tdStyle}>{h.address}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleEditHotline(h)}
                          style={editBtn}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteHotline(h.id)}
                          style={deleteBtn}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* Edit Hotline Modal */}
      {editingHotline && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginBottom: "15px", textAlign: "center" }}>
              ✏️ Edit Emergency Hotline
            </h3>
            <form
              onSubmit={handleUpdateHotline}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <input
                type="text"
                placeholder="Office Name"
                value={editingHotline.name}
                onChange={(e) =>
                  setEditingHotline({
                    ...editingHotline,
                    name: e.target.value,
                  })
                }
                style={inputStyle}
                required
              />
              <input
                type="text"
                placeholder="Contact"
                value={editingHotline.contact}
                onChange={(e) =>
                  setEditingHotline({
                    ...editingHotline,
                    contact: e.target.value,
                  })
                }
                style={inputStyle}
                required
              />
              <input
                type="text"
                placeholder="Address"
                value={editingHotline.address}
                onChange={(e) =>
                  setEditingHotline({
                    ...editingHotline,
                    address: e.target.value,
                  })
                }
                style={inputStyle}
                required
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" style={buttonStyle}>
                  💾 Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingHotline(null)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: "#ccc",
                    color: "#333",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* Shared Styles */
const sectionHeader = {
  fontSize: "1.3rem",
  fontWeight: "600",
  marginBottom: "15px",
  color: "#333",
};

const inputStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  width: "100%",
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "10px 18px",
  borderRadius: "8px",
  backgroundColor: "#5c7c47",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: "500",
  transition: "background 0.3s",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
  fontSize: "0.95rem",
};

const thStyle = {
  padding: "12px 14px",
  backgroundColor: "#e5e7eb",
  color: "#333",
  fontWeight: "600",
};

const tdStyle = {
  padding: "10px 14px",
  color: "#333",
};

const editBtn = {
  backgroundColor: "#5c7c47",
  color: "#fff",
  border: "none",
  padding: "6px 8px",
  borderRadius: "6px",
  marginRight: "6px",
  cursor: "pointer",
};

const deleteBtn = {
  backgroundColor: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContent = {
  background: "#fff",
  padding: "24px",
  borderRadius: "16px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
  width: "90%",
  maxWidth: "420px",
};

export default Settings;
