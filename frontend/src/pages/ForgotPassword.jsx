import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PHP_API_URL } from "../api/config";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${PHP_API_URL}/send_reset_code.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.status === "success") {
        setMessage("✅ Code sent! Please check your email.");
        localStorage.setItem("reset_email", email);
        setTimeout(() => navigate("/verify-code"), 2000);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
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
        <h4 className="text-center mb-3">Forgot Password</h4>
        <form onSubmit={handleSendCode}>
          <input
            type="email"
            className="form-control rounded-pill mb-3"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Sending..." : "Send Verification Code"}
          </button>
        </form>

        {message && (
          <p className="text-center mt-3 fw-bold" style={{ color: "#333" }}>
            {message}
          </p>
        )}

        <div className="text-center mt-3">
          <button
            className="btn btn-link p-0"
            onClick={() => navigate("/")}
            style={{ color: "black", textDecoration: "none" }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
