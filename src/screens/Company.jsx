import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

// ====== CONFIG ======
const USER_ID = 1;

const API = {
    // 1) Active companies
    getCompanies: (hotelId) =>
        `/banquetapi/get_all_comp.php?hotelid=${hotelId}&_=${Date.now()}`,
    // 4) Company details (EXACT endpoint)
    getCompanyDetails: (companyId) =>
        `/banquetapi/get_comp_details.php?company_id=${companyId}&_=${Date.now()}`,
    // 3) Save company (EXACT POST spellings)
    saveCompany: '/banquetapi/save_company2.php',
    // 5) Modify company (EXACT POST spellings)
    modifyCompany: '/banquetapi/modify_company.php',
    // 6) Soft delete / active toggle (uses menu_id + action)
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

// ====== FORM STATE ======
const initialForm = {
    companyName: "",
    gst: "",
    countryCode: "+91",
    phone: "",
    address1: "",
    address2: "",
    zip: "",
    email: "",
};

// ====== HELPERS ======
const parsePhone = (full) => {
    if (!full) return { countryCode: "+91", phone: "" };
    const s = String(full).replace(/[^\d+]/g, "");
    const m = s.match(/^\+(\d{1,3})(.*)$/);
    if (m) {
        const cc = `+${m[1]}`;
        const local = (m[2] || "").replace(/\D/g, "");
        return { countryCode: cc, phone: local };
    }
    return { countryCode: "+91", phone: s.replace(/\D/g, "") };
};

/**
 * STRICT mapping using ONLY these keys returned by details API:
 * Name, ContactNo, AddressLine1, AddressLine2, GSTNo, Email, ZipCode
 */
const normalizeFromExactKeys = (raw, fallbackName = "") => {
    const result = Array.isArray(raw?.result) ? raw.result[0] : raw?.result || {};

    const companyName = result?.Name ?? fallbackName;
    const { countryCode, phone } = parsePhone(result?.ContactNo);

    return {
        companyName: companyName ?? "",
        gst: result?.GSTNo ?? "",
        countryCode,
        phone,
        address1: (result?.AddressLine1 ?? "").toString(),
        // AddressLine2 may include \n — flatten to space for input/textarea
        address2: (result?.AddressLine2 ?? "").toString().replace(/\r?\n/g, " "),
        zip: result?.ZipCode ?? "",
        email: result?.Email ?? "",
    };
};

// ====== MODAL ======
function Modal({ open, onClose, titleId, children }) {
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return ReactDOM.createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={onClose}
            style={modalStyles.container}
        >
            <div style={modalStyles.card} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    );
}

