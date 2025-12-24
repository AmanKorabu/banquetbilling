// src/pages/LoginForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useNotify } from "../context/NotifyProvider";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const notify = useNotify();

  // ✅ Auto redirect if already logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      notify.info("You're already logged in.", { duration: 1500 });
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, notify]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trim whitespace from inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      notify.warning("Please enter both username and password.", { duration: 2000 });
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = `/banquetapi/user_login_new.php?${new URLSearchParams({
        user_name: trimmedUsername,
        password: trimmedPassword,
      })}`;

      const response = await axios.post(
        apiUrl,
        new URLSearchParams({
          user_name: trimmedUsername,
          password: trimmedPassword,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const user = response.data?.result?.[0];
      if (!user) {
        notify.error("Invalid username or password.", { duration: 2000 });
        setIsLoading(false);
        return;
      }

      if (user.u_name === trimmedUsername && user.u_pass === trimmedPassword) {
        const userId =
          user.login_id || user.u_id || user.userid || user.Userid || "";
        const hotelId = user.hotel_id || user.Hotelid || "";
        const hotelName = user.hotel_name || "Unknown Hotel";

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("user_id", userId);
        localStorage.setItem("login_id", userId);
        localStorage.setItem("hotel_id", hotelId);
        localStorage.setItem("hotel_name", hotelName);
        localStorage.setItem("user_name", user.u_name || "");
        localStorage.setItem("user_role", user.UserRole || "");

        notify.success(`Welcome ${user.u_name}!`, {
          duration: 1200,
        });

        navigate("/dashboard", { replace: true });
      } else {
        notify.error("Invalid username or password.", { duration: 2000 });
      }
    } catch (err) {
      console.error("Login error:", err);
      notify.error("Server error, please try again later.", { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  // Inline styles for the component
  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "15px",
      fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    },
    loginCard: {
      width: "100%",
      maxWidth: "450px",
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      overflow: "hidden",
    },
    header: {
      background: "linear-gradient(to right, #4f46e5, #7c3aed)",
      padding: "20px 25px",
      textAlign: "center",
      color: "white",
    },
    title: {
      fontSize: "28px",
      fontWeight: "700",
      margin: "0 0 8px 0",
      letterSpacing: "0.5px",
    },
    subtitle: {
      fontSize: "16px",
      opacity: "0.9",
      fontWeight: "300",
      margin: "0",
    },
    formContainer: {
      padding: "45px 30px",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    inputWrapper: {
      position: "relative",
      width: "100%",
    },
    input: {
      width: "100%",
      padding: "14px 16px 14px 44px",
      borderRadius: "10px",
      border: "2px solid #e5e7eb",
      fontSize: "16px",
      transition: "all 0.3s ease",
      boxSizing: "border-box",
      outline: "none",
      background: "#f9fafb",
    },
    inputFocus: {
      borderColor: "#4f46e5",
      background: "white",
      boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)",
    },
    icon: {
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9ca3af",
    },
    passwordToggle: {
      position: "absolute",
      right: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: "#6b7280",
      fontSize: "14px",
      cursor: "pointer",
      fontWeight: "500",
      padding: "4px 8px",
      borderRadius: "4px",
      transition: "all 0.2s ease",
    },
    passwordToggleHover: {
      backgroundColor: "#f3f4f6",
      color: "#4f46e5",
    },
    submitButton: {
      background: "linear-gradient(to right, #4f46e5, #7c3aed)",
      color: "white",
      border: "none",
      padding: "16px",
      borderRadius: "10px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginTop: "8px",
      letterSpacing: "0.5px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    submitButtonHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 20px rgba(79, 70, 229, 0.3)",
    },
    submitButtonDisabled: {
      opacity: "0.7",
      cursor: "not-allowed",
    },
    loadingSpinner: {
      width: "20px",
      height: "20px",
      border: "3px solid rgba(255,255,255,0.3)",
      borderTop: "3px solid white",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    footer: {
      textAlign: "center",
      padding: "20px 30px",
      borderTop: "1px solid #e5e7eb",
      fontSize: "14px",
      color: "#6b7280",
    },
    footerLink: {
      color: "#4f46e5",
      textDecoration: "none",
      fontWeight: "600",
    },
    footerLinkHover: {
      textDecoration: "underline",
    },
  };

  // Dynamic styles
  const getInputStyle = (hasValue) => ({
    ...styles.input,
    ...(hasValue ? styles.inputFocus : {}),
    ...(isLoading ? { opacity: 0.7, cursor: "not-allowed" } : {}),
  });

  const getSubmitButtonStyle = () => ({
    ...styles.submitButton,
    ...(isLoading ? styles.submitButtonDisabled : {}),
    ...(!isLoading ? { ':hover': styles.submitButtonHover } : {}),
  });

  const getPasswordToggleStyle = () => ({
    ...styles.passwordToggle,
    ...(!isLoading ? { ':hover': styles.passwordToggleHover } : {}),
  });

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Banquet Billing System</h1>
          <p style={styles.subtitle}>Login in to access your dashboard</p>
        </div>

        {/* Form */}
        <div style={styles.formContainer}>
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Username Field */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <span>👤</span>
                Username
              </label>
              <div style={styles.inputWrapper}>
                <div style={styles.icon}>👤</div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={getInputStyle(username.trim().length > 0)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <span>🔒</span>
                Password
              </label>
              <div style={styles.inputWrapper}>
                <div style={styles.icon}>🔒</div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={getInputStyle(password.trim().length > 0)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={getPasswordToggleStyle()}
                  disabled={isLoading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={getSubmitButtonStyle()}
              disabled={isLoading}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 10px 20px rgba(79, 70, 229, 0.3)";
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {isLoading ? (
                <>
                  <div style={styles.loadingSpinner}></div>
                  Signing In...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input:focus {
          border-color: #4f46e5 !important;
          background: white !important;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
        }
        
        button[type="button"]:hover {
          background-color: #f3f4f6 !important;
          color: #4f46e5 !important;
        }
        
        a:hover {
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
};

export default LoginForm;