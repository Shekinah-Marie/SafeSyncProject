// src/hooks/useAuthTimeout.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Automatically logs the user out when:
 * - The login session exceeds the time limit (default: 30 mins)
 * - The browser/tab is closed (via sessionStorage)
 */
const useAuthTimeout = (timeout = 30 * 60 * 1000) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Add a small delay to ensure sessionStorage is properly set
    const checkAuth = () => {
      const token = sessionStorage.getItem("authToken");
      const loginTime = sessionStorage.getItem("loginTime");

      console.log("Auth check:", { token, loginTime }); // Debug log

      if (!token || !loginTime) {
        console.log("No auth token or login time found");
        return;
      }

      const elapsed = Date.now() - parseInt(loginTime);
      const remaining = timeout - elapsed;

      console.log("Time check:", { elapsed, remaining }); // Debug log

      // If already expired
      if (remaining <= 0) {
        console.log("Session expired, logging out");
        handleLogout();
        return;
      }

      // Schedule automatic logout
      console.log(`Setting logout timer for ${remaining}ms`);
      const timer = setTimeout(handleLogout, remaining);

      function handleLogout() {
        console.log("Executing logout");
        sessionStorage.clear();
        localStorage.clear();
        alert("Session expired. Please log in again.");
        navigate("/login");
      }

      // Cleanup timer when component unmounts
      return () => {
        console.log("Cleaning up auth timer");
        clearTimeout(timer);
      };
    };

    // Small delay to ensure everything is loaded
    const timerId = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timerId);
  }, [navigate, timeout]);
};

export default useAuthTimeout;