// ====== MAIN ======
function Company() {
    const [mode, setMode] = useState("home"); // 'home' | 'form'
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [editingId, setEditingId] = useState(null); // company_id used for modify
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [hotelId, setHotelId] = useState(null); // Dynamic hotel ID
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

    const goBack = () => {
        if (window.history.length > 1) navigate(-1);
        else navigate("/");
    };

    // === 1) LIST ACTIVE COMPANIES ===
    const fetchCompanies = async () => {
        if (!hotelId) {
            toast.error("Hotel ID not available. Please login again.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetchWithTimeout(API.getCompanies(hotelId), {
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json().catch(() => ({}));
            setCompanies(Array.isArray(data?.result) ? data.result : []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load companies.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mode === "home" && hotelId) {
            fetchCompanies();
        }
    }, [mode, hotelId]);

    // === 4) EDIT: FETCH DETAILS ===
    const EditData = async (row) => {
        if (!hotelId) {
            toast.error("Hotel ID not available. Please login again.");
            return;
        }

        const companyId = String(row.MenuID); // use MenuID as company_id
        setEditingId(companyId);
        setLoading(true);
        try {
            const url = API.getCompanyDetails(companyId); // ?company_id=<id>
            const res = await fetchWithTimeout(url, { cache: "no-store" });

            const rawText = await res.text();
            if (!res.ok) {
                console.warn("Details error:", rawText);
                throw new Error(`HTTP ${res.status}`);
            }

            let parsed;
            try {
                parsed = JSON.parse(rawText);
            } catch {
                // graceful fallback: show only the name so the user can still edit
                parsed = { result: [{ Name: row.MenuName || "" }] };
            }

            const next = normalizeFromExactKeys(parsed, row.MenuName || "");
            setForm(next);
            setMode("form");
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch company details.");
            // fallback: open form with just name so user can proceed
            setForm((p) => ({ ...p, companyName: row.MenuName || "" }));
            setMode("form");
        } finally {
            setLoading(false);
        }
    };

    // === 6) SOFT DELETE ===
    const openDelete = (c) => setDeleteTarget(c);
    const closeDelete = () => setDeleteTarget(null);

    const DeleteData = async () => {
        if (!deleteTarget || !hotelId) return;
        try {
            setLoading(true);
            const res = await fetchWithTimeout(
                API.deleteOrActive(deleteTarget.MenuID, "delete")
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            toast.success(`Deleted "${deleteTarget.MenuName}"`);
            closeDelete();
            await fetchCompanies();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete company.");
        } finally {
            setLoading(false);
        }
    };

    // === 3 & 5) SAVE / MODIFY ===
    const SaveData = async (e) => {
        e.preventDefault();

        if (!hotelId) {
            toast.error("Hotel ID not available. Please login again.");
            return;
        }

        // Build contact number with country code
        const mobile1 = `${form.countryCode}${form.phone}`.trim();

        // ✅ Send BOTH: legacy keys (docs) + new keys (Name, ContactNo, ...)
        const payloadCommon = {
            // required meta
            hotel_id: String(hotelId), // Use dynamic hotelId
            user_id: String(USER_ID),

            // ----- legacy keys from docs (keep!) -----
            comp_name: form.companyName,
            gst_no: form.gst,
            mobile1, // same value as ContactNo
            email1: form.email,
            addrerss1: form.address1, // doc typo expected by some endpoints
            addrerss2: form.address2,
            zip: form.zip,

            // ----- NEW exact spellings you asked for -----
            Name: form.companyName,
            GSTNo: form.gst,
            ContactNo: mobile1,
            Email: form.email,
            AddressLine1: form.address1,
            AddressLine2: form.address2,
            ZipCode: form.zip,
        };

        const isEditing = !!editingId;
        const endpoint = isEditing ? API.modifyCompany : API.saveCompany;

        // modify requires company_id (per docs)
        const body = new URLSearchParams(
            isEditing ? { company_id: String(editingId), ...payloadCommon } : payloadCommon
        );

        try {
            setLoading(true);
            const res = await fetchWithTimeout(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                },
                body,
            });

            let resultMsg = "";
            try {
                const data = await res.json();
                resultMsg = JSON.stringify(data);
            } catch {
                resultMsg = await res.text();
            }

            if (!res.ok) {
                console.error("Save/Modify error:", resultMsg);
                throw new Error("Failed to persist company");
            }

            toast.success(isEditing ? "Company updated" : "Company saved");

            // reset
            setForm(initialForm);
            setEditingId(null);

            // refresh list (cache-busted) so the new record shows immediately
            await fetchCompanies();
            setMode("home");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save company.");
        } finally {
            setLoading(false);
        }
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    // Show loading if hotelId is not yet available
    if (!hotelId) {
        return (
            <section className="company-page" style={pageStyles}>
                <div style={cardStyles.card}>
                    <div style={headerStyles.wrap}>
                        <h2 style={headerStyles.title}>Company</h2>
                    </div>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Loading hotel information...</p>
                    </div>
                </div>
            </section>
        );
    }

    // ---- HOME ----
    if (mode === "home") {
        return (
            <section className="company-page" style={pageStyles}>
                <div style={cardStyles.card}>
                    {/* Modern blue header (centered title) */}
                    <div style={headerStyles.wrap}>
                        <button onClick={goBack} aria-label="Back" style={headerStyles.backBtn}>
                            ←
                        </button>
                        <h2 style={headerStyles.title}>Company</h2>
                    </div>

                    <div className="company-actions" style={actionsStyles}>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setEditingId(null);
                                setForm(initialForm);
                                setMode("form");
                            }}
                            disabled={loading}
                            style={buttonStyles.primary}
                        >
                            New
                        </button>
                        <button
                            className="btn btn-ghost"
                            onClick={() => navigate("/deleted-company")}
                            disabled={loading}
                            style={buttonStyles.ghost}
                        >
                            View Deleted
                        </button>
                    </div>

                    <div style={contentSection}>
                        <div style={sectionHeader}>
                            <h4 style={sectionTitle}>Active Companies</h4>
                            {loading && <span style={loadingText}>Loading...</span>}
                        </div>

                        <div style={tableContainer}>
                            <table style={tableStyles.table}>
                                <colgroup>
                                    <col style={{ width: '60px' }} />
                                    <col />
                                    <col style={{ width: '70px' }} />
                                    <col style={{ width: '70px' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={tableStyles.thDark}>No</th>
                                        <th style={tableStyles.thDark}>Name</th>
                                        <th style={tableStyles.thFaint}></th>
                                        <th style={tableStyles.thFaint}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={noDataCell}>
                                                No companies found.
                                            </td>
                                        </tr>
                                    ) : (
                                        companies.map((c, idx) => (
                                            <tr key={c.MenuID}>
                                                <td style={tableStyles.tdNo}>{idx + 1}</td>
                                                <td style={tableStyles.tdName}>
                                                    <span style={tableStyles.nameText}>{c.MenuName}</span>
                                                </td>
                                                <td style={tableStyles.iconCell}>
                                                    <button
                                                        aria-label="Modify"
                                                        title="Modify"
                                                        onClick={() => EditData(c)}
                                                        style={iconBtn}
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                </td>
                                                <td style={tableStyles.iconCell}>
                                                    <button
                                                        aria-label="Delete"
                                                        title="Delete"
                                                        onClick={() => openDelete(c)}
                                                        style={{ ...iconBtn, color: "#b91c1c" }}
                                                    >
                                                        <FiTrash2 />
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

                {/* Delete Confirm Modal */}
                <Modal open={!!deleteTarget} onClose={closeDelete} titleId="del-title">
                    <h3 id="del-title" style={modalStyles.title}>Delete Company</h3>
                    <p style={modalStyles.copy}>
                        Are you sure you want to delete{" "}
                        <strong style={{ color: "#111827" }}>{deleteTarget?.MenuName}</strong>?
                    </p>
                    <div style={modalStyles.actions}>
                        <button onClick={closeDelete} style={modalStyles.btnGhost}>Cancel</button>
                        <button onClick={DeleteData} style={modalStyles.btnDanger}>Delete</button>
                    </div>
                </Modal>
            </section>
        );
    }

    // ---- FORM ----
    return (
        <section className="company-page" style={pageStyles}>
            <div style={cardStyles.card}>
                {/* Modern blue header (centered title) */}
                <div style={headerStyles.wrap}>
                    <button
                        className="btn-back"
                        onClick={() => {
                            setEditingId(null);
                            setForm(initialForm);
                            setMode("home");
                        }}
                        aria-label="Back"
                        style={headerStyles.backBtn}
                    >
                        ←
                    </button>
                    <h3 style={headerStyles.title}>{editingId ? "Edit Company" : "Add Company"}</h3>
                </div>

                <form onSubmit={SaveData} style={formGrid}>
                    <label style={field}>
                        <span style={label}>Enter Company Name</span>
                        <input
                            style={inputBox}
                            name="companyName"
                            value={form.companyName}
                            onChange={onChange}
                            required
                            placeholder="e.g., Xpress Hotels Pvt Ltd"
                        />
                    </label>

                    <label style={field}>
                        <span style={label}>GST Number</span>
                        <input
                            style={inputBox}
                            name="gst"
                            value={form.gst}
                            onChange={onChange}
                            placeholder="27ABCDE1234F1Z5"
                        />
                    </label>

                    <label style={{ ...field, gridColumn: "1 / -1" }}>
                        <span style={label}>Enter Contact Number</span>
                        <div style={phoneRow}>
                            <select
                                name="countryCode"
                                value={form.countryCode}
                                onChange={onChange}
                                style={{ ...inputBox, width: '100%' }}
                            >
                                <option value="+91">+91</option>
                                <option value="+1">+1</option>
                                <option value="+44">+44</option>
                                <option value="+61">+61</option>
                            </select>
                            <input
                                style={{ ...inputBox, flex: 1 }}
                                name="phone"
                                value={form.phone}
                                onChange={onChange}
                                inputMode="numeric"
                                placeholder="9876543210"
                            />
                        </div>
                    </label>

                    <label style={{ ...field, gridColumn: "1 / -1" }}>
                        <span style={label}>Address Line 1</span>
                        <input
                            style={inputBox}
                            name="address1"
                            value={form.address1}
                            onChange={onChange}
                            placeholder="Street, building"
                        />
                    </label>

                    {/* Use a textarea to match your "text area border dark blue" ask */}
                    <label style={{ ...field, gridColumn: "1 / -1" }}>
                        <span style={label}>Address Line 2</span>
                        <textarea
                            style={{ ...inputBox, minHeight: 72, paddingTop: 10, paddingBottom: 10, resize: "vertical" }}
                            name="address2"
                            value={form.address2}
                            onChange={onChange}
                            placeholder="Area, landmark"
                            rows={3}
                        />
                    </label>

                    <label style={field}>
                        <span style={label}>Zipcode</span>
                        <input
                            style={inputBox}
                            name="zip"
                            value={form.zip}
                            onChange={onChange}
                            placeholder="400001"
                        />
                    </label>

                    <label style={field}>
                        <span style={label}>Enter Email</span>
                        <input
                            style={inputBox}
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={onChange}
                            placeholder="info@company.com"
                        />
                    </label>

                    <div style={actionsRow}>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null);
                                setForm(initialForm);
                                setMode("home");
                            }}
                            disabled={loading}
                            style={buttonStyles.ghost}
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} style={buttonStyles.primary}>
                            {loading ? (editingId ? "Updating..." : "Saving...") : editingId ? "Update" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default Company;

/* ---------- RESPONSIVE STYLES ---------- */

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

/* Actions */
const actionsStyles = {
    marginBottom: "14px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
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

/* Inputs / Textarea — dark blue borders */
const inputBox = {
    width: "100%",
    height: "44px",
    borderRadius: 10,
    border: "1.5px solid #0b2dd7ff",
    padding: "0 12px",
    outline: "none",
    fontSize: "15px",
    color: "#0f172a",
    background: "#ffffff",
    boxShadow: "0 1px 0 rgba(2,6,23,0.02)",
    boxSizing: "border-box"
};

const formGrid = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "14px",
    '@media (min-width: 768px)': {
        gridTemplateColumns: "1fr 1fr"
    }
};

const field = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0
};

const label = {
    fontSize: "13px",
    fontWeight: 700,
    color: "#0f172a"
};

const phoneRow = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    '@media (min-width: 480px)': {
        gridTemplateColumns: "120px 1fr"
    }
};

