import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";
import { Eye, EyeOff } from "lucide-react";
import { PHP_API_URL } from "../api/config";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Show success message if password reset was done
  useEffect(() => {
    const success = localStorage.getItem("reset_success");
    if (success) {
      setMessage("Password reset successful! Please log in.");
      localStorage.removeItem("reset_success");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${PHP_API_URL}/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // important for PHP sessions
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid server response");
      }

      console.log("🔍 Login response:", data);

      if (data.status === "success") {
        // Save login info
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", data.username);
        localStorage.setItem("is_logged_in", "true");
        localStorage.setItem("last_login", new Date().toISOString());

        // Save avatar if provided from backend
        if (data.avatar_path) {
          const fullAvatarUrl = `${PHP_API_URL}/${data.avatar_path}`;
          localStorage.setItem("avatar", fullAvatarUrl);
        } else {
          localStorage.removeItem("avatar");
        }

        setMessage("✅ Login successful! Redirecting...");

        // Small delay for user feedback
        setTimeout(() => navigate("/home"), 1000);
      } else {
        setMessage("❌ " + (data.message || "Login failed"));
      }
    } catch (error) {
      console.error("⚠️ Login Error:", error);
      setMessage("⚠️ Unable to connect to server. Please try again.");
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
        paddingTop: "40px",
      }}
    >
      {/* SAFE SYNC Title */}
      <h1
        className="notable-regular fw-bold mb-4 text-center"
        style={{
          fontSize: "4rem",
          color: "#6b7760",
          letterSpacing: "1.5px",
          WebkitTextStroke: ".1px black",
          marginBottom: "28px",
        }}
      >
        SAFE
        <br />
        SYNC
      </h1>

      {/* Login Card */}
      <div
        className="p-5 rounded-4 shadow-lg"
        style={{
          backgroundColor: "#e3e3e3",
          width: "400px",
        }}
      >
        {/* Tabs */}
        <div className="d-flex mb-4">
          <button
            className="btn flex-fill rounded-start-pill"
            style={{
              background: "linear-gradient(to right, #88967d, #a3b094)",
              color: "black",
              fontWeight: "500",
              border: "none",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "0",
            }}
          >
            Login
          </button>

          <button
            className="btn flex-fill rounded-end-pill"
            style={{
              backgroundColor: "black",
              color: "white",
              border: "none",
              borderTopLeftRadius: "0",
              borderBottomLeftRadius: "0",
            }}
            onClick={() => navigate("/register")}
          >
            Signup
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control rounded-pill login-input"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control rounded-pill login-input pe-5"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {showPassword ? (
                <EyeOff size={20} color="gray" />
              ) : (
                <Eye size={20} color="gray" />
              )}
            </button>
          </div>

          <div className="text-start mb-3">
            <button
              type="button"
              className="btn btn-link p-0"
              style={{
                color: "black",
                fontSize: "0.95rem",
                textDecoration: "none",
                fontWeight: "500",
              }}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </button>
          </div>

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
            {loading ? "Logging in..." : "Login"}
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

export default Login;







