import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css"; 
import { Eye, EyeOff } from "lucide-react"; 
import { PHP_API_URL } from "../api/config";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Registering...");

    try {
      const response = await fetch(`${PHP_API_URL}/register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      setMessage(result.message);
    } catch (err) {
      setMessage("Error connecting to server.");
      console.error(err);
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
      {/* SAFE SYNC Title */}
      <h1
        className="notable-regular fw-bold mb-4 text-center"
        style={{
          fontSize: "4rem",
          color: "#6b7760",
          letterSpacing: "1.5px",
          WebkitTextStroke: ".1px black",
          textStroke: ".1px black",
          marginBottom: "40px",
        }}
      >
        SAFE<br />SYNC
      </h1>

      {/* Registration Card */}
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
              backgroundColor: "black",
              color: "white",
              border: "none",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "0",
            }}
            onClick={() => navigate("/")}
          >
            Login
          </button>

          <button
            className="btn flex-fill rounded-end-pill"
            style={{
              background: "linear-gradient(to right, #88967d, #a3b094)",
              color: "black",
              fontWeight: "500",
              border: "none",
              borderTopLeftRadius: "0",
              borderBottomLeftRadius: "0",
            }}
          >
            Signup
          </button>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              className="form-control rounded-pill login-input"
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-3">
            <input
              name="username"
              placeholder="Username"
              className="form-control rounded-pill login-input"
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          {/* Password Field with Show/Hide */}
          <div className="mb-4 position-relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="form-control rounded-pill login-input pe-5"
              onChange={handleChange}
              required
              autoComplete="new-password"
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
                padding: "0",
                cursor: "pointer",
              }}
            >
              {showPassword ? <EyeOff size={20} color="gray" /> : <Eye size={20} color="gray" />}
            </button>
          </div>

          <button
            type="submit"
            className="btn w-100 rounded-4"
            style={{
              background: "linear-gradient(to bottom, #9aa58c, #606d5b)",
              color: "black",
              fontWeight: "500",
            }}
          >
            Register
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
}

export default Register;
