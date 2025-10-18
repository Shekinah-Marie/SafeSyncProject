import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyCode from "./pages/VerifyCode";
import ResetPassword from "./pages/ResetPassword";
import FaceEnrollment from "./pages/FaceEnrollment";
import Home from "./pages/Home";
import Layout from "./layout/Layout";
import CameraFeed from "./pages/CameraFeed";
import ManageAccounts from "./pages/ManageAccounts";
import Settings from "./pages/Settings"; 
import SOS from "./pages/SOS";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Route guard for protected pages
const PrivateRoute = ({ children }) => {
  const user = localStorage.getItem("user_id");
  console.log("Checking PrivateRoute → user_id:", user);
  return user ? children : <Navigate to="/" replace />;
};

// Redirect logged-in users away from login/register/forgot pages
const PublicRoute = ({ children }) => {
  const user = localStorage.getItem("user_id");
  console.log("Checking PublicRoute → user_id:", user);
  return !user ? children : <Navigate to="/home" replace />;
};

<ToastContainer
  position="top-center"
  newestOnTop
  limit={3}
  pauseOnFocusLoss={false}
  closeOnClick
  draggable
/>

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-code"
          element={
            <PublicRoute>
              <VerifyCode />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Layout>
                <Home />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/enroll"
          element={
            <PrivateRoute>
              <Layout>
                <FaceEnrollment />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/accounts"
          element={
            <PrivateRoute>
              <Layout>
                <ManageAccounts />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/camera/:id"
          element={
            <PrivateRoute>
              <Layout>
                <CameraFeed />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/sos"
          element={
            <PrivateRoute>
              <Layout>
                <SOS />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Layout>
                <Settings />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