const actionsRow = {
    gridColumn: "1 / -1",
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "4px",
    borderTop: "1px solid #eef0f3",
    paddingTop: "10px",
    flexWrap: "wrap"
};

/* Buttons */
const buttonStyles = {
    primary: {
        background: "#166442ff",
        color: "#ffffff",
        border: "1px solid #154328ff",
        height: "42px",
        padding: "10px 16px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 700,
        fontSize: "14px",
        minWidth: "80px"
    },
    ghost: {
        background: "#f1f5f9",
        color: "#0f172a",
        border: "1px solid #e2e8f0",
        height: "42px",
        padding: "10px 16px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "14px",
        minWidth: "80px"
    },
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
    // Headers bold with blue background
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
    // Rows normal
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

const iconBtn = {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    width: "36px",
    height: "36px",
    borderRadius: 10,
    display: "inline-grid",
    placeItems: "center",
    cursor: "pointer",
    color: "#374151",
    fontSize: "14px"
};

/* Modal */
const modalStyles = {
    container: {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(2, 6, 23, 0.45)",
        padding: "16px",
    },
    card: {
        width: "min(92vw, 480px)",
        background: "#ffffff",
        border: "1px solid #bbbbc3ff",
        borderRadius: 16,
        boxShadow: "0 20px 30px rgba(2,6,23,.10)",
        padding: "20px",
        margin: "16px"
    },
    title: {
        margin: 0,
        fontSize: "18px",
        color: "#111827",
        fontWeight: 800
    },
    copy: {
        margin: "10px 0 18px",
        color: "#374151",
        lineHeight: 1.5,
        fontSize: "14px"
    },
    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "8px",
        flexWrap: "wrap"
    },
    btnGhost: {
        border: "1px solid #e5e7eb",
        background: "#fff",
        padding: "8px 14px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "14px",
        minWidth: "70px"
    },
    btnDanger: {
        border: "1px solid #b91c1c",
        background: "#b91c1c",
        color: "#fff",
        padding: "8px 14px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 700,
        fontSize: "14px",
        minWidth: "70px"
    },
};

