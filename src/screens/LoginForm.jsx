// src/pages/LoginForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TOASTS = {
  alreadyLoggedIn: "login_already_logged_in",
  missingCreds: "login_missing_credentials",
  invalidCreds: "login_invalid_credentials",
  success: "login_success",
  serverError: "login_server_error",
};

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ✅ Auto redirect if already logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      toast.info("ℹ️ You're already logged in.", {
        toastId: TOASTS.alreadyLoggedIn,
        autoClose: 1500,
      });
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.warn("⚠️ Please enter both username and password", {
        toastId: TOASTS.missingCreds,
        autoClose: 2000,
      });
      return;
    }

    try {
      const apiUrl = `/banquetapi/user_login_new.php?${new URLSearchParams({
        user_name: username,
        password: password,
      })}`;

      const response = await axios.post(
        apiUrl,
        new URLSearchParams({
          user_name: username,
          password: password,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const user = response.data?.result?.[0];
      if (!user) {
        toast.error("❌ Invalid username or password", {
          toastId: TOASTS.invalidCreds,
          autoClose: 2000,
        });
        return;
      }

      if (user.u_name === username && user.u_pass === password) {
        const userId =
          user.login_id || user.u_id || user.userid || user.Userid || "";
        const hotelId = user.hotel_id || user.Hotelid || "";
        const hotelName = user.hotel_name || "Unknown Hotel";

        // 🔹 Store everything nicely
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("user_id", userId);
        localStorage.setItem("login_id", userId);   // 👈 IMPORTANT NEW LINE
        localStorage.setItem("hotel_id", hotelId);
        localStorage.setItem("hotel_name", hotelName);
        localStorage.setItem("user_name", user.u_name || "");
        localStorage.setItem("user_role", user.UserRole || "");

        toast.success(
          `✅ Login successful!\nWelcome ${user.u_name}\nHotel: ${hotelName}`,
          {
            toastId: TOASTS.success,
            autoClose: 800,
          }
        );

        navigate("/dashboard");
      } else {
        toast.error("❌ Invalid username or password", {
          toastId: TOASTS.invalidCreds,
          autoClose: 2000,
        });
      }
    } catch (err) {
      console.error("⚠️ Login error:", err);
      toast.error("⚠️ Server error, please try again later", {
        toastId: TOASTS.serverError,
        autoClose: 2500,
      });
    }
  };

  return (
    <div className="login-container">
      <h2>Banquet Billing Login</h2>
      <form onSubmit={handleSubmit}>
        {/* Username Input */}
        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Password Field with Toggle */}
        <div style={{ position: "relative", width: "100%", maxWidth: "450px" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", paddingRight: "40px" }}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "#007bff",
              fontSize: "14px",
              userSelect: "none",
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        <button type="submit" style={{ marginTop: "12px" }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
