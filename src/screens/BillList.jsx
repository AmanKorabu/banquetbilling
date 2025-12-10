import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {
    FaEye,
    FaEdit,
    FaTrash,
    FaFileInvoice,
    FaPlus,
    FaFilter,
    FaCalendarAlt,
    FaRupeeSign,
    FaSync,
    FaTimes,
    FaUser,
    FaBuilding,
    FaReceipt,
    FaCheckCircle,
    FaClock,
    FaListAlt,
    FaCalculator,
    FaChartBar,
    FaMoneyBillWave,
} from "react-icons/fa";
import Header from "./Header";
import { VscArrowLeft } from "react-icons/vsc";
import useEscapeNavigate from "../hooks/EscapeNavigate";

const BillList = () => {
    useEscapeNavigate('/dashboard')
    
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Initialize dates from localStorage or use today's date for first visit
    const [fromDate, setFromDate] = useState(() => {
        const savedFromDate = localStorage.getItem('billList_fromDate');
        return savedFromDate ? dayjs(savedFromDate) : dayjs();
    });

    const [toDate, setToDate] = useState(() => {
        const savedToDate = localStorage.getItem('billList_toDate');
        return savedToDate ? dayjs(savedToDate) : dayjs();
    });

    const location = useLocation();

    // Date Validation State
    const [dateValidation, setDateValidation] = useState({
        isValid: true,
        error: null
    });

    // Financial Summary State
    const [showFinancialSummary, setShowFinancialSummary] = useState(false);

    // Delete Confirmation Popup State
    const [deletePopup, setDeletePopup] = useState({
        isOpen: false,
        bill: null,
        reason: "",
        loading: false
    });

    // Save dates to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('billList_fromDate', fromDate.format('YYYY-MM-DD'));
        localStorage.setItem('billList_toDate', toDate.format('YYYY-MM-DD'));
    }, [fromDate, toDate]);

    // Date validation function
    const validateDateRange = useCallback((from, to) => {
        if (!from || !to) return { isValid: true };

        const fromDate = dayjs(from);
        const toDate = dayjs(to);

        const isValid = toDate.isAfter(fromDate) || toDate.isSame(fromDate, 'day');

        return {
            isValid,
            error: isValid ? null : "To date cannot be earlier than From date"
        };
    }, []);

    // Enhanced date change handlers with validation AND state preservation
    const handleFromDateChange = useCallback((newDate) => {
        setFromDate(newDate);

        // Validate immediately when from date changes
        const validation = validateDateRange(newDate, toDate);
        setDateValidation(validation);

        // If to date is now before from date, adjust to date
        if (!validation.isValid) {
            const adjustedToDate = newDate;
            setToDate(adjustedToDate);
        }
    }, [toDate, validateDateRange]);

    const handleToDateChange = useCallback((newDate) => {
        setToDate(newDate);

        // Validate immediately when to date changes
        const validation = validateDateRange(fromDate, newDate);
        setDateValidation(validation);
    }, [fromDate, validateDateRange]);

    // Validate dates whenever they change
    useEffect(() => {
        const validation = validateDateRange(fromDate, toDate);
        setDateValidation(validation);
    }, [fromDate, toDate, validateDateRange]);

    // Fetch bills from API - UPDATED with validation check
    const fetchBills = async () => {
        // Don't fetch if date range is invalid
        if (!dateValidation.isValid) {
            toast.error(`⚠️ ${dateValidation.error}`, {
                theme: "colored"
            });
            return;
        }

        setLoading(true);
        try {
            const hotelId = localStorage.getItem("hotel_id") || "290";
            const fromDateStr = fromDate.format("YYYY-MM-DD");
            const toDateStr = toDate.format("YYYY-MM-DD");

            const apiUrl = `/banquetapi/get_bill_list2.php?hotel_id=${hotelId}&fromdate=${fromDateStr}&todate=${toDateStr}&venue_id=0&comp_id=0&party_id=0`;

            console.log("📡 Fetching bills from:", apiUrl);

            const response = await fetch(apiUrl);
            const data = await response.json();

            console.log("📦 API Response:", data);

            if (data && data.result && Array.isArray(data.result)) {
                const transformedBills = data.result.map((bill, index) => ({
                    id: bill.QuotationId || index + 1,
                    quotationId: bill.QuotationId || "",
                    quotationNo: bill.QuotationNo || "",
                    quotationDate: bill.QuotationDate || "",
                    partyName: bill.PartyName || "N/A",
                    functionName: bill.FunctionName || "N/A",
                    status: bill.Status || "PENDING",
                    invoiceId: bill.InvoiceId || "N/A",
                    billAmount: bill.BillAmount || "0.00",
                    billingCompany: bill.BillingCompany || "N/A",
                    receivedAmount: bill.ReceivedAmount || "0.00",
                    discount: bill.Discount || "0.00",
                    tds: bill.TDS || "0.00",
                    balance: (
                        parseFloat(bill.BillAmount || 0) -
                        parseFloat(bill.ReceivedAmount || 0)
                    ).toFixed(2),
                }));

                console.log("🔄 Transformed bills:", transformedBills);
                setBills(transformedBills);
                // toast.success(`Loaded ${transformedBills.length} bills`, { toastId: "bill-loaded" });
            } else {
                console.warn("⚠️ Unexpected API response format:", data);
                setBills([]);
                toast.info("No bills found for selected dates", { toastId: "info-bill" });
            }
        } catch (error) {
            console.error("❌ Error fetching bills:", error);
            toast.error("Failed to load bills", { toastId: "failed-bill" });
            setBills([]);
        } finally {
            setLoading(false);
        }
    };

    // Update the useEffect to include dateValidation dependency
    useEffect(() => {
        // Only fetch if date range is valid
        if (dateValidation.isValid) {
            fetchBills();
        }
    }, [fromDate, toDate, location.key, dateValidation.isValid]);

    // Reset dates to today
    const resetDatesToToday = () => {
        const today = dayjs();
        setFromDate(today);
        setToDate(today);
        toast.info("Dates reset to today", { toastId: 'date-reset' });
    };

    // Filter bills based on search and status
    const filteredBills = useMemo(() => {
        return bills.filter(bill => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                bill.partyName.toLowerCase().includes(term) ||
                bill.quotationNo.toLowerCase().includes(term) ||
                bill.functionName.toLowerCase().includes(term) ||
                bill.billingCompany.toLowerCase().includes(term) ||
                bill.invoiceId.toLowerCase().includes(term);

            const matchesStatus =
                statusFilter === "all" ||
                (bill.status && bill.status.toLowerCase() === statusFilter.toLowerCase());

            return matchesSearch && matchesStatus;
        });
    }, [bills, searchTerm, statusFilter]);

    // Calculate financial summary using useMemo for performance
    const financialSummary = useMemo(() => {
        const summary = {
            totalBills: filteredBills.length,
            totalBillAmount: 0,
            totalReceivedAmount: 0,
            totalDiscount: 0,
            totalTDS: 0,
            totalBalance: 0,
            averageBillAmount: 0,
            statusBreakdown: {},
            currencyFormat: 'en-IN'
        };

        filteredBills.forEach(bill => {
            const amount = parseFloat(bill.billAmount) || 0;
            const received = parseFloat(bill.receivedAmount) || 0;
            const discount = parseFloat(bill.discount) || 0;
            const tds = parseFloat(bill.tds) || 0;
            const balance = parseFloat(bill.balance) || 0;

            summary.totalBillAmount += amount;
            summary.totalReceivedAmount += received;
            summary.totalDiscount += discount;
            summary.totalTDS += tds;
            summary.totalBalance += balance;

            // Status breakdown
            const status = bill.status?.toLowerCase() || 'unknown';
            if (!summary.statusBreakdown[status]) {
                summary.statusBreakdown[status] = {
                    count: 0,
                    totalAmount: 0,
                    totalReceived: 0
                };
            }
            summary.statusBreakdown[status].count++;
            summary.statusBreakdown[status].totalAmount += amount;
            summary.statusBreakdown[status].totalReceived += received;
        });

        summary.averageBillAmount = summary.totalBills > 0
            ? summary.totalBillAmount / summary.totalBills
            : 0;

        return summary;
    }, [filteredBills]);

    // Handle Status Filter Click
    const handleStatusFilter = (status) => {
        setStatusFilter(status);
    };

    // Handle Preview Button Click
    const handlePreview = (bill) => {
        navigate("/bill-preview", {
            state: {
                quotationId: bill.quotationId,
                invoiceId: bill.invoiceId,
                billAmount: bill.billAmount,
                receivedAmount: bill.receivedAmount,
                discount: bill.discount,
                tds: bill.tds,
                balance: bill.balance,
            },
        });
    };

    const navigateDeleteBill = () => {
        navigate("/deleted-bills");
    };

    // Open Delete Confirmation Popup
    const openDeletePopup = (bill) => {
        setDeletePopup({
            isOpen: true,
            bill: bill,
            reason: "",
            loading: false,
        });
    };

    // Close Delete Confirmation Popup
    const closeDeletePopup = () => {
        setDeletePopup({
            isOpen: false,
            bill: null,
            reason: "",
            loading: false,
        });
    };

    // Handle Delete Confirmation - FINAL FIX (optimistic delete + rollback)
    const handleDeleteConfirm = async () => {
        if (!deletePopup.bill || deletePopup.reason.trim().length < 3) return;

        const billToDelete = deletePopup.bill;

        // 🔥 1) Optimistically remove the bill from UI immediately
        setBills((prevBills) =>
            prevBills.filter(
                (b) => String(b.quotationId) !== String(billToDelete.quotationId)
            )
        );

        // show loading state only on popup button
        setDeletePopup((prev) => ({ ...prev, loading: true }));

        try {
            const apiUrl = `/banquetapi/delete_or_active_inv.php?quot_id=${billToDelete.quotationId}&action=delete&cancel_reason=${encodeURIComponent(
                deletePopup.reason
            )}`;

            console.log("🗑️ Deleting bill with URL:", apiUrl);

            const response = await fetch(apiUrl, {
                method: "GET", // API uses GET
            });

            const result = await response.text();
            console.log("✅ Delete response:", result);

            if (!response.ok) {
                throw new Error("Failed to delete bill");
            }

            toast.success("Bill deleted successfully!", { toastId: "delete-success" });
            // list already updated by optimistic delete
            closeDeletePopup();
        } catch (error) {
            console.error("❌ Delete error:", error);
            toast.error("Failed to delete bill", { toastId: "delete-failed" });

            // 🔁 2) Rollback: put the bill back if delete failed
            setBills((prevBills) => {
                const alreadyThere = prevBills.some(
                    (b) => String(b.quotationId) === String(billToDelete.quotationId)
                );
                if (alreadyThere) return prevBills;
                return [...prevBills, billToDelete];
            });

            setDeletePopup((prev) => ({ ...prev, loading: false }));
        }
    };

    // Handle New Bill
    const handleNewBill = () => {
        navigate("/new-booking", {
            state: {
                mode: "create",
            },
        });
    };

    const handleBillEdit = (bill) => {
        const hotelId = localStorage.getItem("hotel_id");

        const cleanInvoiceId =
            bill.invoiceId && bill.invoiceId !== "N/A" ? bill.invoiceId : undefined;

        // This is the human-readable invoice no you show in the list
        const displayInvoiceNo = bill.quotationNo || cleanInvoiceId;

        navigate("/new-booking", {
            state: {
                mode: "edit",
                quotationMeta: {
                    hotel_id: hotelId,
                    quot_id: bill.quotationId,

                    // keep existing fields
                    quotation_no: bill.quotationNo,
                    party_name: bill.partyName,
                    bill_id: cleanInvoiceId,

                    // 👇 NEW: this is what NewBooking header prefers
                    invoice_no: displayInvoiceNo,
                },
            },
        });
    };

    // Handle Refresh
    const handleRefresh = () => {
        fetchBills();
    };

    // Get status color and icon
    const getStatusConfig = (status) => {
        if (!status)
            return {
                color: "#6b7280",
                bgColor: "#f9fafb",
                borderColor: "#d1d5db",
                icon: FaListAlt,
            };

        switch (status.toLowerCase()) {
            case "confirmed":
                return {
                    color: "#10b981",
                    bgColor: "#ecfdf5",
                    borderColor: "#a7f3d0",
                    icon: FaCheckCircle,
                };
            case "waitlisted":
                return {
                    color: "#f59e0b",
                    bgColor: "#fffbeb",
                    borderColor: "#fed7aa",
                    icon: FaClock,
                };
            case "tentative":
                return {
                    color: "#8b5cf6",
                    bgColor: "#faf5ff",
                    borderColor: "#ddd6fe",
                    icon: FaClock,
                };
            default:
                return {
                    color: "#6b7280",
                    bgColor: "#f9fafb",
                    borderColor: "#d1d5db",
                    icon: FaListAlt,
                };
        }
    };
    
    useEffect(() => {
        const handleKeyPress = (event) => {
            // Or use Shift+S for Summary
            if (event.shiftKey && (event.key === 'S' || event.key === 's')) {
                event.preventDefault();
                setShowFinancialSummary(prev => !prev);
            }
            if (event.shiftKey && (event.key === 'R' || event.key === 'r')) {
                event.preventDefault();
                handleRefresh();
            }
            if (event.shiftKey && (event.key === 'T' || event.key === 't')) {
                event.preventDefault();
                resetDatesToToday();
            }
            if (event.shiftKey && (event.key === 'D' || event.key === 'd')) {
                event.preventDefault();
                navigateDeleteBill();
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleRefresh]);

    // Get status counts for stats
    const getStatusCounts = () => {
        const counts = {
            all: bills.length,
            confirmed: 0,
            waitlisted: 0,
            tentative: 0,
        };

        bills.forEach((bill) => {
            const status = bill.status?.toLowerCase();
            if (status === "confirmed") counts.confirmed++;
            else if (status === "waitlisted") counts.waitlisted++;
            else if (status === "tentative") counts.tentative++;
        });

        return counts;
    };

    const statusCounts = getStatusCounts();

    // Format currency for display
    const formatCurrency = (amount) => {
        const num = parseFloat(amount || 0);
        return num.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString || dateString === "N/A") return "N/A";
        return dateString;
    };

    const navigateDashboard = () => {
        navigate("/dashboard");
    };

    return (
        <>
            <Header />
            {/* Delete Confirmation Popup */}
            {deletePopup.isOpen && (
                <div className="delete-popup-overlay">
                    <div className="delete-popup">
                        <div className="popup-header">
                            <h3>Delete Bill</h3>
                            <button
                                onClick={closeDeletePopup}
                                className="btn-close"
                                disabled={deletePopup.loading}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="popup-content">
                            <div className="warning-message">
                                <FaTrash className="warning-icon" />
                                <p>
                                    You are about to delete bill{" "}
                                    <strong>{deletePopup.bill?.quotationNo}</strong> for{" "}
                                    <strong>{deletePopup.bill?.partyName}</strong>.
                                </p>
                            </div>

                            <div className="reason-input-group">
                                <label htmlFor="deleteReason">
                                    Reason for deletion{" "}
                                    <span className="required">*</span>
                                </label>
                                <textarea
                                    id="deleteReason"
                                    placeholder="Please provide a reason for deletion (minimum 3 characters)..."
                                    value={deletePopup.reason}
                                    onChange={(e) =>
                                        setDeletePopup((prev) => ({
                                            ...prev,
                                            reason: e.target.value,
                                        }))
                                    }
                                    className="reason-textarea"
                                    rows="4"
                                    disabled={deletePopup.loading}
                                />
                                <div className="character-count">
                                    {deletePopup.reason.length}/3 characters minimum
                                </div>
                            </div>
                        </div>

                        <div className="popup-actions">
                            <button
                                onClick={closeDeletePopup}
                                className="btn btn-cancel"
                                disabled={deletePopup.loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="btn btn-delete-confirm"
                                disabled={
                                    deletePopup.reason.trim().length < 3 ||
                                    deletePopup.loading
                                }
                            >
                                {deletePopup.loading ? (
                                    <>
                                        <FaSync className="spinning" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FaTrash />
                                        Delete Bill
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Summary Modal */}
            {showFinancialSummary && (
                <div className="financial-summary-modal">
                    <div className="financial-summary-content">
                        <div className="summary-header">
                            <h2>
                                <FaCalculator />
                                Financial Summary - Invoices
                            </h2>
                            <button
                                className="btn-close"
                                onClick={() => setShowFinancialSummary(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="summary-grid">
                            <div className="summary-card total-amount">
                                <div className="summary-icon">
                                    <FaMoneyBillWave />
                                </div>
                                <div className="summary-info">
                                    <h3>Total Invoice Amount</h3>
                                    <div className="summary-amount">
                                        ₹{formatCurrency(financialSummary.totalBillAmount)}
                                    </div>
                                    <div className="summary-subtext">
                                        Across {financialSummary.totalBills} invoices
                                    </div>
                                </div>
                            </div>

                            <div className="summary-card received-amount">
                                <div className="summary-icon">
                                    <FaChartBar />
                                </div>
                                <div className="summary-info">
                                    <h3>Total Received</h3>
                                    <div className="summary-amount">
                                        ₹{formatCurrency(financialSummary.totalReceivedAmount)}
                                    </div>
                                    <div className="summary-subtext">
                                        {((financialSummary.totalReceivedAmount / financialSummary.totalBillAmount) * 100 || 0).toFixed(1)}% of total
                                    </div>
                                </div>
                            </div>

                            <div className="summary-card balance-amount">
                                <div className="summary-icon">
                                    <FaMoneyBillWave />
                                </div>
                                <div className="summary-info">
                                    <h3>Total Balance</h3>
                                    <div className="summary-amount">
                                        ₹{formatCurrency(financialSummary.totalBalance)}
                                    </div>
                                    <div className="summary-subtext">
                                        {((financialSummary.totalBalance / financialSummary.totalBillAmount) * 100 || 0).toFixed(1)}% pending
                                    </div>
                                </div>
                            </div>

                            <div className="summary-card discount-amount">
                                <div className="summary-icon">
                                    <FaChartBar />
                                </div>
                                <div className="summary-info">
                                    <h3>Total Discount</h3>
                                    <div className="summary-amount">
                                        ₹{formatCurrency(financialSummary.totalDiscount)}
                                    </div>
                                    <div className="summary-subtext">
                                        {((financialSummary.totalDiscount / financialSummary.totalBillAmount) * 100 || 0).toFixed(1)}% of total
                                    </div>
                                </div>
                            </div>

                            <div className="summary-card tds-amount">
                                <div className="summary-icon">
                                    <FaMoneyBillWave />
                                </div>
                                <div className="summary-info">
                                    <h3>Total TDS</h3>
                                    <div className="summary-amount">
                                        ₹{formatCurrency(financialSummary.totalTDS)}
                                    </div>
                                    <div className="summary-subtext">
                                        Tax deducted at source
                                    </div>
                                </div>
                            </div>

                            <div className="summary-card average-amount">
                                <div className="summary-icon">
                                    <FaChartBar />
                                </div>
                                <div className="summary-info">
                                    <h3>Average Invoice</h3>
                                    <div className="summary-amount">
                                        ₹{formatCurrency(financialSummary.averageBillAmount)}
                                    </div>
                                    <div className="summary-subtext">
                                        Per invoice
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Breakdown */}
                        <div className="status-breakdown">
                            <h3>Status Breakdown</h3>
                            <div className="status-list">
                                {Object.entries(financialSummary.statusBreakdown).map(([status, data]) => (
                                    <div key={status} className="status-item">
                                        <span className="status-name">{status.toUpperCase()}</span>
                                        <span className="status-count">{data.count} invoices</span>
                                        <span className="status-amount">
                                            ₹{formatCurrency(data.totalAmount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="summary-footer">
                            <p>
                                Showing financial data for <strong>{filteredBills.length}</strong> invoices
                                {statusFilter !== 'all' && ` • Filtered by: ${statusFilter}`}
                                {searchTerm && ` • Search: "${searchTerm}"`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bill-list">
                {/* Header Section */}
                <div className="page-header">
                    <div className="header-content">
                        <div className="header-main">
                            <div className="header-title">
                                <button className="btn btn-back" onClick={navigateDashboard}>
                                    <VscArrowLeft size={24} />
                                </button>
                                <div>
                                    <h1>Invoices</h1>
                                    <p>Manage all billed banquet Invoices</p>
                                </div>
                            </div>
                            <div className="header-actions">

                                <button
                                    onClick={handleRefresh}
                                    className="btn btn-refresh mobile"
                                    disabled={loading}
                                >
                                    <FaSync className={loading ? "spinning" : ""} />
                                </button>
                            </div>
                        </div>

                        {/* Interactive Stats Row */}
                        <div className="header-stats">
                            <div
                                className={`stat-card total ${statusFilter === "all" ? "active" : ""
                                    }`}
                                onClick={() => handleStatusFilter("all")}
                            >
                                <span className="stat-number">{statusCounts.all}</span>
                                <span className="stat-label">Total Bills</span>
                            </div>
                            <div
                                className={`stat-card confirmed ${statusFilter === "confirmed" ? "active" : ""
                                    }`}
                                onClick={() => handleStatusFilter("confirmed")}
                            >
                                <span className="stat-number">
                                    {statusCounts.confirmed}
                                </span>
                                <span className="stat-label">Confirmed</span>
                            </div>
                            <div
                                className={`stat-card waitlisted ${statusFilter === "waitlisted" ? "active" : ""
                                    }`}
                                onClick={() => handleStatusFilter("waitlisted")}
                            >
                                <span className="stat-number">
                                    {statusCounts.waitlisted}
                                </span>
                                <span className="stat-label">Waitlist</span>
                            </div>
                            <div
                                className={`stat-card tentative ${statusFilter === "tentative" ? "active" : ""
                                    }`}
                                onClick={() => handleStatusFilter("tentative")}
                            >
                                <span className="stat-number">
                                    {statusCounts.tentative}
                                </span>
                                <span className="stat-label">Tentative</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Financial Overview Bar */}
                <div className="financial-overview-bar">
                    <div className="financial-overview-content">
                        <div className="financial-item">
                            <span className="financial-label">Total Amount:</span>
                            <span className="financial-value">
                                ₹{formatCurrency(financialSummary.totalBillAmount)}
                            </span>
                        </div>
                        <div className="financial-item">
                            <span className="financial-label">Received:</span>
                            <span className="financial-value received">
                                ₹{formatCurrency(financialSummary.totalReceivedAmount)}
                            </span>
                        </div>
                        <div className="financial-item">
                            <span className="financial-label">Balance:</span>
                            <span className="financial-value balance">
                                ₹{formatCurrency(financialSummary.totalBalance)}
                            </span>
                        </div>
                        <div className="financial-item">
                            <span className="financial-label">Discount:</span>
                            <span className="financial-value discount">
                                ₹{formatCurrency(financialSummary.totalDiscount)}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowFinancialSummary(true)}
                            className="btn btn-view-details"
                        >
                            <FaCalculator />
                           Summary
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="filter-bar">
                    <div className="filter-container">
                        <div className="filter-main">
                            <div className="date-filters">
                                <div className="date-filter-group">
                                    <label>From Date</label>
                                    <DatePicker
                                        value={fromDate}
                                        onChange={handleFromDateChange}
                                        format="DD-MM-YYYY"
                                        slotProps={{
                                            textField: {
                                                size: "small",
                                                placeholder: "From Date",
                                                fullWidth: true,
                                                error: !dateValidation.isValid
                                            },
                                        }}
                                    />
                                </div>
                                <div className="date-filter-group">
                                    <label>To Date</label>
                                    <DatePicker
                                        value={toDate}
                                        onChange={handleToDateChange}
                                        format="DD-MM-YYYY"
                                        minDate={fromDate} // This prevents selecting dates before fromDate
                                        slotProps={{
                                            textField: {
                                                size: "small",
                                                placeholder: "To Date",
                                                fullWidth: true,
                                                error: !dateValidation.isValid
                                            },
                                        }}
                                    />
                                </div>
                                <div className="date-controls">
                                    <button
                                        onClick={resetDatesToToday}
                                        className="btn btn-reset-date"
                                        title="Reset to today's date"
                                    >
                                        <FaCalendarAlt />
                                        Today
                                    </button>
                                </div>
                                <div className="search-box">
                                    <input
                                        type="text"
                                        placeholder="Search by party name, quotation no, company, invoice..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>

                            {/* Date Validation Error Message */}
                            {!dateValidation.isValid && (
                                <div className="date-validation-error">
                                    <span className="error-icon">⚠️</span>
                                    <span className="error-message">{dateValidation.error}</span>
                                </div>
                            )}

                            <div className="filter-actions">
                                {statusFilter !== "all" && (
                                    <button
                                        onClick={() => handleStatusFilter("all")}
                                        className="btn btn-clear-filter"
                                    >
                                        Clear Filter
                                    </button>
                                )}
                                <button
                                    onClick={fetchBills}
                                    className="btn btn-refresh desktop"
                                    disabled={loading || !dateValidation.isValid}
                                >
                                    <FaSync className={loading ? "spinning" : ""} />
                                    {loading ? "Loading..." : "Refresh"}
                                </button>
                                <button
                                    className="btn btn-refresh"
                                    onClick={navigateDeleteBill}
                                >
                                    Deleted Bills
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Bills Container */}
                <div className="bills-container">
                    {loading ? (
                        <div className="loading-state">
                            <FaSync className="spinning" size={32} />
                            <p>Loading bills...</p>
                        </div>
                    ) : filteredBills.length === 0 ? (
                        <div className="empty-state">
                            <FaFileInvoice size={64} color="#9ca3af" />
                            <h3>No bills found</h3>
                            <p>
                                Try adjusting your search filters or create a new booking
                            </p>
                            {statusFilter !== "all" && (
                                <button
                                    onClick={() => handleStatusFilter("all")}
                                    className="btn btn-primary"
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Mobile Cards View */}
                            <div className="bills-cards">
                                {filteredBills.map((bill) => {
                                    const statusConfig = getStatusConfig(bill.status);
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <div
                                            key={bill.quotationId || bill.id}
                                            className="bill-card"
                                        >
                                            <div className="card-header">
                                                <div className="card-title-section">
                                                    <div className="quotation-info">
                                                        <h3 className="quotation-no">
                                                            INV: {bill.quotationNo}
                                                        </h3>
                                                        <span className="invoice-date">
                                                            {formatDate(bill.quotationDate)}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className="status-badge"
                                                        style={{
                                                            color: statusConfig.color,
                                                            backgroundColor:
                                                                statusConfig.bgColor,
                                                            border: `1px solid ${statusConfig.borderColor}`,
                                                        }}
                                                    >
                                                        <StatusIcon size={10} />
                                                        {bill.status || "PENDING"}
                                                    </span>
                                                </div>
                                                <div className="party-info">
                                                    <strong className="party-namee">
                                                        {bill.partyName}
                                                    </strong>
                                                    <span className="company-name">
                                                        <FaBuilding size={10} />
                                                        {bill.billingCompany}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="card-body">
                                                {/* Function Details */}
                                                <div className="detail-section">
                                                    <div className="function-details">
                                                        <FaCalendarAlt size={12} />
                                                        <span className="function-type">
                                                            {bill.functionName}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Financial Summary */}
                                                <div className="financial-summary">
                                                    <div className="main-amount-row">
                                                        <span>Bill Amount:</span>
                                                        <strong className="amount">
                                                            ₹{formatCurrency(bill.billAmount)}
                                                        </strong>
                                                    </div>

                                                    <div className="financial-breakdown">
                                                        <div className="breakdown-item">
                                                            <span className="breakdown-label">
                                                                Received:
                                                            </span>
                                                            <span className="breakdown-value received">
                                                                ₹
                                                                {formatCurrency(
                                                                    bill.receivedAmount
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="breakdown-item">
                                                            <span className="breakdown-label">
                                                                Balance:
                                                            </span>
                                                            <span
                                                                className={`breakdown-value ${parseFloat(
                                                                    bill.balance
                                                                ) > 0
                                                                    ? "balance-pending"
                                                                    : "balance-paid"
                                                                    }`}
                                                            >
                                                                ₹
                                                                {formatCurrency(
                                                                    bill.balance
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="financial-details">
                                                        <div className="detail-item">
                                                            <span>Discount:</span>
                                                            <span className="discount">
                                                                ₹
                                                                {formatCurrency(
                                                                    bill.discount
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <span>TDS:</span>
                                                            <span className="tds">
                                                                ₹
                                                                {formatCurrency(bill.tds)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card-actions">
                                                <button
                                                    onClick={() => handlePreview(bill)}
                                                    className="btn btn-preview"
                                                    title="Preview Bill"
                                                >
                                                    <FaEye />
                                                    <span>View</span>
                                                </button>
                                                <button
                                                    onClick={() => handleBillEdit(bill)}
                                                    className="btn btn-modify"
                                                    title="Edit Bill"
                                                >
                                                    <FaEdit />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => openDeletePopup(bill)}
                                                    className="btn btn-delete"
                                                    title="Delete Bill"
                                                >
                                                    <FaTrash />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Tablet Cards View */}
                            <div className="bills-tablet">
                                {filteredBills.map((bill) => {
                                    const statusConfig = getStatusConfig(bill.status);
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <div
                                            key={bill.quotationId || bill.id}
                                            className="bill-card-tablet"
                                        >
                                            <div className="tablet-header">
                                                <div className="tablet-main-info">
                                                    <div className="invoice-info">
                                                        <strong className="invoice-no">
                                                            Inv no. {bill.quotationNo}
                                                        </strong>
                                                        <span className="invoice-date">
                                                            {formatDate(bill.quotationDate)}
                                                        </span>
                                                    </div>
                                                    <div className="party-info-tablet">
                                                        <strong className="party-namee">
                                                            {bill.partyName}
                                                        </strong>
                                                        <span className="company-name">
                                                            <FaBuilding size={10} />
                                                            {bill.billingCompany}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        color: statusConfig.color,
                                                        backgroundColor:
                                                            statusConfig.bgColor,
                                                        border: `1px solid ${statusConfig.borderColor}`,
                                                    }}
                                                >
                                                    <StatusIcon size={10} />
                                                    {bill.status || "PENDING"}
                                                </span>
                                            </div>

                                            <div className="tablet-body">
                                                <div className="tablet-details">
                                                    <div className="function-info">
                                                        <FaCalendarAlt size={12} />
                                                        <span>{bill.functionName}</span>
                                                    </div>
                                                    <div className="financial-info-tablet">
                                                        <div className="amount-section">
                                                            <div className="amount-item-tablet">
                                                                <span>Bill Amount:</span>
                                                                <strong className="main-amount">
                                                                    ₹
                                                                    {formatCurrency(
                                                                        bill.billAmount
                                                                    )}
                                                                </strong>
                                                            </div>
                                                            <div className="amount-details-tablet">
                                                                <div className="amount-pair">
                                                                    <div className="amount-detail">
                                                                        <span>
                                                                            Received:
                                                                        </span>
                                                                        <span className="received">
                                                                            ₹
                                                                            {formatCurrency(
                                                                                bill.receivedAmount
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="amount-detail">
                                                                        <span>
                                                                            Discount:
                                                                        </span>
                                                                        <span className="discount">
                                                                            ₹
                                                                            {formatCurrency(
                                                                                bill.discount
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="amount-pair">
                                                                    <div className="amount-detail">
                                                                        <span>
                                                                            Balance:
                                                                        </span>
                                                                        <span
                                                                            className={`balance ${parseFloat(
                                                                                bill.balance
                                                                            ) > 0
                                                                                ? "pending"
                                                                                : "paid"
                                                                                }`}
                                                                        >
                                                                            ₹
                                                                            {formatCurrency(
                                                                                bill.balance
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="amount-detail">
                                                                        <span>TDS:</span>
                                                                        <span className="tds">
                                                                            ₹
                                                                            {formatCurrency(
                                                                                bill.tds
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="tablet-actions">
                                                <button
                                                    onClick={() => handlePreview(bill)}
                                                    className="btn btn-preview"
                                                    title="Preview Bill"
                                                >
                                                    <FaEye />
                                                    <span>View</span>
                                                </button>
                                                <button
                                                    onClick={() => handleBillEdit(bill)}
                                                    className="btn btn-modify"
                                                    title="Edit Bill"
                                                >
                                                    <FaEdit />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => openDeletePopup(bill)}
                                                    className="btn btn-delete"
                                                    title="Delete Bill"
                                                >
                                                    <FaTrash />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop Table View */}
                            <div className="bills-table-container">
                                <table className="bills-table">
                                    <thead>
                                        <tr>
                                            <th className="actions">Actions</th>
                                            <th className="quotation-no">Invoice No</th>
                                            <th className="quotation-date">Invoice Date</th>
                                            <th className="party-namee">Party Name</th>
                                            <th className="received-amount">
                                                Received Amt
                                            </th>
                                            <th className="discount">Discount</th>
                                            <th className="tds">TDS</th>
                                            <th className="bill-amount">Bill Amount</th>
                                            <th className="balance">Balance</th>
                                            <th className="billing-company">
                                                Billing Company
                                            </th>
                                            <th className="function-name">
                                                Function Name
                                            </th>
                                            <th className="status">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBills.map((bill) => {
                                            const statusConfig = getStatusConfig(bill.status);
                                            const StatusIcon = statusConfig.icon;

                                            return (
                                                <tr
                                                    key={bill.quotationId || bill.id}
                                                    className="bill-row"
                                                >
                                                    <td className="actions">
                                                        <div className="action-buttons">
                                                            <button
                                                                onClick={() =>
                                                                    handlePreview(bill)
                                                                }
                                                                className="btn btn-preview"
                                                                title="Preview Bill"
                                                            >
                                                                <FaEye />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleBillEdit(bill)
                                                                }
                                                                className="btn btn-modify"
                                                                title="Edit Bill"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    openDeletePopup(bill)
                                                                }
                                                                className="btn btn-delete"
                                                                title="Delete Bill"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="quotation-no">
                                                        <strong>{bill.quotationNo}</strong>
                                                    </td>
                                                    <td className="quotation-date">
                                                        {formatDate(bill.quotationDate)}
                                                    </td>
                                                    <td className="party-namee">
                                                        <div className="party-info">
                                                            <strong>{bill.partyName}</strong>
                                                        </div>
                                                    </td>
                                                    <td className="received-amount">
                                                        <div className="currency-cell">
                                                            <FaRupeeSign size={10} />
                                                            {formatCurrency(
                                                                bill.receivedAmount
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="discount">
                                                        <div className="currency-cell">
                                                            <FaRupeeSign size={10} />
                                                            {formatCurrency(bill.discount)}
                                                        </div>
                                                    </td>
                                                    <td className="tds">
                                                        <div className="currency-cell">
                                                            <FaRupeeSign size={10} />
                                                            {formatCurrency(bill.tds)}
                                                        </div>
                                                    </td>
                                                    <td className="bill-amount">
                                                        <div className="currency-cell main-amount">
                                                            <FaRupeeSign size={12} />
                                                            <strong>
                                                                {formatCurrency(
                                                                    bill.billAmount
                                                                )}
                                                            </strong>
                                                        </div>
                                                    </td>
                                                    <td className="balance">
                                                        <div
                                                            className={`currency-cell ${parseFloat(bill.balance) > 0
                                                                ? "balance-pending"
                                                                : "balance-paid"
                                                                }`}
                                                        >
                                                            <FaRupeeSign size={10} />
                                                            {formatCurrency(bill.balance)}
                                                        </div>
                                                    </td>
                                                    <td className="billing-company">
                                                        <div className="company-cell">
                                                            <FaBuilding size={10} />
                                                            {bill.billingCompany}
                                                        </div>
                                                    </td>
                                                    <td className="function-name">
                                                        {bill.functionName}
                                                    </td>
                                                    <td className="status">
                                                        <span
                                                            className="status-badge"
                                                            style={{
                                                                color: statusConfig.color,
                                                                backgroundColor:
                                                                    statusConfig.bgColor,
                                                                border: `1px solid ${statusConfig.borderColor}`,
                                                            }}
                                                        >
                                                            <StatusIcon size={10} />
                                                            {bill.status || "PENDING"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Summary Section */}
                <div className="list-summary">
                    <p>
                        Showing <strong>{filteredBills.length}</strong> of{" "}
                        <strong>{bills.length}</strong> bills
                        {statusFilter !== "all" && ` • Filtered by: ${statusFilter}`}
                        {searchTerm && ` • Search: "${searchTerm}"`}
                        <span className="financial-totals">
                            • Total: ₹{formatCurrency(financialSummary.totalBillAmount)}
                            • Received: ₹{formatCurrency(financialSummary.totalReceivedAmount)}
                            • Balance: ₹{formatCurrency(financialSummary.totalBalance)}
                        </span>
                    </p>
                </div>

                {/* Floating Action Button */}
                <button
                    className="floating-new-btn"
                    onClick={handleNewBill}
                    title="Create New Bill"
                >
                    <FaPlus />
                </button>

                {/* Updated Styles */}
                <style>{`
                    .bill-list {
                        padding: 16px;
                        max-width: 1400px;
                        margin: 0 auto;
                        background: #f8fafc;
                        min-height: 100vh;
                        position: relative;
                    }

                    .spinning {
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        from {
                            transform: rotate(0deg);
                        }
                        to {
                            transform: rotate(360deg);
                        }
                    }

                    /* Financial Summary Modal Styles */
                    .financial-summary-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        padding: 20px;
                    }

                    .financial-summary-content {
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        width: 100%;
                        max-width: 900px;
                        max-height: 90vh;
                        overflow-y: auto;
                        animation: popup-appear 0.3s ease-out;
                    }

                    .summary-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 24px;
                        border-bottom: 1px solid #e2e8f0;
                        background: linear-gradient(135deg, #847239 0%, #a8925c 100%);
                        color: white;
                    }

                    .summary-header h2 {
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        font-size: 24px;
                    }

                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 16px;
                        padding: 24px;
                    }

                    .summary-card {
                        background: white;
                        border-radius: 12px;
                        padding: 20px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        border: 1px solid #e2e8f0;
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        transition: all 0.3s ease;
                    }

                    .summary-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                    }

                    .summary-icon {
                        width: 60px;
                        height: 60px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        color: white;
                    }

                    .total-amount .summary-icon { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                    .received-amount .summary-icon { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
                    .balance-amount .summary-icon { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
                    .discount-amount .summary-icon { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
                    .tds-amount .summary-icon { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
                    .average-amount .summary-icon { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }

                    .summary-info h3 {
                        margin: 0 0 8px 0;
                        font-size: 14px;
                        color: #6b7280;
                        font-weight: 500;
                    }

                    .summary-amount {
                        font-size: 24px;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 4px;
                    }

                    .summary-subtext {
                        font-size: 12px;
                        color: #9ca3af;
                    }

                    .status-breakdown {
                        padding: 0 24px 24px;
                    }

                    .status-breakdown h3 {
                        margin: 0 0 16px 0;
                        color: #374151;
                        font-size: 18px;
                    }

                    .status-list {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .status-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 16px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #847239;
                    }

                    .status-name {
                        font-weight: 600;
                        color: #374151;
                        text-transform: uppercase;
                        font-size: 12px;
                        letter-spacing: 0.5px;
                    }

                    .status-count {
                        color: #6b7280;
                        font-size: 14px;
                    }

                    .status-amount {
                        font-weight: 600;
                        color: #059669;
                    }

                    .summary-footer {
                        padding: 16px 24px;
                        border-top: 1px solid #e2e8f0;
                        background: #f8fafc;
                        text-align: center;
                        color: #6b7280;
                        font-size: 14px;
                    }

                    /* Date Controls */
                    .date-controls {
                        display: flex;
                        align-items: end;
                    }

                    .btn-reset-date {
                        background: #6b7280;
                        color: white;
                        padding: 8px 12px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.3s ease;
                        font-size: 14px;
                    }

                    .btn-reset-date:hover {
                        background: #4b5563;
                    }

                    /* Financial Overview Bar */
                    .financial-overview-bar {
                        background: white;
                        border-radius: 12px;
                        margin-bottom: 16px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                    }

                    .financial-overview-content {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 16px;
                        flex-wrap: wrap;
                        gap: 12px;
                    }

                    .financial-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .financial-label {
                        font-size: 14px;
                        color: #6b7280;
                        font-weight: 500;
                    }

                    .financial-value {
                        font-weight: 600;
                        font-size: 16px;
                    }

                    .financial-value.received { color: #10b981; }
                    .financial-value.balance { color: #ef4444; }
                    .financial-value.discount { color: #f59e0b; }

                    .btn-view-details {
                        background: #847239;
                        color: white;
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.3s ease;
                    }

                    .btn-view-details:hover {
                        background: #756035;
                    }

                    .btn-financial-summary {
                        background: #10b981;
                        color: white;
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.3s ease;
                    }

                    .btn-financial-summary:hover {
                        background: #059669;
                    }

                    .financial-totals {
                        margin-left: 16px;
                        font-size: 13px;
                        color: #6b7280;
                    }

                    .financial-totals span {
                        margin: 0 8px;
                    }

                    /* Header Title Layout */
                    .header-title {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .btn-back {
                        background: none;
                        border: none;
                        color: #374151;
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 6px;
                        transition: all 0.3s ease;
                    }

                    .btn-back:hover {
                        background: #f3f4f6;
                    }

                    /* Rest of your existing styles remain the same... */
                    .delete-popup-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        padding: 20px;
                    }

                    .delete-popup {
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        width: 100%;
                        max-width: 500px;
                        max-height: 90vh;
                        overflow: hidden;
                        animation: popup-appear 0.3s ease-out;
                    }

                    @keyframes popup-appear {
                        from {
                            opacity: 0;
                            transform: scale(0.9) translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }

                    .popup-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        border-bottom: 1px solid #e2e8f0;
                        background: #fef2f2;
                    }

                    .popup-header h3 {
                        margin: 0;
                        color: #dc2626;
                        font-size: 18px;
                        font-weight: 600;
                    }

                    .btn-close {
                        background: none;
                        border: none;
                        font-size: 16px;
                        color: #6b7280;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        transition: all 0.2s ease;
                    }

                    .btn-close:hover {
                        background: #f3f4f6;
                        color: #374151;
                    }

                    .btn-close:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .popup-content {
                        padding: 24px;
                    }

                    .warning-message {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        margin-bottom: 20px;
                        padding: 16px;
                        background: #fef2f2;
                        border-radius: 8px;
                        border-left: 4px solid #dc2626;
                    }

                    .warning-icon {
                        color: #dc2626;
                        font-size: 18px;
                        margin-top: 2px;
                        flex-shrink: 0;
                    }

                    .warning-message p {
                        margin: 0;
                        color: #374151;
                        line-height: 1.5;
                    }

                    .reason-input-group {
                        margin-bottom: 8px;
                    }

                    .reason-input-group label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 500;
                        color: #374151;
                    }

                    .required {
                        color: #dc2626;
                    }

                    .reason-textarea {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: inherit;
                        resize: vertical;
                        transition: all 0.3s ease;
                        background: white;
                    }

                    .reason-textarea:focus {
                        outline: none;
                        border-color: #dc2626;
                        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
                    }

                    .reason-textarea:disabled {
                        background: #f9fafb;
                        cursor: not-allowed;
                    }

                    .character-count {
                        font-size: 12px;
                        color: #6b7280;
                        margin-top: 4px;
                        text-align: right;
                    }

                    .popup-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        padding: 20px 24px;
                        border-top: 1px solid #e2e8f0;
                        background: #f8fafc;
                    }

                    .btn-cancel {
                        background: #6b7280;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.3s ease;
                    }

                    .btn-cancel:hover:not(:disabled) {
                        background: #4b5563;
                    }

                    .btn-delete-confirm {
                        background: #dc2626;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .btn-delete-confirm:hover:not(:disabled) {
                        background: #b91c1c;
                    }

                    .btn-delete-confirm:disabled {
                        background: #fca5a5;
                        cursor: not-allowed;
                        transform: none;
                    }

                    /* Header Styles */
                    .page-header {
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        border: 1px solid #e2e8f0;
                        margin-bottom: 16px;
                    }

                    .header-content {
                        padding: 20px;
                    }

                    .header-main {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 16px;
                    }

                    .header-title h1 {
                        font-size: 24px;
                        font-weight: 700;
                        color: #1f2937;
                        margin: 0 0 4px 0;
                    }

                    .header-title p {
                        font-size: 14px;
                        color: #6b7280;
                        margin: 0;
                    }

                    .header-stats {
                        display: flex;
                        gap: 12px;
                        overflow-x: auto;
                        padding-bottom: 4px;
                    }

                    .stat-card {
                        flex: 1;
                        min-width: 100px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #d1d5db;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }

                    .stat-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }

                    .stat-card.active {
                        background: white;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    }

                    .stat-card.total {
                        border-left-color: #6b7280;
                    }
                    .stat-card.total.active {
                        background: #071936;
                        color: white;
                    }
                    .stat-card.confirmed {
                        border-left-color: #10b981;
                    }
                    .stat-card.confirmed.active {
                        background: #003625ff;
                        color: white;
                    }
                    .stat-card.waitlisted {
                        border-left-color: #f59e0b;
                    }
                    .stat-card.waitlisted.active {
                        background: #7f4400ff;
                        color: white;
                    }
                    .stat-card.tentative {
                        border-left-color: #8b5cf6;
                    }
                    .stat-card.tentative.active {
                        background: #27006aff;
                        color: white;
                    }

                    .stat-number {
                        font-size: 20px;
                        font-weight: 700;
                        display: block;
                    }

                    .stat-label {
                        font-size: 12px;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    /* Filter Bar */
                    .filter-bar {
                        background: white;
                        padding: 16px;
                        border-radius: 12px;
                        margin-bottom: 16px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        border: 1px solid #e2e8f0;
                    }

                    .filter-main {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    .date-filters {
                        display: flex;
                        gap: 16px;
                        align-items: end;
                        flex-wrap: wrap;
                    }

                    .date-filter-group {
                        flex: 1;
                        min-width: 150px;
                    }

                    .date-filter-group label {
                        display: block;
                        font-size: 12px;
                        font-weight: 500;
                        color: #374151;
                        margin-bottom: 4px;
                    }

                    .search-box {
                        flex: 2;
                        min-width: 250px;
                    }

                    .search-input {
                        width: 100%;
                        padding: 8px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                    }

                    .search-input:focus {
                        outline: none;
                        border-color: #847239;
                        box-shadow: 0 0 0 3px rgba(132, 114, 57, 0.1);
                    }

                    .filter-actions {
                        display: flex;
                        gap: 12px;
                        align-items: center;
                    }

                    .btn {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        font-size: 14px;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .btn-refresh {
                        background: #847239;
                        color: white;
                    }

                    .btn-refresh:hover:not(:disabled) {
                        background: #756035;
                    }

                    .btn-clear-filter {
                        background: #ef4444;
                        color: white;
                    }

                    .btn-clear-filter:hover {
                        background: #dc2626;
                    }

                    .btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    /* Mobile Cards (0px - 767px) */
                    .bills-cards {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 12px;
                        margin-bottom: 20px;
                    }

                    .bill-card {
                        background: white;
                        border-radius: 8px;
                        padding: 16px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        border: 1px solid #e2e8f0;
                    }

                    .card-header {
                        margin-bottom: 12px;
                    }

                    .card-title-section {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 8px;
                        gap: 8px;
                    }

                    .quotation-info {
                        flex: 1;
                    }

                    .quotation-no {
                        font-size: 16px;
                        font-weight: 700;
                        color: #1f2937;
                        margin: 0 0 4px 0;
                    }

                    .invoice-date {
                        font-size: 12px;
                        color: #6b7280;
                        display: block;
                    }

                    .status-badge {
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        white-space: nowrap;
                    }

                    .party-info {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .party-namee {
                        font-size: 14px;
                        color: #374151;
                        font-weight: 600;
                    }

                    .company-name {
                        font-size: 12px;
                        color: #6b7280;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .card-body {
                        margin-bottom: 16px;
                    }

                    .detail-section {
                        margin-bottom: 12px;
                        padding-bottom: 12px;
                        border-bottom: 1px solid #f1f5f9;
                    }

                    .function-details {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 13px;
                        color: #6b7280;
                    }

                    .function-type {
                        color: #847239;
                        font-weight: 600;
                    }

                    .financial-summary {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .main-amount-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 14px;
                        font-weight: 600;
                    }

                    .amount {
                        color: #059669;
                        font-size: 16px;
                    }

                    .financial-breakdown {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                        margin-bottom: 4px;
                    }

                    .breakdown-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 13px;
                    }

                    .breakdown-label {
                        color: #6b7280;
                    }

                    .breakdown-value {
                        font-weight: 600;
                    }

                    .received {
                        color: #10b981;
                    }
                    .discount {
                        color: #f59e0b;
                    }
                    .tds {
                        color: #8b5cf6;
                    }
                    .balance-pending {
                        color: #ef4444;
                    }
                    .balance-paid {
                        color: #10b981;
                    }

                    .financial-details {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                        font-size: 12px;
                        color: #6b7280;
                    }

                    .detail-item {
                        display: flex;
                        justify-content: space-between;
                    }

                    .card-actions {
                        display: flex;
                        gap: 8px;
                    }

                    .card-actions .btn {
                        flex: 1;
                        padding: 8px 12px;
                        font-size: 12px;
                        justify-content: center;
                    }

                    .btn-preview {
                        background: #3b82f6;
                        color: white;
                    }
                    .btn-preview:hover {
                        background: #2563eb;
                    }
                    .btn-modify {
                        background: #f59e0b;
                        color: white;
                    }
                    .btn-modify:hover {
                        background: #d97706;
                    }
                    .btn-delete {
                        background: #ef4444;
                        color: white;
                    }
                    .btn-delete:hover {
                        background: #dc2626;
                    }

                    /* Tablet Cards (768px - 1023px) */
                    .bills-tablet {
                        display: none;
                        grid-template-columns: 1fr;
                        gap: 16px;
                        margin-bottom: 20px;
                    }

                    .bill-card-tablet {
                        background: white;
                        border-radius: 8px;
                        padding: 20px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        border: 1px solid #e2e8f0;
                    }

                    .tablet-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 16px;
                        gap: 12px;
                    }

                    .tablet-main-info {
                        flex: 1;
                    }

                    .invoice-info {
                        margin-bottom: 8px;
                    }

                    .invoice-no {
                        font-size: 18px;
                        color: #1f2937;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-weight: 700;
                    }

                    .invoice-date {
                        font-size: 13px;
                        color: #6b7280;
                    }

                    .party-info-tablet {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .tablet-body {
                        margin-bottom: 16px;
                    }

                    .tablet-details {
                        display: grid;
                        grid-template-columns: 1fr 2fr;
                        gap: 16px;
                        align-items: start;
                    }

                    .function-info {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 14px;
                        color: #6b7280;
                        padding: 8px 0;
                    }

                    .financial-info-tablet {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .amount-section {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .amount-item-tablet {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 14px;
                        font-weight: 600;
                    }

                    .main-amount {
                        color: #059669;
                        font-size: 16px;
                    }

                    .amount-details-tablet {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                    }

                    .amount-pair {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                    }

                    .amount-detail {
                        display: flex;
                        justify-content: space-between;
                        font-size: 13px;
                        color: #6b7280;
                    }

                    .balance.pending {
                        color: #ef4444;
                        font-weight: 600;
                    }
                    .balance.paid {
                        color: #10b981;
                    }

                    .tablet-actions {
                        display: flex;
                        gap: 8px;
                        justify-content: flex-end;
                    }

                    .tablet-actions .btn {
                        padding: 8px 16px;
                        font-size: 13px;
                    }

                    /* Desktop Table (1024px+) */
                    .bills-table-container {
                        display: none;
                        overflow-x: auto;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        border: 1px solid #e2e8f0;
                    }

                    .bills-table {
                        width: 100%;
                        border-collapse: collapse;
                        min-width: 1200px;
                    }

                    .bills-table th {
                        background: #f8fafc;
                        padding: 12px 16px;
                        text-align: left;
                        font-weight: 600;
                        color: #374151;
                        border-bottom: 1px solid #e2e8f0;
                        font-size: 13px;
                        white-space: nowrap;
                    }

                    .bills-table td {
                        padding: 12px 16px;
                        border-bottom: 1px solid #f1f5f9;
                        vertical-align: middle;
                        font-size: 14px;
                    }

                    .bills-table tr:hover {
                        background: #f8fafc;
                    }

                    .company-cell {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .currency-cell {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        white-space: nowrap;
                    }

                    .main-amount {
                        color: #059669;
                        font-weight: 600;
                    }

                    .balance-pending {
                        color: #ef4444;
                        font-weight: 500;
                    }

                    .balance-paid {
                        color: #10b981;
                    }

                    .action-buttons {
                        display: flex;
                        gap: 6px;
                    }

                    .action-buttons .btn {
                        padding: 6px 8px;
                        font-size: 12px;
                    }

                    /* Loading and Empty States */
                    .loading-state,
                    .empty-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 60px 20px;
                        text-align: center;
                        color: #6b7280;
                    }

                    .empty-state h3 {
                        margin: 16px 0 8px 0;
                        color: #374151;
                    }

                    .list-summary {
                        padding: 16px;
                        text-align: center;
                        color: #6b7280;
                        font-size: 14px;
                    }

                    /* Floating Button */
                    .floating-new-btn {
                        position: fixed;
                        bottom: 24px;
                        right: 24px;
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        background: linear-gradient(
                            135deg,
                            #847239 0%,
                            #a8925c 100%
                        );
                        color: white;
                        border: none;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                        box-shadow: 0 4px 20px rgba(132, 114, 57, 0.4);
                        transition: all 0.3s ease;
                        z-index: 1000;
                    }

                    .floating-new-btn:hover {
                        transform: scale(1.1);
                        box-shadow: 0 6px 25px rgba(132, 114, 57, 0.6);
                    }

                    /* Responsive Design */
                    @media (max-width: 767px) {
                        .bill-list {
                            padding: 12px;
                        }

                        .bills-cards {
                            display: grid;
                        }

                        .bills-tablet {
                            display: none;
                        }

                        .bills-table-container {
                            display: none;
                        }

                        .header-stats {
                            gap: 8px;
                        }

                        .stat-card {
                            min-width: 80px;
                            padding: 8px;
                        }

                        .stat-number {
                            font-size: 16px;
                        }

                        .stat-label {
                            font-size: 10px;
                        }

                        .date-filters {
                            flex-direction: column;
                        }

                        .date-filter-group,
                        .search-box,
                        .date-controls {
                            width: 100%;
                        }

                        .btn-refresh.mobile {
                            display: flex;
                        }

                        .btn-refresh.desktop {
                            display: none;
                        }

                        .financial-overview-content {
                            flex-direction: column;
                            align-items: stretch;
                        }

                        .financial-item {
                            justify-content: space-between;
                        }

                        .financial-totals {
                            display: none;
                        }
                    }

                    @media (min-width: 768px) and (max-width: 1023px) {
                        .bills-cards {
                            display: none;
                        }

                        .bills-tablet {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                        }

                        .bills-table-container {
                            display: none;
                        }

                        .filter-main {
                            flex-direction: row;
                            align-items: end;
                        }

                        .filter-actions {
                            margin-left: auto;
                        }

                        .btn-refresh.mobile {
                            display: none;
                        }

                        .btn-refresh.desktop {
                            display: flex;
                        }
                    }

                    @media (min-width: 1024px) {
                        .bills-cards {
                            display: none;
                        }

                        .bills-tablet {
                            display: none;
                        }

                        .bills-table-container {
                            display: block;
                        }

                        .filter-main {
                            flex-direction: row;
                            align-items: end;
                        }

                        .filter-actions {
                            margin-left: auto;
                        }

                        .btn-refresh.mobile {
                            display: none;
                        }

                        .btn-refresh.desktop {
                            display: flex;
                        }

                    }
                        .date-validation-error {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 12px;
                        background: #fef2f2;
                        border: 1px solid #fecaca;
                        border-radius: 6px;
                        color: #dc2626;
                        font-size: 14px;
                        margin-top: 8px;
                    }

                    .error-icon {
                        font-size: 16px;
                    }

                    .error-message {
                        font-weight: 500;
                    }
                `}</style>
            </div>
        </>
    );
};

export default BillList;