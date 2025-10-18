import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PHP_API_URL } from "../api/config";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const email = localStorage.getItem("reset_email");

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      setMessage("❌ Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setMessage("❌ Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${PHP_API_URL}/reset_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === "success") {
        localStorage.setItem("reset_success", "1");
        localStorage.removeItem("reset_email");
        setMessage("Password updated! Redirecting to login...");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setMessage("❌ " + (data.message || "Something went wrong."));
      }
    } catch (error) {
      console.error("Reset error:", error);
      setMessage("⚠️ Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center vh-100"
      style={{
        background: "linear-gradient(to bottom, #f7f6f2, #c6c6bc)",
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <h1
        className="notable-regular fw-bold mb-4 text-center"
        style={{
          fontSize: "4rem",
          color: "#6b7760",
          WebkitTextStroke: ".1px black",
        }}
      >
        SAFE<br />SYNC
      </h1>

      <div
        className="p-5 rounded-4 shadow-lg"
        style={{ backgroundColor: "#e3e3e3", width: "400px" }}
      >
        <h4 className="text-center mb-3">Reset Password</h4>

        <form onSubmit={handleReset}>
          <input
            type="password"
            className="form-control rounded-pill mb-3"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-control rounded-pill mb-3"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn w-100 rounded-4"
            disabled={loading}
            style={{
              background: "linear-gradient(to bottom, #9aa58c, #606d5b)",
              color: "black",
              fontWeight: "500",
            }}
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <p className="text-center mt-3 fw-bold" style={{ color: "#333" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
