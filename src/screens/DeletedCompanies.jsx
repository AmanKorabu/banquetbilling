import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiRotateCcw } from "react-icons/fi";

const API = {
  getDeletedCompanies: (hotelId) =>
    `/banquetapi/get_deleted_comp.php?hotelid=${hotelId}&_=${Date.now()}`,
  deleteOrActive: (menuId, action) =>
    `/banquetapi/delete_or_active_comp.php?menu_id=${menuId}&action=${action}`,
};

const fetchWithTimeout = (url, options = {}, ms = 12000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
};

function DeletedCompanies() {
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState([]);
  const [hotelId, setHotelId] = useState(null);
  const navigate = useNavigate();

  // Get hotel_id from localStorage on component mount
  useEffect(() => {
    const storedHotelId = localStorage.getItem("hotel_id");
    if (storedHotelId) {
      setHotelId(storedHotelId);
    } else {
      toast.error("No hotel_id found. Please login again.");
    }
  }, []);

  const fetchDeleted = async () => {
    if (!hotelId) {
      toast.error("Hotel ID not available. Please login again.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetchWithTimeout(API.getDeletedCompanies(hotelId), {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      setDeleted(Array.isArray(data?.result) ? data.result : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load deleted companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) {
      fetchDeleted();
    }
  }, [hotelId]);

  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/company");

  const restore = async (row) => {
    if (!hotelId) {
      toast.error("Hotel ID not available. Please login again.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetchWithTimeout(
        API.deleteOrActive(row.MenuID, "active")
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Restored "${row.MenuName}"`);
      await fetchDeleted();
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore company.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading if hotelId is not yet available
  if (!hotelId) {
    return (
      <section className="company-page" style={pageStyles}>
        <div style={cardStyles.card}>
          <div style={headerStyles.wrap}>
            <h2 style={headerStyles.title}>Deleted Companies</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading hotel information...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="company-page" style={pageStyles}>
      <div style={cardStyles.card}>
        {/* Modern blue header (centered title) */}
        <div style={headerStyles.wrap}>
          <button onClick={goBack} aria-label="Back" style={headerStyles.backBtn}>
            ←
          </button>
          <h2 style={headerStyles.title}>Deleted Companies</h2>
        </div>

        <div style={contentSection}>
          <div style={sectionHeader}>
            <h4 style={sectionTitle}>Restore Deleted Companies</h4>
            {loading && <span style={loadingText}>Loading...</span>}
          </div>

          <div style={tableContainer}>
            <table style={tableStyles.table}>
              <colgroup>
                <col style={{ width: '60px' }} />
                <col />
                <col style={{ width: '120px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={tableStyles.thDark}>No</th>
                  <th style={tableStyles.thDark}>Name</th>
                  <th style={tableStyles.thFaint}></th>
                </tr>
              </thead>
              <tbody>
                {deleted.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={noDataCell}>
                      No deleted companies.
                    </td>
                  </tr>
                ) : (
                  deleted.map((c, idx) => (
                    <tr key={c.MenuID}>
                      <td style={tableStyles.tdNo}>{idx + 1}</td>
                      <td style={tableStyles.tdName}>
                        <span style={tableStyles.nameText}>{c.MenuName}</span>
                      </td>
                      <td style={tableStyles.iconCell}>
                        <button
                          onClick={() => restore(c)}
                          title="Restore"
                          aria-label="Restore"
                          disabled={loading}
                          style={restoreBtn}
                        >
                          <FiRotateCcw />
                          <span style={{ marginLeft: 6 }}>Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DeletedCompanies;

/* ---------- RESPONSIVE STYLES (consistent with Company component) ---------- */

const pageStyles = {
  position: "relative",
  padding: "16px",
  minHeight: "100vh",
  background: "#f8fafc"
};

/* Card */
const cardStyles = {
  card: {
    margin: "0 auto",
    maxWidth: "980px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 10px 24px rgba(2, 6, 23, 0.06)",
    padding: "16px",
    width: "100%",
    boxSizing: "border-box"
  },
};

/* Header (blue, centered) */
const headerStyles = {
  wrap: {
    position: "relative",
    borderRadius: 12,
    background: "linear-gradient(135deg, #186040ff 0%, #125831ff 50%, #186a48ff 100%)",
    padding: "14px 48px",
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    margin: 0,
    color: "#ffffff",
    fontWeight: 800,
    letterSpacing: "0.2px",
    fontSize: "18px",
    textAlign: "center"
  },
  backBtn: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.15)",
    width: "40px",
    height: "40px",
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    fontSize: "20px",
    fontWeight: 700,
    color: "#ffffff",
    backdropFilter: "blur(4px)",
  },
};

const contentSection = {
  borderTop: "1px solid #e5e7eb",
  marginTop: "10px",
  paddingTop: "10px"
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px"
};

const sectionTitle = {
  margin: 0,
  fontWeight: 700,
  color: "#0f172a",
  fontSize: "16px"
};

const loadingText = {
  fontSize: "12px",
  color: "#64748b"
};

const tableContainer = {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch"
};

const noDataCell = {
  color: "#6b7280",
  padding: "14px 12px",
  textAlign: "center"
};

/* Table */
const cellBase = {
  padding: "12px 14px",
  borderBottom: "1px solid #bfc1c3ff",
  verticalAlign: "middle",
  fontSize: "14px"
};

const tableStyles = {
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    tableLayout: "fixed",
    background: "#fff",
    border: "1px solid #838486ff",
    borderRadius: 12,
    overflow: "hidden",
    minWidth: "500px"
  },
  thDark: {
    ...cellBase,
    background: "#eaf2ff",
    color: "#0f172a",
    fontWeight: 800,
    textAlign: "left",
    fontSize: "14px"
  },
  thFaint: {
    ...cellBase,
    background: "#f1f5ff",
    color: "#64748b",
    textAlign: "center",
    fontSize: "14px"
  },
  tdNo: {
    ...cellBase,
    color: "#111827",
    fontWeight: 400,
    textAlign: "center"
  },
  tdName: {
    ...cellBase,
    color: "#111827",
    fontWeight: 400
  },
  iconCell: {
    ...cellBase,
    textAlign: "center",
    color: "#6b7280",
    padding: "8px 6px"
  },
  nameText: {
    display: "inline-block",
    maxWidth: "100%",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontWeight: 400
  },
};

/* Restore Button */
const restoreBtn = {
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  padding: "6px 12px",
  borderRadius: 10,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 36,
  maxWidth: "100%",
  color: "#065f46",
  fontWeight: 600,
  whiteSpace: "nowrap",
  wordBreak: "keep-all",
  overflowWrap: "normal",
  fontSize: "14px",
  transition: "all 0.2s ease",
  ':disabled': {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  ':hover:not(:disabled)': {
    background: "#f0fdf4",
    borderColor: "#065f46",
  }
};

// Add media queries for responsive behavior
const styles = `
@media (max-width: 768px) {
  .company-page {
    padding: 12px 8px !important;
  }
  
  .card {
    padding: 12px !important;
    border-radius: 12px !important;
  }
  
  .header-wrap {
    padding: 12px 40px !important;
  }
  
  .header-title {
    font-size: 16px !important;
  }
  
  .back-btn {
    width: 36px !important;
    height: 36px !important;
    font-size: 18px !important;
  }
  
  .table {
    min-width: 400px !important;
    font-size: 13px !important;
  }
  
  .cell-base {
    padding: 10px 8px !important;
    font-size: 13px !important;
  }
  
  .restore-btn {
    padding: 4px 8px !important;
    height: 32px !important;
    font-size: 13px !important;
  }
}

@media (max-width: 480px) {
  .company-page {
    padding: 8px 4px !important;
  }
  
  .card {
    padding: 10px !important;
    border-radius: 10px !important;
  }
  
  .header-wrap {
    padding: 10px 36px !important;
    margin-bottom: 8px !important;
  }
  
  .header-title {
    font-size: 15px !important;
  }
  
  .section-title {
    font-size: 15px !important;
  }
  
  .restore-btn span {
    margin-left: 4px !important;
    font-size: 12px !important;
  }
  
  .restore-btn {
    padding: 4px 6px !important;
    height: 30px !important;
  }
}

.restore-btn:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

.restore-btn:hover:not(:disabled) {
  background: #f0fdf4 !important;
  border-color: #065f46 !important;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}