// Add media queries for responsive behavior
const styles = `
@media (max-width: 768px) {
    .company-page {
        padding: 12px 8px !important;
    }
    
    .company-card {
        padding: 12px !important;
        border-radius: 12px !important;
    }
    
    .company-header {
        padding: 12px 40px !important;
    }
    
    .company-title {
        font-size: 16px !important;
    }
    
    .company-back-btn {
        width: 36px !important;
        height: 36px !important;
        font-size: 18px !important;
    }
    
    .company-form-grid {
        gap: 12px !important;
    }
    
    .company-input {
        height: 42px !important;
        font-size: 14px !important;
    }
    
    .company-table {
        min-width: 400px !important;
        font-size: 13px !important;
    }
    
    .company-cell {
        padding: 10px 8px !important;
        font-size: 13px !important;
    }
}

@media (max-width: 480px) {
    .company-page {
        padding: 8px 4px !important;
    }
    
    .company-card {
        padding: 10px !important;
        border-radius: 10px !important;
    }
    
    .company-header {
        padding: 10px 36px !important;
        margin-bottom: 8px !important;
    }
    
    .company-title {
        font-size: 15px !important;
    }
    
    .company-actions {
        flex-direction: column;
        gap: 8px !important;
    }
    
    .company-btn-primary,
    .company-btn-ghost {
        width: 100% !important;
        height: 40px !important;
    }
    
    .company-actions-row {
        flex-direction: column;
        gap: 8px !important;
    }
    
    .company-phone-row {
        grid-template-columns: 1fr !important;
        gap: 8px !important;
    }
    
    .company-modal-actions {
        flex-direction: column;
    }
    
    .company-modal-btn-ghost,
    .company-modal-btn-danger {
        width: 100% !important;
    }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}