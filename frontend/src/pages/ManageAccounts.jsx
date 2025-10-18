import React, { useEffect, useState } from "react";
import axios from "axios";
import { PHP_API_URL } from "../api/config";
import { Plus } from "lucide-react";

const ManageAccounts = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${PHP_API_URL}/manage_accounts.php`);
      if (Array.isArray(res.data)) {
        setUsers(res.data);
        setFilteredUsers(res.data);
      } else {
        console.error("Unexpected response:", res.data);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let data = [...users];

    if (search.trim() !== "") {
      const s = search.toLowerCase();
      data = data.filter(
        (u) =>
          u.id.toString().includes(s) ||
          u.username.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
      );
    }

    if (filter === "enrolled") {
      data = data.filter((u) => u.remarks === "Enrolled");
    } else if (filter === "not_enrolled") {
      data = data.filter((u) => u.remarks === "Not Enrolled");
    }

    setFilteredUsers(data);
  }, [search, filter, users]);

  const handleAddUser = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${PHP_API_URL}/add_account.php`, newUser, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.status === "success" || res.data.success) {
        alert("Account added successfully!");
        setShowModal(false);
        setNewUser({ username: "", email: "", password: "" });
        fetchAccounts();
      } else {
        alert(res.data.message || "⚠️ Failed to add account.");
      }
    } catch (err) {
      console.error("Error adding account:", err);
      alert("Error adding account.");
    }
  };

  return (
    <div style={styles.page}>
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
          👥 Manage Accounts
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "#555",
            marginBottom: "15px",
          }}
        >
          View and manage all registered accounts and their enrollment status.
        </p>
      </header>



      {/* Main Content */}
      <main style={styles.main}>
        {/* Controls */}
        <div style={styles.controls}>
          <input
            type="text"
            placeholder="🔍 Search by ID, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All</option>
            <option value="enrolled">Enrolled</option>
            <option value="not_enrolled">Not Enrolled</option>
          </select>
          <button style={styles.addButton} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add Account
          </button>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#555" }}>
              Loading accounts...
            </p>
          ) : filteredUsers.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999" }}>No users found.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    style={{
                      ...styles.tr,
                      backgroundColor: index % 2 === 0 ? "#fafafa" : "#fff",
                    }}
                  >
                    <td style={styles.td}>{user.id}</td>
                    <td style={styles.td}>{user.username}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>
                      {user.remarks === "Enrolled" ? (
                        <span style={styles.enrolled}>Enrolled</span>
                      ) : (
                        <span style={styles.notEnrolled}>Not Enrolled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: "15px", textAlign: "center" }}>
              Add New Account
            </h3>
            <form onSubmit={handleAddUser} style={styles.modalForm}>
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                required
                style={styles.modalInput}
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
                style={styles.modalInput}
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
                style={styles.modalInput}
              />

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.saveButton}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Updated Styles
const styles = {
  page: {
    fontFamily: "'Poppins', sans-serif",
    color: "#2f2f2f",
    background: "linear-gradient(to bottom, #e8eae5, #f5f5f5)",
    minHeight: "100vh",
  },
  main: {
    padding: "25px 5vw",
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "20px",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  select: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#5c7c47",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.3s",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "center",
    padding: "12px",
    backgroundColor: "#f1f5f9",
    fontWeight: "600",
    borderBottom: "1px solid #ddd",
  },
  tr: {
    transition: "background-color 0.2s",
  },
  td: {
    textAlign: "center",
    padding: "10px",
    borderBottom: "1px solid #eee",
  },
  enrolled: {
    color: "#16a34a",
    fontWeight: "600",
  },
  notEnrolled: {
    color: "#dc2626",
    fontWeight: "600",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "25px",
    width: "400px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  modalInput: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "10px",
  },
  cancelButton: {
    backgroundColor: "#9ca3af",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  saveButton: {
    backgroundColor: "#5c7c47",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "0.3s",
  },
};

export default ManageAccounts;
