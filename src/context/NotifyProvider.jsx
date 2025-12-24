import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Snackbar, Alert, Slide } from "@mui/material";

const NotifyContext = createContext(null);

function SlideDown(props) {
  return <Slide {...props} direction="down" />;
}

export function NotifyProvider({ children }) {
  const queueRef = useRef([]);
  const idRef = useRef(1);

  const [snack, setSnack] = useState({
    open: false,
    key: 0,
    message: "",
    severity: "info", // 'success' | 'error' | 'warning' | 'info'
    duration: 3000,
  });

  const show = useCallback((message, options = {}) => {
    const payload = {
      key: idRef.current++,
      message: String(message ?? ""),
      severity: options.severity || "info",
      duration: typeof options.duration === "number" ? options.duration : 3000,
    };

    setSnack((prev) => {
      // If already showing a snackbar -> queue it, keep current running
      if (prev.open) {
        queueRef.current.push(payload);
        return prev;
      }

      // Otherwise show immediately
      return { open: true, ...payload };
    });
  }, []);

  const api = useMemo(
    () => ({
      show,
      success: (msg, opt) => show(msg, { ...opt, severity: "success" }),
      error: (msg, opt) => show(msg, { ...opt, severity: "error" }),
      warning: (msg, opt) => show(msg, { ...opt, severity: "warning" }),
      info: (msg, opt) => show(msg, { ...opt, severity: "info" }),
    }),
    [show]
  );

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  const handleExited = () => {
    const next = queueRef.current.shift();
    if (next) {
      setSnack({ open: true, ...next });
    }
  };

  return (
    <NotifyContext.Provider value={api}>
      {children}

      <Snackbar
        key={snack.key}
        open={snack.open}
        autoHideDuration={snack.duration}
        onClose={handleClose}
        TransitionComponent={SlideDown}
        TransitionProps={{ onExited: handleExited }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 99999 }}
      >
        <Alert
          onClose={handleClose}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%", fontSize: 14 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyContext);

  // ✅ No crash: fallback (so app never breaks)
  if (!ctx) {
    console.warn("⚠️ useNotify() called outside <NotifyProvider>. Add NotifyProvider in main.jsx.");
    const noop = () => {};
    return {
      show: console.log,
      success: console.log,
      info: console.log,
      warning: console.warn,
      error: console.error,
      close: noop,
    };
  }

  return ctx;
}
