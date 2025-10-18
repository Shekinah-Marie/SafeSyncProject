import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/devices";

const Home = () => {
  const [devices, setDevices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: "",
    location: "",
    description: "",
    device_type: "USB",
    camera_index: 0,
    usb_port: "",
    ip_address: "",
    port: "",
    username: "",
    password: "",
    rtsp_path: "",
  });

  // === Fetch Devices ===
  const fetchDevices = async () => {
    try {
      const res = await axios.get(API_URL);
      setDevices(res.data);
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // === Add Device ===
  const addDevice = async () => {
    if (!newDevice.name.trim()) return alert("Please enter a device name.");

    if (newDevice.device_type === "USB" && newDevice.usb_port === "") {
      return alert("Please enter a USB Port number.");
    }

    const payload = {
      name: newDevice.name,
      location: newDevice.location || "Unknown",
      description: newDevice.description || null,
      device_type: newDevice.device_type,
      camera_index:
        newDevice.device_type === "USB"
          ? Number(newDevice.camera_index)
          : null,
      usb_port:
        newDevice.device_type === "USB" ? Number(newDevice.usb_port) : null,
      ip_address:
        newDevice.device_type === "IP" ? newDevice.ip_address : null,
      port:
        newDevice.device_type === "IP" && newDevice.port
          ? Number(newDevice.port)
          : null,
      username:
        newDevice.device_type === "IP" ? newDevice.username : null,
      password:
        newDevice.device_type === "IP" ? newDevice.password : null,
      rtsp_path:
        newDevice.device_type === "IP" ? newDevice.rtsp_path : null,
    };

    try {
      const res = await axios.post(API_URL, payload);
      setDevices([...devices, res.data]);
      alert("Device added successfully!");
      setNewDevice({
        name: "",
        location: "",
        description: "",
        device_type: "USB",
        camera_index: 0,
        usb_port: "",
        ip_address: "",
        port: "",
        username: "",
        password: "",
        rtsp_path: "",
      });
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to add device:", err);
      alert("Error adding device. Please check console.");
    }
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", color: "#2f2f2f" }}>
      {/* === Header === */}
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
          Home Dashboard
        </h1>
        <p style={{ fontSize: "1rem", color: "#555", marginBottom: "15px" }}>
          Manage and monitor all your connected devices in one secure dashboard.
        </p>
      </header>

      {/* === Main Section === */}
      <main style={{ padding: "25px 5vw" }}>
        <section
          style={{
            backgroundColor: "#f5f6f5",
            borderRadius: "16px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
            padding: "25px",
          }}
        >
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: "600",
              marginBottom: "15px",
              color: "#333",
            }}
          >
            Connected Devices
          </h2>

          {/* === Add Device Button === */}
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              backgroundColor: "#5c7c47",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
              transition: "background 0.3s",
              marginBottom: "20px",
            }}
          >
            ➕ Add Device
          </button>

          {/* === Modal === */}
          {modalOpen && (
            <div
              style={{
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
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "30px",
                  width: "90%",
                  maxWidth: "400px",
                  boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
                }}
              >
                <h3 style={{ marginBottom: "15px", color: "#333" }}>
                  Add New Device
                </h3>

                {/* Device Type */}
                <select
                  value={newDevice.device_type}
                  onChange={(e) =>
                    setNewDevice({
                      ...newDevice,
                      device_type: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    marginBottom: "10px",
                  }}
                >
                  <option value="USB">USB Camera</option>
                  <option value="IP">IP Camera</option>
                </select>

                {/* Name */}
                <input
                  type="text"
                  placeholder="Device Name"
                  value={newDevice.name}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    marginBottom: "10px",
                  }}
                />

                {/* Location */}
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={newDevice.location}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, location: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    marginBottom: "10px",
                  }}
                />

                {/* Description */}
                <textarea
                  placeholder="Description (optional)"
                  value={newDevice.description}
                  onChange={(e) =>
                    setNewDevice({
                      ...newDevice,
                      description: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    marginBottom: "10px",
                    resize: "none",
                    height: "60px",
                  }}
                />

                {/* USB Camera Fields */}
                {newDevice.device_type === "USB" && (
                  <>
                    <input
                      type="number"
                      placeholder="Camera Index (e.g., 0)"
                      value={newDevice.camera_index}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          camera_index: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "10px",
                      }}
                    />
                    <input
                      type="number"
                      placeholder="USB Port (e.g., 1)"
                      value={newDevice.usb_port}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          usb_port: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "20px",
                      }}
                    />
                  </>
                )}

                {/* IP Camera Fields */}
                {newDevice.device_type === "IP" && (
                  <>
                    <input
                      type="text"
                      placeholder="IP Address"
                      value={newDevice.ip_address}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          ip_address: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "10px",
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Port (optional)"
                      value={newDevice.port}
                      onChange={(e) =>
                        setNewDevice({ ...newDevice, port: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "10px",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Username (optional)"
                      value={newDevice.username}
                      onChange={(e) =>
                        setNewDevice({ ...newDevice, username: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "10px",
                      }}
                    />
                    <input
                      type="password"
                      placeholder="Password (optional)"
                      value={newDevice.password}
                      onChange={(e) =>
                        setNewDevice({ ...newDevice, password: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "10px",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="RTSP Path (optional)"
                      value={newDevice.rtsp_path}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          rtsp_path: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "20px",
                      }}
                    />
                  </>
                )}

                {/* Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={() => setModalOpen(false)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addDevice}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      backgroundColor: "#5c7c47",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === Device Cards === */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {devices.length === 0 ? (
              <div
                style={{
                  background:
                    "linear-gradient(to bottom right, #a3b49e, #c9c9bc)",
                  borderRadius: "12px",
                  padding: "25px",
                  textAlign: "center",
                  color: "#fff",
                }}
              >
                <h5 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>
                  No devices yet
                </h5>
                <p style={{ fontSize: "0.95rem" }}>
                  Add a new device to get started.
                </p>
              </div>
            ) : (
              devices.map((device) => (
                <div
                  key={device.id}
                  style={{
                    background:
                      "linear-gradient(to bottom right, #9aa58c, #c6c6bc)",
                    borderRadius: "12px",
                    padding: "25px",
                    textAlign: "center",
                    color: "#fff",
                  }}
                >
                  <h5 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>
                    {device.name}
                  </h5>
                  <p style={{ fontSize: "0.95rem", marginBottom: "6px" }}>
                    {device.location}
                  </p>
                  {device.description && (
                    <p style={{ fontSize: "0.8rem", marginBottom: "10px" }}>
                      {device.description}
                    </p>
                  )}
                  <p style={{ fontSize: "0.85rem", marginBottom: "10px" }}>
                    {device.device_type === "USB"
                      ? `USB Port: ${device.usb_port || 0} (Index: ${device.camera_index})`
                      : `IP: ${device.ip_address}${device.port ? ":" + device.port : ""}`}
                  </p>
                  <Link
                    to={`/camera/${device.id}`}
                    style={{
                      backgroundColor: "#5c7c47",
                      color: "#fff",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      textDecoration: "none",
                      display: "inline-block",
                      fontSize: "0.9rem",
                    }}
                  >
                    View Stream
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
