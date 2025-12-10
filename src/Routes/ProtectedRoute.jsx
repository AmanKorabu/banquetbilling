// ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ProtectedRoute = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      toast.error("❌ Please login first",{toastId:'login-error'});
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
    } else {
      setCheckingAuth(false);
    }
  }, [navigate]);

  // ✅ Prevent rendering until auth check completes
  if (checkingAuth) return null;

  return children;
};

export default ProtectedRoute;
