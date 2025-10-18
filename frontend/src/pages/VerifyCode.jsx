import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PHP_API_URL } from "../api/config";

const VerifyCode = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const email = localStorage.getItem("reset_email");

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${PHP_API_URL}/verify_code.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ email, code: code.trim() }), 
      });

      const data = await response.json();

      console.log("Verify response:", data); 

      if (data.status === "success") {
        setMessage("✅ Code verified successfully!");
        localStorage.setItem("verified_email", email);

        setTimeout(() => navigate("/reset-password"), 1500);
      } else {
        setMessage(`❌ ${data.message || "Invalid or expired code."}`);
        if (data.debug) console.warn("Debug info:", data.debug);
      }
    } catch (error) {
      console.error("Verify error:", error);
      setMessage("⚠️ Server error. Please try again later.");
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
        <h4 className="text-center mb-3">Verify Code</h4>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            className="form-control rounded-pill mb-3 text-center"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
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
            {loading ? "Verifying..." : "Verify Code"}
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

export default VerifyCode;
