import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

const FaceEnrollment = () => {
  const webcamRef = useRef(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const user_id = localStorage.getItem("user_id");

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setMessage("Image captured successfully!");
    } else {
      setMessage("Failed to capture image. Try again.");
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setMessage("📷 Ready to capture a new photo.");
  };

  // === Directly enroll face via Flask backend ===
  const enrollFace = async () => {
    if (!user_id) {
      setMessage("User not logged in!");
      return;
    }
    if (!name.trim() || !contact.trim() || !capturedImage) {
      setMessage("Please fill all fields and capture an image.");
      return;
    }

    setIsLoading(true);
    setMessage("⏳ Enrolling face, please wait...");

    try {
      const response = await fetch("http://localhost:5001/api/enroll_face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parseInt(user_id, 10),
          name,
          contact,
          image: capturedImage,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setMessage(`Face enrolled successfully for ${name}!`);
        setName("");
        setContact("");
        setCapturedImage(null);
        setTimeout(() => setMessage("Ready for next enrollment."), 4000);
      } else {
        setMessage("❌ " + (data.error || data.message || "Failed to enroll face."));
      }
    } catch (error) {
      console.error("Error enrolling face:", error);
      setMessage("Cannot reach Flask backend. Is it running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Poppins', sans-serif",
        color: "#2f2f2f",
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #e8eae5, #f5f5f5)",
      }}
    >
      <header
        style={{
          background: "linear-gradient(to bottom, #d9dbd3, #e8eae5)",
          padding: "30px 5vw 20px 5vw",
          borderBottom: "2px solid #ccc",
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
          🧍‍♂️ Face Enrollment
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "#555",
            marginBottom: "15px",
          }}
        >
          Register your face by capturing an image and saving your details.
        </p>
      </header>

      <main style={{ padding: "25px 5vw" }}>
        <section
          style={{
            backgroundColor: "#f5f6f5",
            borderRadius: "16px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
            padding: "25px",
            maxWidth: "600px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          {!capturedImage ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  borderRadius: "12px",
                  border: "3px solid #5c7c47",
                  overflow: "hidden",
                  width: "100%",
                  maxWidth: "420px",
                  aspectRatio: "4 / 3",
                  backgroundColor: "#000",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 420,
                    height: 315,
                    facingMode: "user",
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              <button
                onClick={captureImage}
                disabled={isLoading}
                style={{
                  marginTop: "20px",
                  backgroundColor: "#5c7c47",
                  color: "white",
                  padding: "10px 25px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "background 0.3s",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                Capture
              </button>
            </div>
          ) : (
            <div>
              <h4 style={{ color: "#333", marginBottom: "10px" }}>📸 Captured Image</h4>
              <img
                src={capturedImage}
                alt="Captured"
                style={{
                  borderRadius: "12px",
                  border: "3px solid #5c7c47",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  maxWidth: "420px",
                  width: "100%",
                  height: "auto",
                }}
              />
              <div style={{ marginTop: "15px" }}>
                <button
                  onClick={retakePhoto}
                  disabled={isLoading}
                  style={{
                    backgroundColor: "#b5b58a",
                    color: "#2f2f2f",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "0.3s",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  Retake Photo
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: "25px" }}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              style={{
                padding: "10px",
                width: "100%",
                marginBottom: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "15px",
              }}
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={isLoading}
              style={{
                padding: "10px",
                width: "100%",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "15px",
              }}
            />
            <button
              onClick={enrollFace}
              disabled={isLoading || !capturedImage}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "12px 0",
                borderRadius: "10px",
                backgroundColor: isLoading ? "#6c757d" : "#5c7c47",
                color: "white",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "16px",
                transition: "0.3s",
              }}
            >
              {isLoading ? "⏳ Saving..." : "💾 Save Face Data"}
            </button>
          </div>

          {message && (
            <p
              style={{
                marginTop: "20px",
                fontWeight: "bold",
                color: message.includes("✅")
                  ? "green"
                  : message.includes("⚠️")
                  ? "orange"
                  : "red",
              }}
            >
              {message}
            </p>
          )}
        </section>
      </main>
    </div>
  );
};

export default FaceEnrollment;
