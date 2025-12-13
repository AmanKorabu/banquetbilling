// NewBooking.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import {
    FaSave,
    FaRedoAlt,
    FaUserAlt,
    FaMapMarkerAlt,
    FaTrash,
} from "react-icons/fa";
import { HiPrinter } from "react-icons/hi2";
import { TiPrinter } from "react-icons/ti";
import { LuReceiptIndianRupee } from "react-icons/lu";
import { MdCoPresent } from "react-icons/md";
import { FaPeopleGroup } from "react-icons/fa6";
import { GrStatusUnknown } from "react-icons/gr";
import { MdShoppingCart } from "react-icons/md";
import { FaPrint } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import ConfirmationDialog from "../components/ConfirmationDilog";
import EventDetailsSection from "../components/EventDetailsSection";
import ConfirmBackButton from "../components/ConfirmBackButton";
import DateTimeSection from "../components/DateTimeSection";
import DropdownSection from "../components/DropdownSection";
import CustomerInfoSection from "../components/CustomerInfoSection";
import ItemDetailsSection from "../components/ItemDetailsSection";
import BillDetailsSection from "../components/BillDetailsSection";
import { venueApi } from "../services/venueApi";
import { initialDataApi } from "../services/initialDataApi";
import bookingApi from "../services/bookingApi";
import MakeInvoiceDialog from "../components/MakeInvoiceDialog";
import MakeReceiptDialog from "../components/MakeReceiptDialog";
import ReceiptPrintDialog from "../components/ReceiptPrintDialog";

/* ----------------------- Safe Session Storage ------------------------ */
const safeSessionStorage = {
    getItem: (key) => {
        try {
            return sessionStorage.getItem(key);
        } catch (error) {
            console.error(`Error reading ${key} from sessionStorage:`, error);
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            sessionStorage.setItem(key, value);
        } catch (error) {
            console.error(`Error writing ${key} to sessionStorage:`, error);
        }
    },
    removeItem: (key) => {
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing ${key} from sessionStorage:`, error);
        }
    },
    // Receipt Storage
    getReceipts: (quotId) => {
        try {
            return sessionStorage.getItem(`receipts_${quotId}`);
        } catch (error) {
            console.error(`Error reading receipts for ${quotId} from sessionStorage:`, error);
            return null;
        }
    },
    setReceipts: (quotId, value) => {
        try {
            sessionStorage.setItem(`receipts_${quotId}`, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing receipts for ${quotId} to sessionStorage:`, error);
        }
    }
};

/* ----------------------- Custom Hooks ------------------------ */
// Debounce
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setDebouncedValue(value), delay);
        return () => timeoutRef.current && clearTimeout(timeoutRef.current);
    }, [value, delay]);

    return debouncedValue;
};

// rAF throttle
const useRafThrottle = (fn) => {
    const ticking = useRef(false);
    const lastArgs = useRef(null);

    return useCallback((...args) => {
        lastArgs.current = args;
        if (ticking.current) return;
        ticking.current = true;
        requestAnimationFrame(() => {
            ticking.current = false;
            fn(...lastArgs.current);
        });
    }, [fn]);
};

// Toast ID generator


// Safe toast wrapper
// Simple toast wrapper
const useSafeToast = () => {
    return useMemo(() => ({
        error: (message, options = {}) => {
            try {
                // Use a simple unique ID
                toast.error(message, {
                    toastId: `error-${Date.now()}-${Math.random()}`,
                    ...options
                });
            } catch (error) {
                console.error('Toast error:', error);
            }
        },
        success: (message, options = {}) => {
            try {
                toast.success(message, {
                    toastId: `success-${Date.now()}-${Math.random()}`,
                    ...options
                });
            } catch (error) {
                console.error('Toast error:', error);
            }
        },
        info: (message, options = {}) => {
            try {
                toast.info(message, {
                    toastId: `info-${Date.now()}-${Math.random()}`,
                    ...options
                });
            } catch (error) {
                console.error('Toast error:', error);
            }
        },
        warning: (message, options = {}) => {
            try {
                toast.warning(message, {
                    toastId: `warning-${Date.now()}-${Math.random()}`,
                    ...options
                });
            } catch (error) {
                console.error('Toast error:', error);
            }
        }
    }), []);
};

/* ----------------------- Balance Amount Component ------------------------ */
const BalanceAmountDisplay = ({ receipts, billAmount }) => {
    // Calculate total received amount
    const totalReceived = receipts.reduce((sum, receipt) => sum + (Number(receipt.Amount) || 0), 0);

    // Calculate outstanding amount
    const outstandingAmount = Math.max(0, billAmount - totalReceived);

    return (
        <div className="balance-amount-display">
            <div className="balance-amount-content">
                <div className="balance-row">
                    <span className="balance-label">Balance:</span>
                    <span className="balance-value balance-amount">
                        ₹{outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                {receipts && receipts.length > 0 && (
                    <>
                        <div className="balance-row outstanding">
                            <span className="balance-label">Bill Amount:</span>
                            <span className="balance-value bill-amount">
                                ₹{billAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="balance-row">
                            <span className="balance-label">Received:</span>
                            <span className="balance-value received-amount">
                                ₹{totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

/* ----------------------- Receipts Table Component ------------------------ */
const ReceiptsTable = ({ receipts, onDeleteReceipt, onPrintReceipt, isDeleting, isPrinting }) => {
    if (!receipts || receipts.length === 0) {
        return (
            <div className="receipts-section">
                <h3 className="sectionTitle">
                    <LuReceiptIndianRupee style={{ marginRight: 8, color: '#ffffffff' }} size={20} />
                    Receipts
                </h3>
                <div className="no-receipts-message">
                    No receipts found for this quotation.
                </div>
            </div>
        );
    }

    // Calculate total received amount
    const totalReceived = receipts.reduce((sum, receipt) => sum + (Number(receipt.Amount) || 0), 0);

    return (
        <div className="receipts-section">
            <h3 className="sectionTitle">
                <LuReceiptIndianRupee style={{ marginRight: 8, color: '#ffffffff' }} size={20} />
                Receipts ({receipts.length})
            </h3>

            <div className="receipts-table-container">
                <table className="receipts-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Voucher No</th>
                            <th>Amount</th>
                            <th>Payment Mode</th>
                            <th>Account</th>
                            <th>Discount</th>
                            <th>TDS</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receipts.map((receipt, index) => (
                            <tr key={index}>
                                <td>{receipt.Date || '-'}</td>
                                <td>{receipt.VoucherNo || '-'}</td>
                                <td className="amount-cell">₹{Number(receipt.Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td>{receipt.PayName || '-'}</td>
                                <td>{receipt.AccountName || '-'}</td>
                                <td className="amount-cell">₹{Number(receipt.Discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="amount-cell">₹{Number(receipt.TDS || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="receipt-btns">
                                    <button
                                        type="button"
                                        className="delete-receipt-btn"
                                        onClick={() => onDeleteReceipt(receipt.VoucherId, receipt.VoucherNo)}
                                        disabled={isDeleting}
                                        title="Delete Receipt"
                                    >
                                        {isDeleting ? (
                                            <div className="loading-spinner-small"></div>
                                        ) : (
                                            <FaTrash size={14} />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="print-receipt"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onPrintReceipt && onPrintReceipt(receipt);
                                        }}
                                        disabled={isPrinting}
                                        title="Print Receipt"
                                    >
                                        {isPrinting ? (
                                            <div className="loading-spinner-small"></div>
                                        ) : (
                                            <FaPrint size={14} color="#ffffff" />
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="receipts-total-row">
                            <td colSpan="2"><strong>Total Received:</strong></td>
                            <td className="amount-cell total-amount">
                                <strong>₹{totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            </td>
                            <td colSpan="5"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};


/* ----------------------- Component ---------------------- */
function NewBooking() {

    const navigate = useNavigate();
    const location = useLocation();
    const safeToast = useSafeToast();
    // State declarations   
    const [billingCompanies, setBillingCompanies] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [venues, setVenues] = useState([]);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [openSaveConfirm, setOpenSaveConfirm] = useState(false);
    const [openPrintConfirm, setOpenPrintConfirm] = useState(false);
    const [otherCharges, setOtherCharges] = useState("");
    const [settlementDiscount, setSettlementDiscount] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [savedQuotationId, setSavedQuotationId] = useState(null);
    const [savedBillId, setSavedBillId] = useState(null);
    const [showOtherAttendedBy, setShowOtherAttendedBy] = useState(false);
    const [otherAttendedByValue, setOtherAttendedByValue] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    // State variables for invoice/receipt functionality
    const [isMakingInvoice, setIsMakingInvoice] = useState(false);
    const [isMakingReceipt, setIsMakingReceipt] = useState(false);
    const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
    const [invoiceWithPrint, setInvoiceWithPrint] = useState(false);
    const [openReceiptDialog, setOpenReceiptDialog] = useState(false);

    // Was this booking started from Enquiry?
    const fromEnquiry = !!(
        location.state?.fromEnquiry ||
        location.state?.from === "enquiry" ||
        location.state?.mode === "enquiry" ||
        location.state?.mode === "from-enquiry"
    );


    // Where should "Back" go to?
    const [backToPath, setBackToPath] = useState(() => {
        return safeSessionStorage.getItem("bookingBackTo") || null;
    });

    // Keep them in sync with location.state (first open from enquiry)
    useEffect(() => {
        const st = location.state || {};

        if (
            st.fromEnquiry ||
            st.from === "enquiry" ||
            st.mode === "enquiry" ||
            st.mode === "from-enquiry"
        ) {
            // setFromEnquiry(true);
            safeSessionStorage.setItem("fromEnquiry", "true");
        }

        if (st.backTo) {
            setBackToPath(st.backTo);
            safeSessionStorage.setItem("bookingBackTo", st.backTo);
        }
    }, [location.state]);

    // Date Validation State
    const [dateValidation, setDateValidation] = useState({
        isValid: true,
        error: null
    });

    // Persist edit mode across navigation
    const [isEditMode, setIsEditMode] = useState(() => {
        return safeSessionStorage.getItem("isEditMode") === "true";
    });

    const [editingBillId, setEditingBillId] = useState(() => {
        return safeSessionStorage.getItem("editingBillId") || null;
    });
    const [editingQuotId, setEditingQuotId] = useState(() => {
        return safeSessionStorage.getItem("editingQuotId") || null;
    });

    // Receipts state
    // Receipts state
    const [receipts, setReceipts] = useState([]);
    const [isDeletingReceipt, setIsDeletingReceipt] = useState(false);
    const [deleteReceiptConfirm, setDeleteReceiptConfirm] = useState({
        open: false,
        receipt: null,
    });
    const [receiptDialogMeta, setReceiptDialogMeta] = useState(null);

    // NEW: print dialog state
    const [openReceiptPrintDialog, setOpenReceiptPrintDialog] = useState(false);
    const [printReceiptData, setPrintReceiptData] = useState(null);
    const [isLoadingReceiptPrint, setIsLoadingReceiptPrint] = useState(false);


    // Refs for direct DOM access
    const entryDateRef = useRef(null);
    const entryTimeRef = useRef(null);
    const billingCompanyRef = useRef(null);
    const attendedByRef = useRef(null);
    const statusRef = useRef(null);
    const partyNameRef = useRef(null);
    const companyNameRef = useRef(null);
    const functionNameRef = useRef(null);
    const venueRef = useRef(null);
    const minPeopleRef = useRef(null);
    const maxPeopleRef = useRef(null);
    const itemDetailsSectionRef = useRef(null);
    const servingNameRef = useRef(null);
    const enquiryAppliedRef = useRef(false);


    // Internal refs
    const hasInitializedRef = useRef(false);
    const userSetBookingDateRef = useRef(false);
    const userSetBookingTimeRef = useRef(false);
    const hasLoadedFromSessionRef = useRef(false);
    const userSetBookingToRef = useRef(false);
    const userSetItemDateRef = useRef(false);
    const processedStateRef = useRef(new Set());
    const bookingDataRef = useRef(null);
    const currentItemRef = useRef(null);
    const isAddingItemRef = useRef(false);
    // receipt print
    const handleOpenReceiptPrint = useCallback(
        async (receipt) => {
            if (!receipt || !receipt.VoucherId) {
                safeToast.error("Invalid receipt selected for printing");
                return;
            }

            try {
                setIsLoadingReceiptPrint(true);
                setPrintReceiptData(null);

                const hotelId =
                    localStorage.getItem("hotel_id") ||
                    location.state?.quotationMeta?.hotel_id;

                if (!hotelId) {
                    safeToast.error("Hotel ID not found. Please login again.");
                    return;
                }

                const apiUrl = `/banquetapi/get_receipt_details.php?hotel_id=${hotelId}&vo_id=${receipt.VoucherId}&quot_id=${editingQuotId || ""}`;

                console.log("📡 Fetch receipt for print:", apiUrl);
                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const json = await res.json();
                const details = json?.result?.[0];

                if (!details) {
                    safeToast.error("No receipt details found to print");
                    return;
                }

                setPrintReceiptData(details);
                setOpenReceiptPrintDialog(true);
            } catch (err) {
                console.error("❌ Error fetching receipt for print:", err);
                safeToast.error("Failed to load receipt for printing");
            } finally {
                setIsLoadingReceiptPrint(false);
            }
        },
        [safeToast, location.state, editingQuotId]
    );

    // const handleReceiptPrintNow = useCallback(() => {
    //     if (!printReceiptData) return;

    //     const format = (v) => {
    //         const num = Number(v);
    //         return Number.isFinite(num) ? num.toFixed(2) : "0.00";
    //     };

    //     try {
    //         const title = `Receipt-${printReceiptData.VoucherNo || ""}`;
    //         const printWindow = window.open("", "_blank", "width=900,height=650");

    //         if (!printWindow) {
    //             safeToast.error("Popup blocked. Please allow popups to print.");
    //             return;
    //         }

    //         const doc = printWindow.document;
    //         doc.write(`
    //         <html>
    //         <head>
    //             <title>${title}</title>
    //             <style>
    //                 body { font-family: Arial, sans-serif; margin: 0; padding: 16px; }
    //                 .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 16px 20px; }
    //                 .receipt-header { text-align: center; margin-bottom: 16px; }
    //                 .receipt-header h2 { margin: 0 0 4px 0; }
    //                 .receipt-meta, .receipt-party { font-size: 14px; margin-bottom: 8px; }
    //                 .receipt-meta div, .receipt-party div { margin-bottom: 2px; }
    //                 table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    //                 td { padding: 4px 0; }
    //                 td.amount { text-align: right; }
    //                 tr.total-row td { border-top: 1px solid #000; font-weight: bold; padding-top: 6px; }
    //                 .footer { margin-top: 16px; font-size: 13px; }
    //             </style>
    //         </head>
    //         <body>
    //             <div class="receipt-container">
    //                 <div class="receipt-header">
    //                     <h2>RECEIPT</h2>
    //                     <div>Receipt No: ${printReceiptData.VoucherNo || ""}</div>
    //                 </div>
    //                 <div class="receipt-meta">
    //                     <div><strong>Date:</strong> ${printReceiptData.Date || ""}</div>
    //                     <div><strong>Quotation No:</strong> ${printReceiptData.QuotationNo || ""}</div>
    //                 </div>
    //                 <div class="receipt-party">
    //                     <div><strong>Party:</strong> ${printReceiptData.PartyName || ""}</div>
    //                     ${printReceiptData.Address ? `<div><strong>Address:</strong> ${printReceiptData.Address}</div>` : ""}
    //                     ${printReceiptData.MobileNo ? `<div><strong>Mobile:</strong> ${printReceiptData.MobileNo}</div>` : ""}
    //                 </div>
    //                 <table>
    //                     <tbody>
    //                         <tr><td>Package Charges</td><td class="amount">${format(printReceiptData.PackageCharges)}</td></tr>
    //                         ${Number(printReceiptData.VenueCharges) ? `<tr><td>Venue Charges</td><td class="amount">${format(printReceiptData.VenueCharges)}</td></tr>` : ""}
    //                         ${Number(printReceiptData.OtherCharges) ? `<tr><td>Other Charges</td><td class="amount">${format(printReceiptData.OtherCharges)}</td></tr>` : ""}
    //                         <tr><td>Sub Total</td><td class="amount">${format(printReceiptData.SubTotal)}</td></tr>
    //                         ${Number(printReceiptData.Discount) ? `<tr><td>Discount</td><td class="amount">-${format(printReceiptData.Discount)}</td></tr>` : ""}
    //                         ${Number(printReceiptData.Taxable) ? `<tr><td>Taxable</td><td class="amount">${format(printReceiptData.Taxable)}</td></tr>` : ""}
    //                         ${Number(printReceiptData.Tax) ? `<tr><td>Tax</td><td class="amount">${format(printReceiptData.Tax)}</td></tr>` : ""}
    //                         ${Number(printReceiptData.ExtraCharges) ? `<tr><td>Extra Charges</td><td class="amount">${format(printReceiptData.ExtraCharges)}</td></tr>` : ""}
    //                         ${Number(printReceiptData.RoundOff) ? `<tr><td>Round Off</td><td class="amount">${format(printReceiptData.RoundOff)}</td></tr>` : ""}
    //                         <tr><td>Received</td><td class="amount">${format(printReceiptData.Received)}</td></tr>
    //                         <tr class="total-row"><td>Bill Amount</td><td class="amount">${format(printReceiptData.BillAmount)}</td></tr>
    //                     </tbody>
    //                 </table>
    //                 <div class="footer">
    //                     <div><strong>Mode:</strong> ${printReceiptData.Paymode || ""} ${printReceiptData.Account ? `(${printReceiptData.Account})` : ""}</div>
    //                     ${printReceiptData.Note ? `<div><strong>Note:</strong> ${printReceiptData.Note}</div>` : ""}
    //                 </div>
    //             </div>
    //         </body>
    //         </html>
    //     `);
    //         doc.close();
    //         printWindow.focus();
    //         printWindow.print();

    //         // close the popup dialog
    //         setOpenReceiptPrintDialog(false);
    //     } catch (err) {
    //         console.error("❌ Error printing receipt:", err);
    //         safeToast.error("Failed to print receipt");
    //     }
    // }, [printReceiptData, safeToast, setOpenReceiptPrintDialog]);

    /* ----------------------- Field Highlighting Functions ------------------------ */
    const highlightInvalidField = useCallback((validation) => {
        let element = null;

        if (validation.ref?.current) {
            element = validation.ref.current;
        } else if (validation.selector) {
            element = document.querySelector(validation.selector);
        } else if (validation.id) {
            element = document.getElementById(validation.id);
        }

        if (element) {
            // Add error classes
            element.classList.add("field-error-highlight");
            element.classList.add("shake-error");

            // Add error styling based on element type
            if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
                element.classList.add("input-error");
            }

            // Store the field name for later reference
            element.setAttribute('data-invalid-field', validation.field);

            // Remove shake animation after it completes
            setTimeout(() => {
                element.classList.remove("shake-error");
            }, 1000);
        }
    }, []);

    const clearFieldHighlights = useCallback(() => {
        // Remove highlights from all fields
        const highlightedElements = document.querySelectorAll('.field-error-highlight, .input-error, .shake-error');
        highlightedElements.forEach(element => {
            element.classList.remove('field-error-highlight', 'input-error', 'shake-error');
            element.removeAttribute('data-invalid-field');

            // Also remove error styling from Material UI fields
            if (element.closest('.MuiTextField-root')) {
                element.closest('.MuiTextField-root').classList.remove('Mui-error');
            }
        });
    }, []);

    const scrollToField = useCallback((validation) => {
        let elementToScroll = null;

        if (validation.ref?.current) {
            elementToScroll = validation.ref.current;
        } else if (validation.selector) {
            elementToScroll = document.querySelector(validation.selector);
        } else if (validation.id) {
            elementToScroll = document.getElementById(validation.id);
        }

        if (elementToScroll) {
            setTimeout(() => {
                elementToScroll.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest"
                });

                // Add shake animation for better visual feedback
                elementToScroll.classList.add("shake-error");
                setTimeout(() => {
                    elementToScroll.classList.remove("shake-error");
                }, 1500);

                // Focus if it's an input element
                if (elementToScroll.focus &&
                    (elementToScroll.tagName === 'INPUT' ||
                        elementToScroll.tagName === 'SELECT' ||
                        elementToScroll.tagName === 'TEXTAREA')) {
                    elementToScroll.focus();
                }
            }, 100);
        }
    }, []);
    // Default data
    const defaultItem = useMemo(() => ({
        itemDate: dayjs(),
        itemName: "",
        quantity: "1",
        rate: "",
        description: "",
        discount: "",
        taxPercent: "",
        taxName: "",
    }), []);

    const defaultBookingData = useMemo(() => ({
        entryDate: dayjs(),
        entryTime: dayjs(),
        bookingFromDate: dayjs(),
        bookingFromTime: dayjs(),
        bookingToDate: dayjs(),
        bookingToTime: dayjs(),
        billingCompany: "",
        attendedBy: "",
        status: "",
        customer: {
            partyName: "",
            companyName: "",
            functionName: "",
            email: "",
            phone: "",
            partyId: "",
            companyId: "",
            functionId: "",
        },
        eventDetails: {
            venue: "",
            venueId: "",
            servingName: "",
            servingAddress: "",
            servingId: "",
            minPeople: "",
            maxPeople: "",
        },
        itemDetails: [],
    }), []);

    /* ----------------------- Date Validation Functions ------------------------ */
    /* ----------------------- Enhanced Date Validation ------------------------ */
    const validateDateTimeRange = useCallback((fromDate, fromTime, toDate, toTime) => {
        if (!fromDate || !fromTime || !toDate || !toTime) {
            return { isValid: true };
        }

        const fromDateTime = dayjs(fromDate)
            .hour(dayjs(fromTime).hour())
            .minute(dayjs(fromTime).minute())
            .second(dayjs(fromTime).second());

        const toDateTime = dayjs(toDate)
            .hour(dayjs(toTime).hour())
            .minute(dayjs(toTime).minute())
            .second(dayjs(toTime).second());

        const isValid = toDateTime.isAfter(fromDateTime) || toDateTime.isSame(fromDateTime);

        // Highlight date fields if invalid
        if (!isValid) {
            const dateSection = document.querySelector('.pickers');
            if (dateSection) {
                dateSection.classList.add('section-error-highlight');
                setTimeout(() => {
                    dateSection.classList.remove('section-error-highlight');
                }, 3000);
            }
        } else {
            // Remove highlighting if valid
            const dateSection = document.querySelector('.pickers');
            if (dateSection) {
                dateSection.classList.remove('section-error-highlight');
            }
        }

        return {
            isValid,
            error: isValid ? null : "Booking To date/time cannot be earlier than Booking From date/time"
        };
    }, []);

    const getMinToDate = useCallback((fromDate) => {
        return fromDate || dayjs();
    }, []);

    const getMinToTime = useCallback((fromDate, fromTime, toDate) => {
        if (!fromDate || !toDate) return null;

        const isSameDate = dayjs(fromDate).isSame(toDate, 'day');
        if (isSameDate && fromTime) {
            return fromTime;
        }
        return null;
    }, []);

    /* ----------------------- Core Functions ------------------------ */
    const clearAllSessionData = useCallback(() => {
        const itemsToRemove = [
            "bookingData", "currentItem", "partyId", "partyName", "partyPhone", "partyEmail",
            "functionId", "functionName", "companyId", "companyName", "venueId", "venueName",
            "servingId", "servingName", "scrollPosition",
            "isEditMode", "editingQuotId", "editingBillId",
            "fromEnquiry", "bookingBackTo",        // <-- add these
        ];


        itemsToRemove.forEach(item => safeSessionStorage.removeItem(item));

        // Preserve receipts if in edit mode
        if (isEditMode && editingQuotId) {
            console.log("💾 Preserving receipts during clear");
            const currentReceipts = safeSessionStorage.getReceipts(editingQuotId);
            if (currentReceipts) {
                console.log("📋 Receipts preserved for edit mode");
            }
        }

        console.log("🧹 Cleared non-receipt session data");
    }, [isEditMode]);

    const refreshReceipts = useCallback(async () => {
        try {
            if (!editingQuotId) return;
            const hotelId = localStorage.getItem("hotel_id") || location.state?.quotationMeta?.hotel_id;
            if (!hotelId) return;

            const apiUrl = `/banquetapi/get_quot_details.php?quot_id=${editingQuotId}&hotel_id=${hotelId}`;
            console.log("📡 Refresh receipts only:", apiUrl);
            const res = await fetch(apiUrl);
            const data = await res.json();

            const newReceipts = data?.receipts || [];
            setReceipts(newReceipts);
            safeSessionStorage.setReceipts(editingQuotId, newReceipts);

            console.log("✅ Receipts refreshed:", newReceipts.length);
        } catch (err) {
            console.error("❌ Error refreshing receipts:", err);
        }
    }, [editingQuotId, location.state]);

    // State with session persistence and calendar date application
    const [bookingData, _setBookingData] = useState(() => {
        let initial = defaultBookingData;

        // Check for calendar date from navigation state during init
        const fromCalendarDate = location.state?.fromCalendarDate;
        if (fromCalendarDate && !isEditMode) {
            const clicked = dayjs(fromCalendarDate);
            if (clicked.isValid()) {
                console.log("📅 Applying calendar date during state init:", clicked.format("YYYY-MM-DD"));

                // Preserve time from defaults
                const fromTimeBase = dayjs(initial.bookingFromTime || initial.bookingFromDate);
                const toTimeBase = dayjs(initial.bookingToTime || initial.bookingToDate);

                const bookingFromDate = clicked
                    .hour(fromTimeBase.hour())
                    .minute(fromTimeBase.minute())
                    .second(fromTimeBase.second());

                const bookingToDate = clicked
                    .hour(toTimeBase.hour())
                    .minute(toTimeBase.minute())
                    .second(toTimeBase.second());

                initial = {
                    ...initial,
                    bookingFromDate,
                    bookingToDate,
                };
            } else {
                console.warn("❌ Invalid fromCalendarDate during init:", fromCalendarDate);
            }
        } else {
            console.log("🔄 No calendar date in state during init, using defaults");
        }

        // Load from sessionStorage (if any), but prioritize calendar date
        try {
            const saved = safeSessionStorage.getItem("bookingData");
            if (saved) {
                const parsed = JSON.parse(saved);
                const data = {
                    ...initial,  // Calendar date takes priority
                    ...parsed,
                    entryDate: parsed.entryDate ? dayjs(parsed.entryDate) : initial.entryDate,
                    entryTime: parsed.entryTime ? dayjs(parsed.entryTime) : initial.entryTime,
                    bookingFromDate: parsed.bookingFromDate ? dayjs(parsed.bookingFromDate) : initial.bookingFromDate,
                    bookingFromTime: parsed.bookingFromTime ? dayjs(parsed.bookingFromTime) : initial.bookingFromTime,
                    bookingToDate: parsed.bookingToDate ? dayjs(parsed.bookingToDate) : initial.bookingToDate,
                    bookingToTime: parsed.bookingToTime ? dayjs(parsed.bookingToTime) : initial.bookingToTime,
                    customer: {
                        ...initial.customer,
                        ...parsed.customer
                    },
                    eventDetails: {
                        ...initial.eventDetails,
                        ...parsed.eventDetails
                    },
                    itemDetails: Array.isArray(parsed.itemDetails)
                        ? parsed.itemDetails.map((item) => ({
                            ...item,
                            itemDate: item.itemDate ? dayjs(item.itemDate) : dayjs(),
                            discount: Number(item.discount || 0),
                        }))
                        : [],
                };
                bookingDataRef.current = data;
                hasLoadedFromSessionRef.current = true;
                console.log("🔄 Loaded from sessionStorage during init");
                return data;
            }
        } catch (error) {
            console.error("Error parsing saved booking data during init:", error);
            safeSessionStorage.removeItem("bookingData");
        }

        bookingDataRef.current = initial;
        return initial;
    });

    const [currentItem, _setCurrentItem] = useState(() => {
        let initial = defaultItem;

        // Apply calendar date to itemDate during init
        const fromCalendarDate = location.state?.fromCalendarDate;
        if (fromCalendarDate && !isEditMode) {
            const clicked = dayjs(fromCalendarDate);
            if (clicked.isValid()) {
                initial = { ...initial, itemDate: clicked };
            }
        }

        try {
            const saved = safeSessionStorage.getItem("currentItem");
            if (saved) {
                const parsed = JSON.parse(saved);
                const restored = {
                    ...initial,  // Calendar date takes priority
                    ...parsed,
                    itemDate: parsed.itemDate ? dayjs(parsed.itemDate) : initial.itemDate,
                };
                currentItemRef.current = restored;
                return restored;
            }
        } catch (error) {
            console.error("Error restoring currentItem during init:", error);
        }
        currentItemRef.current = initial;
        return initial;
    });

    // Optimized state setters
    const setBookingData = useCallback((updater) => {
        _setBookingData((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            if (next === prev) return prev;
            bookingDataRef.current = next;
            return next;
        });
    }, []);

    const setCurrentItem = useCallback((updater) => {
        _setCurrentItem((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            if (next === prev) return prev;
            currentItemRef.current = next;
            return next;
        });
    }, []);

    // Ref collections
    const refs = useMemo(() => ({
        venueRef, minPeopleRef, maxPeopleRef, itemDetailsSectionRef, servingNameRef,
        partyNameRef, companyNameRef, functionNameRef, billingCompanyRef, attendedByRef,
        statusRef, entryDateRef, entryTimeRef,
    }), []);

    /* ----------------------- Enhanced Date Change Handler ------------------------ */
    const throttledDateChange = useRafThrottle((name, value) => {
        setBookingData((prev) => {
            const prevVal = prev[name];
            const isSame = (dayjs.isDayjs(prevVal) || prevVal?._isAMomentObject) &&
                (dayjs.isDayjs(value) || value?._isAMomentObject)
                ? dayjs(prevVal).valueOf() === dayjs(value).valueOf()
                : prevVal === value;
            if (isSame) return prev;
            return { ...prev, [name]: value };
        });
    });

    const handleDateChange = useCallback((name, value) => {
        if (name === "bookingFromDate") {
            userSetBookingDateRef.current = true;
            userSetBookingToRef.current = false;

            setBookingData((prev) => {
                const newFromDate = value;
                let newToDate = prev.bookingToDate;
                let newToTime = prev.bookingToTime;

                // If new fromDate is after current toDate, adjust toDate
                if (newFromDate && newToDate && dayjs(newFromDate).isAfter(dayjs(newToDate), 'day')) {
                    newToDate = newFromDate;
                    // Also adjust toTime if on the same day
                    if (prev.bookingFromTime && newToDate.isSame(newFromDate, 'day')) {
                        newToTime = prev.bookingFromTime;
                    }
                }

                return {
                    ...prev,
                    bookingFromDate: newFromDate,
                    bookingToDate: newToDate,
                    bookingToTime: newToTime,
                };
            });

            if (!userSetItemDateRef.current) {
                setCurrentItem((prev) => ({ ...prev, itemDate: value }));
            }
            return;
        }

        if (name === "bookingFromTime") {
            userSetBookingTimeRef.current = true;
            userSetBookingToRef.current = false;

            setBookingData((prev) => {
                const newFromTime = value;
                let newToTime = prev.bookingToTime;

                // If dates are the same and new fromTime is after current toTime, adjust toTime
                if (prev.bookingFromDate && prev.bookingToDate &&
                    dayjs(prev.bookingFromDate).isSame(prev.bookingToDate, 'day') &&
                    newFromTime && newToTime &&
                    dayjs(newFromTime).isAfter(dayjs(newToTime))) {
                    newToTime = newFromTime;
                }

                return {
                    ...prev,
                    bookingFromTime: newFromTime,
                    bookingToTime: newToTime,
                };
            });
            return;
        }

        if (name === "bookingToDate") {
            userSetBookingToRef.current = true;

            setBookingData((prev) => {
                const newToDate = value;
                let newToTime = prev.bookingToTime;

                // If toDate is same as fromDate and toTime is before fromTime, adjust toTime
                if (prev.bookingFromDate && newToDate &&
                    dayjs(prev.bookingFromDate).isSame(newToDate, 'day') &&
                    prev.bookingFromTime && newToTime &&
                    dayjs(newToTime).isBefore(dayjs(prev.bookingFromTime))) {
                    newToTime = prev.bookingFromTime;
                }

                return {
                    ...prev,
                    bookingToDate: newToDate,
                    bookingToTime: newToTime,
                };
            });
        }

        if (name === "bookingToTime") {
            userSetBookingToRef.current = true;
            throttledDateChange(name, value);
            return;
        }

        if (name === "itemDate") {
            userSetItemDateRef.current = true;
            setCurrentItem((prev) => ({ ...prev, itemDate: value }));
            return;
        }

        throttledDateChange(name, value);
    }, [throttledDateChange, setBookingData, setCurrentItem]);

    /* ----------------------- Effects ------------------------ */

    // 1. Calendar date cleanup effect
    useEffect(() => {
        if (location.state?.fromCalendarDate && !isEditMode) {
            console.log("🧹 Clearing stale sessionStorage for new calendar navigation");
            clearAllSessionData();
        }
    }, [location.state, isEditMode, clearAllSessionData]);

    // 2. Load receipts from session storage on component mount if in edit mode
    useEffect(() => {
        if (isEditMode && editingQuotId && !receipts.length) {
            const savedReceipts = safeSessionStorage.getReceipts(editingQuotId);
            if (savedReceipts) {
                try {
                    const parsedReceipts = JSON.parse(savedReceipts);
                    setReceipts(Array.isArray(parsedReceipts) ? parsedReceipts : []);
                    console.log("📋 Loaded receipts from session storage:", parsedReceipts.length);
                } catch (error) {
                    console.error("Error parsing saved receipts:", error);
                    setReceipts([]);
                }
            }
        }
    }, [isEditMode, editingQuotId, receipts.length]);

    // 3. Receipts preservation effect
    useEffect(() => {
        if (isEditMode && editingQuotId && receipts.length > 0) {
            safeSessionStorage.setReceipts(editingQuotId, receipts);
            console.log(`💾 Saved ${receipts.length} receipts to session storage for ${editingQuotId}`);
        }
    }, [receipts, isEditMode, editingQuotId]);

    // 4. Date validation effect
    useEffect(() => {
        const validation = validateDateTimeRange(
            bookingData.bookingFromDate,
            bookingData.bookingFromTime,
            bookingData.bookingToDate,
            bookingData.bookingToTime
        );

        setDateValidation(validation);
    }, [
        bookingData.bookingFromDate,
        bookingData.bookingFromTime,
        bookingData.bookingToDate,
        bookingData.bookingToTime,
        validateDateTimeRange
    ]);

    // 5. Only *enable* edit mode when router explicitly says so.
    useEffect(() => {
        if (location.state?.mode === "edit") {
            setIsEditMode(true);
            safeSessionStorage.setItem("isEditMode", "true");
        }
    }, [location.state]);

    // 6. Session restore effect (Customer/Event details)
    useEffect(() => {
        const storedPartyId = safeSessionStorage.getItem("partyId");
        const storedPartyName = safeSessionStorage.getItem("partyName");
        const storedPartyPhone = safeSessionStorage.getItem("partyPhone");
        const storedPartyEmail = safeSessionStorage.getItem("partyEmail");
        const storedFunctionId = safeSessionStorage.getItem("functionId");
        const storedFunctionName = safeSessionStorage.getItem("functionName");
        const storedCompanyId = safeSessionStorage.getItem("companyId");
        const storedCompanyName = safeSessionStorage.getItem("companyName");
        const storedVenueId = safeSessionStorage.getItem("venueId");
        const storedVenueName = safeSessionStorage.getItem("venueName");
        const storedServingId = safeSessionStorage.getItem("servingId");
        const storedServingName = safeSessionStorage.getItem("servingName");

        setBookingData(prev => ({
            ...prev,
            customer: {
                ...prev.customer,
                partyId: storedPartyId || prev.customer.partyId,
                partyName: storedPartyName || prev.customer.partyName,
                phone: storedPartyPhone || prev.customer.phone,
                email: storedPartyEmail || prev.customer.email,
                companyId: storedCompanyId || prev.customer.companyId,
                companyName: storedCompanyName || prev.customer.companyName,
                functionId: storedFunctionId || prev.customer.functionId,
                functionName: storedFunctionName || prev.customer.functionName,
            },
            eventDetails: {
                ...prev.eventDetails,
                venue: storedVenueName || prev.eventDetails.venue,
                venueId: storedVenueId || prev.eventDetails.venueId,
                servingName: storedServingName || prev.eventDetails.servingName,
                servingId: storedServingId || prev.eventDetails.servingId,
            },
        }));
    }, [setBookingData]);

    // 7. Location state handling with protection
    // 7. Location state handling with protection - FIXED
    useEffect(() => {
        const stateKey = `${location.key}-${JSON.stringify(location.state)}`;
        if (processedStateRef.current.has(stateKey)) {
            console.log('🔄 Skipping already processed state');
            return;
        }

        processedStateRef.current.add(stateKey);

        // Use timeout to ensure component stability
        setTimeout(() => {
            const {
                selectedItem, selectedMenus, updatedMenus,
                editingIndex: locationEditingIndex, // Rename to avoid conflict
                partyName, companyName, functionName, servingData, isEditingMenus,
            } = location.state || {};

            console.log('🔄 Processing location state:', location.state);

            // Handle menu updates
            if (isEditingMenus && typeof locationEditingIndex === "number") {
                console.log('📝 Processing menu update for index:', locationEditingIndex);

                setBookingData((prev) => {
                    const updated = [...prev.itemDetails];
                    if (updated[locationEditingIndex]) {
                        updated[locationEditingIndex] = {
                            ...updated[locationEditingIndex],
                            selectedMenus: selectedMenus || updatedMenus || {},
                        };
                        console.log('✅ Updated item with menus:', updated[locationEditingIndex]);
                    }
                    return { ...prev, itemDetails: updated };
                });

                setEditingIndex(null);

                setTimeout(() => {
                    safeToast.success("🍽 Menus updated successfully!", {
                        autoClose: 2000
                    });
                }, 100);

                navigate(".", { replace: true, state: {} });
                return;
            }

            // Handle new item selection
            if (selectedItem && !isEditingMenus) {
                console.log('📝 Setting current item from location state:', {
                    itemName: selectedItem.Name,
                    rate: selectedItem.Rate,
                    taxPercent: selectedItem.TaxPer
                });

                setCurrentItem((prev) => ({
                    ...prev,
                    itemName: selectedItem.Name ?? prev.itemName,
                    rate: Number(selectedItem.Rate ?? prev.rate) || prev.rate,
                    taxPercent: Number(selectedItem.TaxPer ?? prev.taxPercent) || prev.taxPercent,
                    taxName: selectedItem.TaxName ?? prev.taxName,
                    itemPackage: selectedItem.PackageId ?? prev.itemPackage,
                    unit: selectedItem.Unit ?? prev.unit,
                    cats: selectedItem.cats ?? prev.cats,
                    selectedMenus: selectedMenus || {},
                    itemDate: location.state.itemDate ? dayjs(location.state.itemDate) : prev.itemDate,
                }));

                // Scroll to item section when item is selected
                setTimeout(() => {
                    if (itemDetailsSectionRef.current) {
                        itemDetailsSectionRef.current.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                    }
                }, 100);
            }

            // Customer & Event details
            if (partyName || companyName || functionName || servingData) {
                setBookingData((prev) => ({
                    ...prev,
                    customer: {
                        ...prev.customer,
                        partyName: partyName ?? prev.customer.partyName,
                        companyName: companyName ?? prev.customer.companyName,
                        functionName: functionName ?? prev.customer.functionName,
                    },
                    eventDetails: {
                        ...prev.eventDetails,
                        servingName: servingData?.servingName ?? prev.eventDetails.servingName,
                        servingAddress: servingData?.servingAddress ?? prev.eventDetails.servingAddress,
                        minPeople: servingData?.minPeople ?? prev.eventDetails.minPeople,
                        maxPeople: servingData?.maxPeople ?? prev.eventDetails.maxPeople,
                    },
                }));
            }
        }, 0);

        // Cleanup processed states
        return () => {
            if (processedStateRef.current.size > 10) {
                const array = Array.from(processedStateRef.current);
                processedStateRef.current = new Set(array.slice(-5));
            }
        };
    }, [location.state, location.key, navigate, setBookingData, setCurrentItem, safeToast]);
    // 8. Load API Data
    useEffect(() => {
        const loadData = async () => {
            console.log("🔄 Running loadData effect");
            try {
                const [venuesData, initialData, statusData] = await Promise.all([
                    venueApi.getVenues(),
                    initialDataApi.getInitialData(),
                    initialDataApi.getStatuses(),
                ]);

                setVenues(venuesData || []);
                setBillingCompanies(initialData?.billingCompanies || []);
                setAttendees(initialData?.attendees || []);
                setStatuses(statusData || []);

                // Check for "other" attendedBy value
                if (bookingData.attendedBy && initialData?.attendees?.length > 0) {
                    const isInAttendees = initialData.attendees.some(
                        attendee => attendee.Name === bookingData.attendedBy
                    );
                    if (!isInAttendees) {
                        setShowOtherAttendedBy(true);
                        setOtherAttendedByValue(bookingData.attendedBy);
                    }
                }

                // Set server date/time once
                if (!hasInitializedRef.current && initialData && !hasLoadedFromSessionRef.current) {
                    hasInitializedRef.current = true;
                    let serverNow = dayjs();

                    if (initialData.serverDateTime) {
                        serverNow = dayjs(initialData.serverDateTime, "DD-MM-YYYY HH:mm:ss");
                    } else if (initialData.serverDate && initialData.serverTime) {
                        serverNow = dayjs(
                            `${initialData.serverDate} ${initialData.serverTime}`,
                            "DD-MM-YYYY HH:mm:ss"
                        );
                    } else if (initialData.serverDate || initialData.server_date) {
                        const serverDateValue = initialData.serverDate || initialData.server_date;
                        const now = dayjs();
                        const dateOnly = dayjs(serverDateValue, "DD-MM-YYYY");
                        serverNow = dateOnly.hour(now.hour()).minute(now.minute()).second(now.second());
                    }

                    setBookingData((prev) => {
                        const update = {
                            entryDate: serverNow,
                            entryTime: serverNow,
                        };

                        // FIX: Only set booking dates if NOT coming from calendar
                        if (!location.state?.fromCalendarDate) {
                            update.bookingFromDate = serverNow;
                            update.bookingFromTime = serverNow;
                            update.bookingToDate = serverNow;
                            update.bookingToTime = serverNow;
                        } else {
                            console.log("🚫 Skipped overwriting booking dates in loadData (from calendar)");
                        }

                        return { ...prev, ...update };
                    });
                }

            } catch (err) {
                console.error("Error fetching API data:", err);
                safeToast.error("Server down! Please try again.");
            }
        };

        loadData();
    }, [setBookingData, bookingData.attendedBy, safeToast, location.state]);

    // 9. Session storage persistence (Booking Data)
    const debouncedBookingData = useDebounce(bookingData, 600);

    useEffect(() => {
        try {
            const d = debouncedBookingData;
            const saveData = {
                ...d,
                entryDate: d.entryDate?.toISOString() || null,
                entryTime: d.entryTime?.toISOString() || null,
                bookingFromDate: d.bookingFromDate?.toISOString() || null,
                bookingFromTime: d.bookingFromTime?.toISOString() || null,
                bookingToDate: d.bookingToDate?.toISOString() || null,
                bookingToTime: d.bookingToTime?.toISOString() || null,
                itemDetails: d.itemDetails.map((item) => ({
                    ...item,
                    itemDate: item.itemDate?.toISOString() || null,
                    discount: Number(item.discount || 0),
                })),
            };
            safeSessionStorage.setItem("bookingData", JSON.stringify(saveData));
        } catch (error) {
            console.error("Error saving to sessionStorage:", error);
        }
    }, [debouncedBookingData]);

    // Session storage persistence (Current Item)
    useEffect(() => {
        try {
            safeSessionStorage.setItem(
                "currentItem",
                JSON.stringify({
                    ...currentItem,
                    itemDate: currentItem.itemDate?.toISOString() || null,
                })
            );
        } catch (error) {
            console.error("Error saving currentItem:", error);
        }
    }, [currentItem]);

    // 10. Track dirty state
    useEffect(() => {
        const savedBooking = safeSessionStorage.getItem("bookingData");
        const savedItem = safeSessionStorage.getItem("currentItem");

        const current = JSON.stringify({
            bookingData,
            currentItem,
            otherCharges,
            settlementDiscount,
            showOtherAttendedBy,
            otherAttendedByValue,
        });

        const saved = JSON.stringify({
            bookingData: savedBooking ? JSON.parse(savedBooking) : null,
            currentItem: savedItem ? JSON.parse(savedItem) : null,
            otherCharges,
            settlementDiscount,
            showOtherAttendedBy: false,
            otherAttendedByValue: "",
        });

        setIsDirty(current !== saved);
    }, [bookingData, currentItem, otherCharges, settlementDiscount, showOtherAttendedBy, otherAttendedByValue]);

    // 11. Scroll position restoration
    useEffect(() => {
        const savedScrollY = safeSessionStorage.getItem("scrollPosition");
        if (location.state && savedScrollY) {
            requestAnimationFrame(() => {
                window.scrollTo(0, parseInt(savedScrollY, 10));
            });
        } else {
            requestAnimationFrame(() => {
                window.scrollTo({ top: 0, behavior: "auto" });
                setTimeout(() => {
                    billingCompanyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    billingCompanyRef.current?.focus();
                }, 300);
            });
        }
    }, [location.key]);

    // 12. Hotel ID check
    useEffect(() => {
        const hotelId = localStorage.getItem("hotel_id");
        if (!hotelId) {
            safeToast.error("⚠️ No hotel ID found. Please login again.");
            navigate("/login");
        }
    }, [navigate, safeToast]);

    // 13. Editing mode setup (load quotation into form)
    useEffect(() => {
        const state = location.state;
        if (!state || state.mode !== "edit") {
            // Not coming from Edit – this is a new booking
            return;
        }

        const hotelId = state.quotationMeta?.hotel_id || localStorage.getItem("hotel_id");
        const quotId = state.quotationMeta?.quot_id;

        if (!hotelId || !quotId) {
            safeToast.error("Quotation details missing for edit!");
            return;
        }

        setIsEditMode(true);
        setEditingQuotId(quotId);

        // remember edit mode across navigation (party/company/function pages)
        safeSessionStorage.setItem("isEditMode", "true");
        safeSessionStorage.setItem("editingQuotId", String(quotId));
        const billIdFromState =
            state.quotationMeta?.bill_id ||
            state.quotationMeta?.BillId ||
            state.quotationMeta?.invoice_id ||
            state.quotationMeta?.InvoiceId ||
            null;

        if (billIdFromState) {
            setEditingBillId(String(billIdFromState));
            safeSessionStorage.setItem("editingBillId", String(billIdFromState));
        }

        const fetchQuotationDetails = async () => {
            try {
                const apiUrl = `/banquetapi/get_quot_details.php?quot_id=${quotId}&hotel_id=${hotelId}`;
                console.log("📡 Fetch quotation details:", apiUrl);

                const res = await fetch(apiUrl);
                const data = await res.json();
                console.log("📦 Quotation details response:", data);

                // Store receipts data
                setReceipts(data?.receipts || []);

                // Correct mapping according to your JSON
                const main = data?.result?.[0] || {};
                const event = data?.events?.[0] || {};

                // Map items_arr → itemDetails
                const itemDetailsFromApi = (event.items_arr || []).map((it) => ({
                    itemDate: it.Date ? dayjs(it.Date, "DD-MM-YYYY") : dayjs(),
                    itemName: it.ItemName || "",
                    quantity: it.Quantity || "1",
                    rate: it.Rate || "",
                    description: it.ItemNote || "",
                    discount: it.Discount || "",
                    taxPercent: it.TaxPer || "",
                    taxName: it.TaxName || "",
                    itemPackage: it.ItemId || "",
                    unit: it.Unit || "",
                    selectedMenus: {}, // no menus in this API
                    cats: [],
                }));

                const newBookingData = {
                    ...defaultBookingData,

                    // Entry date/time
                    entryDate: main.EntryDate
                        ? dayjs(main.EntryDate, "DD-MM-YYYY")
                        : dayjs(),
                    entryTime: main.EntryTime
                        ? dayjs(main.EntryTime, "HH:mm:ss")
                        : dayjs(),

                    // Booking dates
                    bookingFromDate: main.QuotationDate
                        ? dayjs(main.QuotationDate, "DD-MM-YYYY")
                        : dayjs(),
                    bookingToDate: main.QuotationDateTo
                        ? dayjs(main.QuotationDateTo, "DD-MM-YYYY")
                        : dayjs(),

                    bookingFromTime: event.TimeFrom
                        ? dayjs(event.TimeFrom, "HH:mm:ss")
                        : dayjs(),
                    bookingToTime: event.TimeTo
                        ? dayjs(event.TimeTo, "HH:mm:ss")
                        : dayjs(),

                    // Dropdowns
                    billingCompany: main.BillingCompany || "",
                    attendedBy: main.AttendedByName || "",
                    status: main.Status || event.EventStatusName || "",

                    // Customer info
                    customer: {
                        ...defaultBookingData.customer,
                        partyName: main.PartyName || state.quotationMeta.party_name || "",
                        companyName: main.CompName || "",
                        functionName: main.Occasion || main.FunctionName || "",
                        email: main.Email || "",
                        phone: main.PhoneNo || "",
                        partyId: main.PartyId || "",
                        companyId: main.CompanyId || "",
                        functionId: main.FunctionId || "",
                    },

                    // Event details
                    eventDetails: {
                        ...defaultBookingData.eventDetails,
                        venue: event.VenueName || "",
                        venueId: event.VauneId || "",
                        servingName: event.ServingName || "",
                        servingId: event.ServingId || "",
                        servingAddress: event.Address || "",
                        minPeople: event.MinPax || main.MinPax || "",
                        maxPeople: event.MaxPax || event.Pax || "",
                    },

                    // Items
                    itemDetails: itemDetailsFromApi,
                };

                // Save IDs & names in sessionStorage (used later while saving)
                safeSessionStorage.setItem("partyId", main.PartyId || "");
                safeSessionStorage.setItem("partyName", main.PartyName || "");
                safeSessionStorage.setItem("partyPhone", main.PhoneNo || "");
                safeSessionStorage.setItem("partyEmail", main.Email || "");

                safeSessionStorage.setItem("functionId", main.FunctionId || "");
                safeSessionStorage.setItem(
                    "functionName",
                    main.Occasion || main.FunctionName || ""
                );

                safeSessionStorage.setItem("companyId", main.CompanyId || "");
                safeSessionStorage.setItem("companyName", main.CompName || "");

                safeSessionStorage.setItem("servingId", event.ServingId || "");
                safeSessionStorage.setItem("servingName", event.ServingName || "");

                safeSessionStorage.setItem("venueId", event.VauneId || "");
                safeSessionStorage.setItem("venueName", event.VenueName || "");

                // Put into state
                setBookingData(newBookingData);
                setCurrentItem(defaultItem);

                // Other charges / settlement discount from header
                setOtherCharges(main.OtherchBill || main.OtherCharges || "0");
                setSettlementDiscount(main.SettleDiscBill || "0");

                safeToast.info(
                    `Editing quotation ${state.quotationMeta.quotation_no || quotId}`
                );
            } catch (err) {
                console.error("❌ Error loading quotation details:", err);
                safeToast.error("Failed to load quotation for editing");
            }
        };

        fetchQuotationDetails();
    }, [
        location.state,
        defaultBookingData,
        defaultItem,
        setBookingData,
        setCurrentItem,
        setOtherCharges,
        setSettlementDiscount,
        safeToast,
    ]);

    /* ----------------------- Enhanced Form Validation ------------------------ */
    const validateForm = useCallback(() => {
        const currentData = bookingDataRef.current;
        let firstInvalidField = null;

        // Clear previous highlights
        clearFieldHighlights();

        // Date validation check
        if (!dateValidation.isValid) {
            safeToast.error(`⚠️ ${dateValidation.error}`, {
                theme: "colored",
                position: "top-center"
            });

            // Scroll to date section and highlight it
            setTimeout(() => {
                const dateSection = document.querySelector('.pickers');
                if (dateSection) {
                    dateSection.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                    dateSection.classList.add("section-error-highlight");
                    dateSection.classList.add("shake-error");

                    // Also highlight individual date pickers
                    const datePickers = dateSection.querySelectorAll('.MuiTextField-root');
                    datePickers.forEach(picker => {
                        picker.classList.add('Mui-error');
                    });

                    setTimeout(() => {
                        dateSection.classList.remove("shake-error");
                        datePickers.forEach(picker => {
                            picker.classList.remove('Mui-error');
                        });
                    }, 3000);
                }
            }, 100);

            return false;
        }

        const validations = [
            {
                condition: !currentData.entryDate || !dayjs(currentData.entryDate).isValid(),
                message: "⚠️ Please select Entry Date",
                ref: entryDateRef,
                field: 'entryDate'
            },
            {
                condition: !currentData.entryTime || !dayjs(currentData.entryTime).isValid(),
                message: "⚠️ Please select Entry Time",
                ref: entryTimeRef,
                field: 'entryTime'
            },
            {
                condition: !currentData.billingCompany?.trim(),
                message: "⚠️ Please select Billing Company",
                ref: billingCompanyRef,
                field: 'billingCompany'
            },
            {
                condition: !currentData.attendedBy?.trim(),
                message: "⚠️ Please select Attended By",
                ref: attendedByRef,
                field: 'attendedBy'
            },
            {
                condition: !currentData.status?.trim(),
                message: "⚠️ Please select Status",
                ref: statusRef,
                field: 'status'
            },
            {
                condition: !currentData.customer.partyName?.trim(),
                message: "⚠️ Please enter Party Name",
                ref: partyNameRef,
                field: 'partyName'
            },
            {
                condition: !currentData.customer.companyName?.trim(),
                message: "⚠️ Please enter Company Name",
                ref: companyNameRef,
                field: 'companyName'
            },
            {
                condition: !currentData.customer.functionName?.trim(),
                message: "⚠️ Please enter Function Name",
                ref: functionNameRef,
                field: 'functionName'
            },
            {
                condition: !currentData.eventDetails.venue?.trim(),
                message: "⚠️ Please select Venue",
                ref: venueRef,
                field: 'venue'
            },
            {
                condition: !currentData.eventDetails.servingName?.trim(),
                message: "⚠️ Please select Serving Name",
                ref: servingNameRef,
                field: 'servingName'
            },
            {
                condition: !currentData.eventDetails.minPeople?.toString()?.trim(),
                message: "⚠️ Please enter Min people",
                ref: minPeopleRef,
                field: 'minPeople'
            },
            {
                condition: !currentData.eventDetails.maxPeople?.toString()?.trim(),
                message: "⚠️ Please enter Max People",
                ref: maxPeopleRef,
                field: 'maxPeople'
            },
            {
                condition: !currentData.bookingFromDate || !dayjs(currentData.bookingFromDate).isValid(),
                message: "⚠️ Please select Booking From Date",
                selector: ".booking-date",
                field: 'bookingFromDate'
            },
            {
                condition: !currentData.bookingFromTime || !dayjs(currentData.bookingFromTime).isValid(),
                message: "⚠️ Please select Booking From Time",
                selector: ".booking-date",
                field: 'bookingFromTime'
            },
            {
                condition: !currentData.bookingToDate || !dayjs(currentData.bookingToDate).isValid(),
                message: "⚠️ Please select Booking To Date",
                selector: ".booking-to",
                field: 'bookingToDate'
            },
            {
                condition: !currentData.bookingToTime || !dayjs(currentData.bookingToTime).isValid(),
                message: "⚠️ Please select Booking To Time",
                selector: ".booking-to",
                field: 'bookingToTime'
            },
            {
                condition: currentData.itemDetails.length === 0,
                message: "⚠️ Please add at least one Item",
                selector: ".item-details-container",
                field: 'itemDetails'
            },
        ];

        // Validate all fields and highlight errors
        for (const validation of validations) {
            if (validation.condition) {
                if (!firstInvalidField) {
                    firstInvalidField = validation;
                }

                // Highlight the invalid field with shake animation
                highlightInvalidField(validation);
            }
        }

        // Item validations with individual highlighting
        for (let i = 0; i < currentData.itemDetails.length; i++) {
            const item = currentData.itemDetails[i];
            const itemRowSelector = `.item-row[data-index="${i}"]`;

            if (!item.itemName?.trim() || !item.quantity?.toString()?.trim() || !item.rate?.toString()?.trim()) {
                if (!firstInvalidField) {
                    firstInvalidField = {
                        message: `⚠️ Please complete Item Row ${i + 1}`,
                        selector: ".item-details-container",
                        field: 'itemDetails'
                    };
                }

                // Highlight the item row
                const itemRow = document.querySelector(itemRowSelector);
                if (itemRow) {
                    itemRow.classList.add("field-error-highlight");
                    itemRow.classList.add("shake-error");
                    setTimeout(() => {
                        itemRow.classList.remove("shake-error");
                    }, 1000);
                }

                // Also highlight the item details section
                const itemSection = document.querySelector(".item-details-container");
                if (itemSection) {
                    itemSection.classList.add("field-error-highlight");
                }
                break;
            }
        }

        if (firstInvalidField) {
            safeToast.error(firstInvalidField.message, {
                theme: "colored",
                position: "top-center",
                autoClose: 3000
            });

            // Scroll to first invalid field
            scrollToField(firstInvalidField);
            return false;
        }

        console.log('✅ All validations passed!');
        return true;
    }, [safeToast, dateValidation, highlightInvalidField, clearFieldHighlights, scrollToField]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const form = e.target.form;
            const index = Array.prototype.indexOf.call(form, e.target);
            const next = form.elements[index + 1];
            next?.focus();
        }
    }, []);
    /* ----------------------- Enhanced Picker Props ------------------------ */
    const datePickerProps = useMemo(() => ({
        format: "DD-MM-YYYY",
        slotProps: {
            textField: {
                onKeyDown: handleKeyDown,
                size: "small",
                error: !dateValidation.isValid
            }
        },
    }), [handleKeyDown, dateValidation.isValid]);

    const timePickerProps = useMemo(() => ({
        ampm: true,
        slotProps: {
            textField: {
                onKeyDown: handleKeyDown,
                size: "small",
                error: !dateValidation.isValid
            }
        },
    }), [handleKeyDown, dateValidation.isValid]);

    const toDatePickerProps = useMemo(() => ({
        format: "DD-MM-YYYY",
        minDate: getMinToDate(bookingData.bookingFromDate),
        slotProps: {
            textField: {
                onKeyDown: handleKeyDown,
                size: "small",
                error: !dateValidation.isValid
            }
        },
    }), [handleKeyDown, dateValidation.isValid, getMinToDate, bookingData.bookingFromDate]);

    const toTimePickerProps = useMemo(() => ({
        ampm: true,
        minTime: getMinToTime(
            bookingData.bookingFromDate,
            bookingData.bookingFromTime,
            bookingData.bookingToDate
        ),
        slotProps: {
            textField: {
                onKeyDown: handleKeyDown,
                size: "small",
                error: !dateValidation.isValid
            }
        },
    }), [
        handleKeyDown,
        dateValidation.isValid,
        getMinToTime,
        bookingData.bookingFromDate,
        bookingData.bookingFromTime,
        bookingData.bookingToDate
    ]);

    /* ----------------------- Receipts Functions ------------------------ */
    const handleDeleteReceipt = useCallback(async (voucherId, voucherNo) => {
        if (!voucherId) {
            safeToast.error("Invalid receipt selected for deletion");
            return;
        }

        setDeleteReceiptConfirm({
            open: true,
            receipt: { voucherId, voucherNo }
        });
    }, [safeToast]);

    const confirmDeleteReceipt = useCallback(async () => {
        const { voucherId, voucherNo } = deleteReceiptConfirm.receipt || {};

        if (!voucherId) {
            safeToast.error("Invalid receipt ID for deletion");
            return;
        }

        setIsDeletingReceipt(true);
        try {
            const apiUrl = `/banquetapi/delete_or_active_inward.php?vo_id=${voucherId}&action=delete`;
            const response = await fetch(apiUrl);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result = await response.json();

            if (
                result?.result[0].success == "1" ||
                result?.result[0].success === true ||
                result?.result[0].status === "success" ||
                result?.result[0].message?.toLowerCase().includes("success") ||
                result?.result[0].message?.toLowerCase().includes("deleted")
            ) {
                safeToast.success(`Receipt ${voucherNo} deleted successfully`, {
                    autoClose: 3000
                });

                // Immediately remove from UI and update session storage
                setReceipts(prev => {
                    const updated = prev.filter(
                        (receipt) => String(receipt.VoucherId) !== String(voucherId)
                    );
                    if (editingQuotId) {
                        safeSessionStorage.setReceipts(editingQuotId, updated);
                    }
                    console.log("🔄 Receipts updated immediately:", updated);
                    return updated;
                });
            } else {
                const errorMessage = result.message || result.error || "Failed to delete receipt";
                safeToast.error(`Delete failed: ${errorMessage}`);
            }
        } catch (error) {
            console.error("❌ Error deleting receipt:", error);
            safeToast.error(`Network error: ${error.message}`);
        } finally {
            setIsDeletingReceipt(false);
            setDeleteReceiptConfirm({ open: false, receipt: null });
        }
    }, [deleteReceiptConfirm, safeToast, editingQuotId]);

    const cancelDeleteReceipt = useCallback(() => {
        setDeleteReceiptConfirm({ open: false, receipt: null });
    }, []);

    // Handle Other Attended By functionality
    const handleOtherAttendedByChange = useCallback((e) => {
        const value = e.target.value;
        setOtherAttendedByValue(value);
        setBookingData(prev => ({ ...prev, attendedBy: value }));
    }, [setBookingData]);

    const handleToggleAttendedBy = useCallback(() => {
        if (showOtherAttendedBy) {
            setOtherAttendedByValue("");
            setBookingData(prev => ({ ...prev, attendedBy: "" }));
        } else {
            setTimeout(() => {
                const otherInput = document.getElementById("other-attended-by-input");
                otherInput?.focus();
            }, 100);
        }
        setShowOtherAttendedBy(!showOtherAttendedBy);
    }, [showOtherAttendedBy, setBookingData]);

    // Handle venue change
    const handleVenueChange = useCallback((e) => {
        const venueName = e.target.value;
        console.log("🎯 Selected venue name:", venueName);
        console.log("📊 Available venues:", venues); // Debug log

        if (!venueName) {
            setBookingData(prev => ({
                ...prev,
                eventDetails: {
                    ...prev.eventDetails,
                    venue: "",
                    venueId: ""
                }
            }));
            safeSessionStorage.removeItem("venueId");
            safeSessionStorage.removeItem("venueName");
            return;
        }

        // Enhanced venue matching with flexible field names
        let selectedVenue = null;

        // Try multiple field combinations in order of priority
        if (venues && venues.length > 0) {
            selectedVenue = venues.find(v =>
                v?.Name?.trim() === venueName?.trim() ||
                v?.VenueName?.trim() === venueName?.trim() ||
                v?.LedgerName?.trim() === venueName?.trim() ||
                v?.name?.trim() === venueName?.trim() ||
                v?.venue_name?.trim() === venueName?.trim()
            );

            // Fallback: case-insensitive partial match
            if (!selectedVenue) {
                selectedVenue = venues.find(v =>
                    v?.Name?.toLowerCase().includes(venueName.toLowerCase()) ||
                    v?.VenueName?.toLowerCase().includes(venueName.toLowerCase()) ||
                    v?.LedgerName?.toLowerCase().includes(venueName.toLowerCase())
                );
            }
        }

        if (selectedVenue) {
            console.log("✅ Found venue:", selectedVenue);

            // Extract ID from multiple possible fields
            const venueId = selectedVenue.LedgerId ||
                selectedVenue.VenueId ||
                selectedVenue.id ||
                selectedVenue.Id ||
                selectedVenue.venue_id ||
                "";

            // Extract name from multiple possible fields
            const actualVenueName = selectedVenue.LedgerName ||
                selectedVenue.VenueName ||
                selectedVenue.Name ||
                selectedVenue.name ||
                selectedVenue.venue_name ||
                venueName;

            setBookingData(prev => ({
                ...prev,
                eventDetails: {
                    ...prev.eventDetails,
                    venue: actualVenueName,
                    venueId: venueId
                }
            }));

            safeSessionStorage.setItem("venueId", venueId);
            safeSessionStorage.setItem("venueName", actualVenueName);

            console.log("✅ Venue set:", { actualVenueName, venueId });
        } else {
            console.warn("⚠️ Venue not found in list, using custom name:", venueName);
            // Allow custom venue names
            setBookingData(prev => ({
                ...prev,
                eventDetails: {
                    ...prev.eventDetails,
                    venue: venueName,
                    venueId: ""
                }
            }));

            safeSessionStorage.setItem("venueName", venueName);
            safeSessionStorage.setItem("venueId", "");
        }
    }, [venues, setBookingData]);
    /* ----------------------- Event Handlers ------------------------ */
    // Form field handlers
    const handleChangeThrottled = useRafThrottle((name, value) => {
        setBookingData((prev) => {
            if (name.startsWith("customer.")) {
                const field = name.split(".")[1];
                if (prev.customer[field] === value) return prev;
                return { ...prev, customer: { ...prev.customer, [field]: value } };
            }
            if (name.startsWith("eventDetails.")) {
                const field = name.split(".")[1];
                if (prev.eventDetails[field] === value) return prev;
                return { ...prev, eventDetails: { ...prev.eventDetails, [field]: value } };
            }
            if (prev[name] === value) return prev;
            return { ...prev, [name]: value };
        });
    });

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;

        // Clear error highlighting when user starts typing
        if (e.target.classList.contains('input-error')) {
            e.target.classList.remove('input-error', 'field-error-highlight');
            e.target.removeAttribute('data-invalid-field');
        }

        handleChangeThrottled(name, value);
    }, [handleChangeThrottled]);

    // Navigation handlers
    const handleItemPage = useCallback(() => {
        safeSessionStorage.setItem("scrollPosition", window.scrollY.toString());
        navigate("/items", {
            state: {
                currentItemName: currentItemRef.current.itemName,
                isUpdate: editingIndex !== null,
                editingIndex,
            },
        });
    }, [navigate, editingIndex]);

    const handleServingNames = useCallback(() => {
        safeSessionStorage.setItem("scrollPosition", window.scrollY.toString());
        navigate("/search-serving", {
            state: {
                currentServingName: bookingData.eventDetails.servingName,
            },
        });
    }, [navigate, bookingData.eventDetails.servingName]);

    const handleNewParty = useCallback(() => {
        safeSessionStorage.setItem("scrollPosition", window.scrollY.toString());
        navigate("/search-party", {
            state: {
                currentPartyName: bookingData.customer.partyName,
            },
        });
    }, [navigate, bookingData.customer.partyName]);

    const handleNewCompany = useCallback(() => {
        safeSessionStorage.setItem("scrollPosition", window.scrollY.toString());
        navigate("/search-company", {
            state: {
                currentCompanyName: bookingData.customer.companyName,
            },
        });
    }, [navigate, bookingData.customer.companyName]);

    const handleNewFunction = useCallback(() => {
        safeSessionStorage.setItem("scrollPosition", window.scrollY.toString());
        navigate("/search-function", {
            state: {
                currentFunctionName: bookingData.customer.functionName,
            },
        });
    }, [navigate, bookingData.customer.functionName]);

    const addNewFunction = useCallback((e) => {
        e?.stopPropagation();
        e?.preventDefault();
        safeSessionStorage.setItem("scrollPosition", window.scrollY.toString());
        navigate("/add-function");
    }, [navigate]);

    // Item management
    const handleSaveClick = useCallback(() => {
        if (!validateForm()) return;
        setOpenSaveConfirm(true);
    }, [validateForm]);
    // Add this useEffect for real-time validation clearing
    useEffect(() => {
        const handleInputChange = (e) => {
            const element = e.target;
            if (element.classList.contains('field-error-highlight')) {
                // Remove error styling when user starts typing
                element.classList.remove('field-error-highlight', 'input-error');
                element.removeAttribute('data-invalid-field');

                // Also remove from parent container if it's a section
                if (element.closest('.item-details-container')) {
                    element.closest('.item-details-container').classList.remove('field-error-highlight');
                }
            }
        };

        // Add event listeners to all form elements
        const formElements = document.querySelectorAll('input, select, textarea');
        formElements.forEach(element => {
            element.addEventListener('input', handleInputChange);
            element.addEventListener('change', handleInputChange);
        });

        return () => {
            formElements.forEach(element => {
                element.removeEventListener('input', handleInputChange);
                element.removeEventListener('change', handleInputChange);
            });
        };
    }, []);
    const handleSubmit = useCallback(
        async (e, action = "normal") => {
            e?.preventDefault();
            if (!validateForm()) return;

            setIsSaving(true);

            // Set specific loading states based on action
            if (action === "invoice" || action === "invoice-print") {
                setIsMakingInvoice(true);
            } else if (action === "receipt") {
                setIsMakingReceipt(true);
            }

            const safeFormat = (date) =>
                date && dayjs(date).isValid() ? dayjs(date).format("DD-MM-YYYY") : "";
            const safeTimeFormat = (date) =>
                date && dayjs(date).isValid() ? dayjs(date).format("HH:mm:ss") : "";

            const d = bookingDataRef.current;
            const userId = localStorage.getItem("user_id") || "";
            const hotelId = localStorage.getItem("hotel_id") || "";

            const isEdit = !!editingQuotId;

            // KEY PART: When editing existing invoice and user clicks normal Save/Modify button
            const isInvoiceAction =
                action === "invoice" ||
                action === "invoice-print" ||
                (action === "normal" && !!editingBillId);

            const isInvoiceEdit = !!editingBillId && isInvoiceAction;

            // Get from sessionStorage, OR fall back to current state
            const storedCompanyId = safeSessionStorage.getItem("companyId") || d.customer.companyId || "";
            const storedCompanyName = safeSessionStorage.getItem("companyName") || d.customer.companyName || "";
            const storedFunctionId = safeSessionStorage.getItem("functionId") || d.customer.functionId || "";
            const storedFunctionName = safeSessionStorage.getItem("functionName") || d.customer.functionName || "";
            const storedPartyId = safeSessionStorage.getItem("partyId") || d.customer.partyId || "";
            const storedPartyName = safeSessionStorage.getItem("partyName") || d.customer.partyName || "";
            const storedServingId = safeSessionStorage.getItem("servingId") || d.eventDetails.servingId || "";
            const storedServingName = safeSessionStorage.getItem("servingName") || d.eventDetails.servingName || "";
            const storedVenueId = safeSessionStorage.getItem("venueId") || d.eventDetails.venueId || "";
            const storedVenueName = safeSessionStorage.getItem("venueName") || d.eventDetails.venue || "";

            // Lookup dropdowns
            const comp = billingCompanies.find((c) => c.Name === d.billingCompany) || {};
            const status = statuses.find((s) => s.LedgerName === d.status) || {};

            // Compute menu items and totals
            const menuItems = (d.itemDetails || []).map((item) => {
                const qty = Number(item.quantity) || 0;
                const rate = Number(item.rate) || 0;
                const discount = Number(item.discount) || 0;
                const taxPer = Number(item.taxPercent) || 0;
                const amount = qty * rate;
                const taxable = Math.max(0, amount - discount);
                const taxAmt = (taxable * taxPer) / 100;
                const total = taxable + taxAmt;

                return {
                    Date: safeFormat(item.itemDate),
                    ItemName: item.itemName,
                    Unit: item.unit || "",
                    Quantity: qty,
                    Rate: rate,
                    Amount: amount,
                    Discount: discount,
                    Taxable: taxable,
                    TaxName: item.taxName || "",
                    TaxPer: taxPer,
                    TaxAmount: taxAmt,
                    TotalAmount: total,
                    EventId: "",
                    ItemId: item.itemPackage || "",
                    ItemNote: item.description || "",
                    IsPackage: item.itemPackage ? "1" : "0",
                };
            });

            const subTotal = menuItems.reduce((sum, i) => sum + i.Amount, 0);
            const totalDiscount = menuItems.reduce((sum, i) => sum + i.Discount, 0);
            const totalTax = menuItems.reduce((sum, i) => sum + i.TaxAmount, 0);
            const taxable = subTotal - totalDiscount;
            const gross = taxable + totalTax + (Number(otherCharges) || 0) - (Number(settlementDiscount) || 0);
            const roundoff = Math.round(gross) - gross;
            const billTotal = gross + roundoff;

            // DYNAMIC invoice_flag based on isInvoiceAction
            const invoiceFlag = isInvoiceAction ? "1" : "0";
            // Inside handleSubmit, before requestBody
            const enquiryFlag = fromEnquiry ? 1 : 0;
            const addedFromFlag = fromEnquiry ? "E" : "Q";


            const requestBody = {
                user_id: userId,
                hotel_id: hotelId,
                booking_date: safeFormat(d.bookingFromDate),
                booking_date_to: safeFormat(d.bookingToDate),
                comp_id: storedCompanyId,
                comp_name: storedCompanyName,
                quot_status_id: status.LedgerId || "",
                function_id: storedFunctionId || "",
                function_name: storedFunctionName || "",
                party_details: {
                    party_id: storedPartyId || "",
                    party_name: storedPartyName || "",
                    contact1: d.customer.phone || "",
                    contact2: "",
                    whatsapp1: "",
                    whatsapp2: "",
                    email1: d.customer.email || "",
                    email2: "",
                    addressline1: "",
                    addressline2: "",
                    zipcode: "",
                    country: "",
                    state: "",
                    city: "",
                },
                function_details: {
                    occasion: storedFunctionName || "",
                    function_time: safeTimeFormat(d.bookingFromTime),
                    guest_name: d.customer.partyName,
                    designation: "Host",
                    arrival_time: safeTimeFormat(d.bookingFromTime),
                    instruction: "",
                },
                events: [
                    {
                        sel_event_id: "",
                        event_name: "",
                        event_date: safeFormat(d.bookingFromDate),
                        from_time: safeTimeFormat(d.bookingFromTime),
                        to_time: safeTimeFormat(d.bookingToTime),
                        serving_id: storedServingId || "",
                        serving_name: storedServingName || d.eventDetails.servingName || "",
                        venue_id: storedVenueId || "",
                        venue_name: storedVenueName || d.eventDetails.venue || "",
                        pax: d.eventDetails.maxPeople || "",
                        veg_pax: "",
                        non_veg_pax: "",
                        rate_per_pax: "",
                        instructions: "",
                        status_id: status.LedgerId || "",
                        status_name: d.status,
                        venue_address: d.eventDetails.servingAddress || "",
                        subtotal: subTotal,
                        package_igst_per: 0,
                        package_igst_amt: 0,
                        package_cgst_per: 2.5,
                        package_cgst_amt: 0,
                        package_sgst_per: 2.5,
                        package_sgst_amt: 0,
                        package_roundoff: 0,
                        package_total: billTotal,
                        venue_charges: 0,
                        venue_igst_per: 0,
                        venue_igst_amt: 0,
                        venue_cgst_per: 9,
                        venue_cgst_amt: 0,
                        venue_sgst_per: 9,
                        venue_sgst_amt: 0,
                        venue_roundoff: 0,
                        venue_total: 0,
                        other_charges: Number(otherCharges) || 0,
                        other_igst_per: 0,
                        other_igst_amt: 0,
                        other_cgst_per: 0,
                        other_cgst_amt: 0,
                        other_sgst_per: 0,
                        other_sgst_amt: 0,
                        other_roundoff: 0,
                        other_total: 0,
                        total_amt: billTotal,
                        package_id: "",
                        eventquot_id: "",
                        tax_per_id: "0",
                        min_pax: d.eventDetails.minPeople || "",
                        max_pax: d.eventDetails.maxPeople || "",
                        event_menus: (d.itemDetails || []).flatMap((item) => {
                            if (!item.selectedMenus || typeof item.selectedMenus !== "object") return [];
                            return Object.entries(item.selectedMenus).flatMap(([catId, menus]) => {
                                const menuArray = Array.isArray(menus) ? menus : [menus];
                                return menuArray.map((menu, idx) => ({
                                    cat_id: menu.CategoryId || catId || "",
                                    cat_name: menu.CategoryName || "",
                                    menu_id: menu.MenuId || menu.id || "",
                                    menu_name: menu.MenuName || menu.name || "",
                                    menu_qty: Number(menu.menu_qty || menu.qty || 0),
                                    menu_rate: Number(menu.MenuRate || menu.rate || 0),
                                    unit: menu.unit || "",
                                    menu_amount: Number(menu.menu_amount || menu.amount || 0),
                                    igst_per: Number(menu.igst_per || 0),
                                    igst_amt: Number(menu.igst_amt || 0),
                                    cgst_per: Number(menu.cgst_per || 0),
                                    cgst_amt: Number(menu.cgst_amt || 0),
                                    sgst_per: Number(menu.sgst_per || 0),
                                    sgst_amt: Number(menu.sgst_amt || 0),
                                    tot_amt: Number(menu.tot_amt || 0),
                                    includeinpk: menu.includeinpk || "0",
                                    menu_instructions: menu.menu_instructions || menu.instructions || "",
                                    menu_status: menu.menu_status || "0",
                                    package_id: item.itemPackage || "",
                                    cat_srno: `${menu.CatSrNo || idx + 1}`,
                                    added_from: "1",
                                    display_index: "0",
                                }));
                            });
                        }),
                        event_package_menus: [],
                        menu_itms_arr: menuItems,
                    },
                ],
                quot_id: isEdit ? editingQuotId : "0",
                package_amount: subTotal.toFixed(2),
                venue_amount: "0.00",
                other_amount: Number(otherCharges).toFixed(2),
                subtotal_all: subTotal.toFixed(2),
                discount: totalDiscount.toFixed(2),
                fright: "0.00",
                taxable: taxable.toFixed(2),
                tax: totalTax.toFixed(2),
                charges: "0.00",
                roundoff: roundoff.toFixed(2),
                bill_amount: billTotal.toFixed(2),
                bill_comp_id: comp.BillingCompanyId || "",
                single_event: "1",
                invoice_flag: invoiceFlag,
                bill_id: isInvoiceEdit ? editingBillId : "0",
                attended_by: d.attendedBy,
                from_list: 1,
                entry_date: safeFormat(d.entryDate),
                entry_time: safeTimeFormat(d.entryTime),
                other_ch_bill: Number(otherCharges).toFixed(2),
                settl_disc_bill: Number(settlementDiscount).toFixed(2),
                enquiry: enquiryFlag,
                AddedFrom: addedFromFlag,
            };

            console.log("📦 Booking JSON Payload:", JSON.stringify(requestBody, null, 2));
            console.log(`🎯 Invoice Flag: ${invoiceFlag} (Action: ${action}, isInvoiceAction: ${isInvoiceAction})`);

            try {
                const response = await bookingApi.submitBooking(requestBody);
                console.log("✅ API Response:", response);

                if (response?.success || response?.status === "success" || response?.status === "ok") {
                    const quotationId = response?.quot_id || response?.quotation_id || response?.success;
                    const billId = response?.bill_id || "0";

                    setSavedQuotationId(quotationId);
                    setSavedBillId(billId);

                    // Use isInvoiceAction instead of checking raw action string
                    if (isInvoiceAction) {
                        const isPrint = action === "invoice-print" || invoiceWithPrint;

                        safeToast.success("🎉 Invoice " + (isEdit ? "updated" : "created") + " successfully!", {
                            autoClose: 2000,
                        });

                        let updatedReceipts = [...receipts];

                        if (isEdit && editingQuotId) {
                            await refreshReceipts();
                            updatedReceipts = bookingDataRef.current.itemDetails.length > 0 ? [...receipts] : updatedReceipts;
                        }

                        const actualReceivedAmount = updatedReceipts.reduce(
                            (sum, receipt) => sum + (Number(receipt.Amount) || 0),
                            0
                        );

                        const calculatedBalance = billTotal - actualReceivedAmount;

                        console.log("💰 Final Bill Calculations:", {
                            billTotal,
                            actualReceivedAmount,
                            calculatedBalance,
                            receiptCount: updatedReceipts.length
                        });

                        // 🔴 IMPORTANT: after invoice is created/updated, clear draft/session
                        clearAllSessionData();

                        if (isPrint) {
                            navigate("/bill-preview", {
                                replace: true,
                                state: {
                                    quotationId,
                                    invoiceId: billId,
                                    billAmount: billTotal.toFixed(2),
                                    receivedAmount: actualReceivedAmount,
                                    discount: totalDiscount.toFixed(2),
                                    tds: 0,
                                    balance: calculatedBalance.toFixed(2),
                                    fromNewBooking: true,
                                },
                            });
                        } else {
                            navigate("/bill-list", { replace: true });
                        }
                    }
                    else if (action === "receipt") {
                        safeToast.success("🎉 Receipt created successfully!", {
                            autoClose: 2000,
                        });

                        setTimeout(() => {
                            // Clear session data, but keep edit mode flags if editing
                            const preserveEdit = isEditMode;
                            const qId = editingQuotId;
                            const bId = editingBillId;
                            clearAllSessionData();
                            if (preserveEdit) {
                                setIsEditMode(true);
                                setEditingQuotId(qId);
                                setEditingBillId(bId);
                                safeSessionStorage.setItem("isEditMode", "true");
                                if (qId) safeSessionStorage.setItem("editingQuotId", qId);
                                if (bId) safeSessionStorage.setItem("editingBillId", bId);
                            }
                            navigate("/receipt-list");
                        }, 1500);
                    } else {
                        // Normal quotation save (no invoice)
                        safeToast.success("🎉 Booking saved successfully!", {
                            autoClose: 2000,
                        });

                        if (quotationId) {
                            safeToast.info(`Quotation ID: ${quotationId}`, {
                                autoClose: 2500,
                            });
                        }

                        clearAllSessionData();
                        setOpenPrintConfirm(true);
                    }
                } else {
                    safeToast.error("⚠️ Failed to save booking. Please try again!");
                }
            } catch (error) {
                console.error("❌ Error saving booking:", error);
                safeToast.error("Server error! Please try again later.");
            } finally {
                setIsSaving(false);
                setIsMakingInvoice(false);
                setIsMakingReceipt(false);
            }
        },
        [
            validateForm,
            billingCompanies,
            statuses,
            otherCharges,
            settlementDiscount,
            clearAllSessionData,
            safeToast,
            editingQuotId,
            editingBillId,
            invoiceWithPrint,
            navigate,
            receipts,
            isEditMode,
            refreshReceipts,
        ]
    );
    // handleSaveConfirm for normal save
    const handleSaveConfirm = useCallback(() => {
        setOpenSaveConfirm(false);
        const fakeEvent = { preventDefault: () => { } };
        handleSubmit(fakeEvent, "normal");
    }, [handleSubmit]);

    const handleSaveCancel = useCallback(() => setOpenSaveConfirm(false), []);

    const handleCancelEdit = useCallback(() => {
        setCurrentItem(defaultItem);
        setEditingIndex(null);
        safeToast.info("Edit cancelled 🔄");
    }, [defaultItem, setCurrentItem, safeToast]);

    // Add this ref at the top with your other refs


    // FIXED: handleAddItem with duplicate prevention (based on old working version)
    const handleAddItem = useCallback(() => {
        // Prevent multiple calls - CRITICAL FIX
        if (isAddingItemRef.current) {
            console.log('🛑 Prevented duplicate add item call');
            return;
        }

        const currentItemData = currentItemRef.current;

        // Debug logging
        console.log('🔄 handleAddItem called with:', {
            itemName: currentItemData.itemName,
            editingIndex,
            currentState: bookingDataRef.current.itemDetails.length
        });

        // Better validation
        if (!currentItemData?.itemName?.trim()) {
            safeToast.error("Please select an item first! ❌");
            return;
        }

        // Validate numeric fields
        const rate = Number(currentItemData.rate);
        const quantity = Number(currentItemData.quantity);

        if (!rate || rate <= 0 || isNaN(rate)) {
            safeToast.error("Please enter a valid rate! ❌");
            return;
        }

        if (!quantity || quantity <= 0 || isNaN(quantity)) {
            safeToast.error("Please enter a valid quantity! ❌");
            return;
        }

        // Set flag to prevent duplicates
        isAddingItemRef.current = true;

        // Prepare the item object
        const newItem = {
            ...currentItemData,
            quantity: quantity,
            rate: rate,
            taxName: currentItemData.taxName || "GST",
            taxPercent: Number(currentItemData.taxPercent || 0),
            discount: Number(currentItemData.discount || 0),
            description: currentItemData.description || "",
            selectedMenus: currentItemData.selectedMenus || {},
            cats: currentItemData.cats || [],
        };

        // Update the booking data
        setBookingData((prev) => {
            const updatedItems = [...prev.itemDetails];

            if (editingIndex !== null && editingIndex >= 0 && editingIndex < updatedItems.length) {
                // Update existing item
                updatedItems[editingIndex] = newItem;
                console.log("✅ Item updated at index:", editingIndex);
            } else {
                // Add new item
                updatedItems.push(newItem);
                console.log("✅ New item added. Total items:", updatedItems.length);
            }

            return { ...prev, itemDetails: updatedItems };
        });

        // Reset the form
        setCurrentItem((prev) => ({
            ...defaultItem,
            itemDate: prev.itemDate, // Keep the same date
        }));

        // Store whether we were editing for the toast message
        const wasEditing = editingIndex !== null;
        setEditingIndex(null);

        // Show success message
        setTimeout(() => {
            if (wasEditing) {
                safeToast.success("Item updated successfully! ✅");
            } else {
                safeToast.success("Item added successfully! ✅");
            }
        }, 50);

        // Scroll to the item table
        setTimeout(() => {
            if (itemDetailsSectionRef.current) {
                itemDetailsSectionRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        }, 100);

        // Reset the flag after a short delay
        setTimeout(() => {
            isAddingItemRef.current = false;
            console.log('✅ Add item flag reset');
        }, 1000);

    }, [editingIndex, defaultItem, setBookingData, setCurrentItem, safeToast]);
    // Removed bookingData.itemDetails.length from dependencies
    const handleEditItem = useCallback((index) => {
        const item = bookingData.itemDetails[index];
        if (item) {
            setCurrentItem({
                itemDate: item.itemDate || dayjs(),
                itemName: item.itemName || "",
                quantity: item.quantity?.toString() || "1",
                rate: item.rate || "",
                description: item.description || "",
                discount: item.discount || "",
                taxPercent: item.taxPercent || "",
                taxName: item.taxName || "",
                selectedMenus: item.selectedMenus || {},
                cats: item.cats || [],
            });

            setEditingIndex(index);

            setTimeout(() => {
                itemDetailsSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }, 80);

            safeToast.info(`Editing item: ${item.itemName} ✏️`);
        }
    }, [bookingData.itemDetails, setCurrentItem, safeToast]);

    const handleModifyMenus = useCallback((index) => {
        safeSessionStorage.setItem("scrollPosition", window.scrollY.toString());

        const item = bookingData.itemDetails[index];
        if (!item) {
            safeToast.error("❌ Item not found!");
            return;
        }

        const packId = item.PackageId || item.pack_id || item.itemPackage ||
            item.ItemPackageId || item.Package_ID || item.packageId || "";

        if (!packId) {
            safeToast.error("❌ This item does not have a valid Package ID!");
            return;
        }

        const selectedItem = {
            PackageId: packId,
            Name: item.itemName,
            Rate: item.rate,
            TaxPer: item.taxPercent,
            TaxName: item.taxName,
            Unit: item.unit || "Per Plate",
            cats: item.cats || [],
            quantity: item.quantity,
            discount: item.discount,
            description: item.description,
        };

        setTimeout(() => {
            navigate("/item-menu", {
                state: {
                    selectedItem,
                    isEditingMenus: true,
                    editingIndex: index,
                    previousMenus: item.selectedMenus || {},
                    originalItem: item,
                },
            });
        }, 50);
    }, [navigate, bookingData.itemDetails, safeToast]);

    // FIXED: handleDeleteItem - removed unnecessary receipts manipulation
    const handleDeleteItem = useCallback((index) => {
        setBookingData((prev) => {
            const newItems = prev.itemDetails.filter((_, i) => i !== index);
            return {
                ...prev,
                itemDetails: newItems,
            };
        });

        if (editingIndex === index) {
            setEditingIndex(null);
            setCurrentItem(defaultItem);
        }

        console.log("✅ Item deleted successfully");

        setTimeout(() => {
            safeToast.info("Item removed", { autoClose: 1000 });
        }, 100);
    }, [editingIndex, defaultItem, setBookingData, setCurrentItem, safeToast]);

    const handleRowDiscountChange = useCallback((index, value) => {
        const raw = Number(value);
        setBookingData((prev) => {
            const items = [...prev.itemDetails];
            const item = { ...items[index] };
            const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
            const discount = isNaN(raw) ? 0 : Math.max(0, Math.min(raw, amount));
            if (item.discount === discount) return prev;
            item.discount = discount;
            items[index] = item;
            return { ...prev, itemDetails: items };
        });
    }, [setBookingData]);

    // FIXED: handleReset with proper edit mode and receipts preservation
    const handleReset = useCallback(() => {
        // Preserve critical edit mode data
        const preserveEditMode = isEditMode;
        const preserveEditingQuotId = editingQuotId;
        const preserveEditingBillId = editingBillId;
        const preserveCurrentReceipts = [...receipts];

        // Clear only form data, not receipts
        const itemsToRemove = [
            "bookingData", "currentItem", "partyId", "partyName", "partyPhone", "partyEmail",
            "functionId", "functionName", "companyId", "companyName", "venueId", "venueName",
            "servingId", "servingName", "scrollPosition"
        ];
        itemsToRemove.forEach(item => safeSessionStorage.removeItem(item));

        // Reset form state
        setBookingData(defaultBookingData);
        setCurrentItem(defaultItem);
        setOtherCharges("");
        setSettlementDiscount("");
        setEditingIndex(null);
        setShowOtherAttendedBy(false);
        setOtherAttendedByValue("");
        toast.info("form cleared Successfully", { toastId: 'clear-info' })
        // 🔥 CRITICAL: Always preserve receipts in edit mode
        if (preserveEditMode) {
            setReceipts(preserveCurrentReceipts);
            // Restore edit mode flags 
            setIsEditMode(true);
            setEditingQuotId(preserveEditingQuotId);
            setEditingBillId(preserveEditingBillId);
            safeSessionStorage.setItem("isEditMode", "true");
            if (preserveEditingQuotId) {
                safeSessionStorage.setItem("editingQuotId", preserveEditingQuotId);
                safeSessionStorage.setReceipts(preserveEditingQuotId, preserveCurrentReceipts);
            }
            if (preserveEditingBillId) {
                safeSessionStorage.setItem("editingBillId", preserveEditingBillId);
            }
        } else {
            setReceipts([]);
        }

        // Reset user interaction flags
        userSetBookingToRef.current = false;
        userSetItemDateRef.current = false;
        userSetBookingDateRef.current = false;
        userSetBookingTimeRef.current = false;
        hasLoadedFromSessionRef.current = false;

        console.log("🔄 Form reset, receipts preserved:", preserveCurrentReceipts.length);
    }, [
        defaultBookingData, defaultItem, setBookingData,
        setCurrentItem, isEditMode, editingQuotId, editingBillId, receipts
    ]);

    // handleSubmit with proper bill preview navigation


    const editHeaderNumber = React.useMemo(() => {
        const qm = location.state?.quotationMeta;

        // 1. Try from current location.state
        if (qm) {
            const num =
                qm.quotation_no ||
                qm.QuotationNo ||
                qm.quot_no ||
                qm.quotationNo;

            if (num) {
                // Store it for future renders when state is cleared
                safeSessionStorage.setItem("quotationNumber", num);
                return num;
            }
        }

        // 2. Fallback to sessionStorage (used after state:{} navigation)
        const stored = safeSessionStorage.getItem("quotationNumber");
        return stored || null;
    }, [location.state]);
    const enquiryHeaderNumber = React.useMemo(() => {
        const em = location.state?.enquiryMeta;

        // 1. Try from current navigation state
        if (em?.QuotationNo) {
            const num = em.QuotationNo;
            // store for when state is cleared (e.g. after navigate({ state: {} }))
            safeSessionStorage.setItem("enquiryNumber", num);
            return num;
        }

        // 2. Fallback to sessionStorage
        const stored = safeSessionStorage.getItem("enquiryNumber");
        return stored || null;
    }, [location.state]);

    // Print handlers
    const handlePrintConfirm = useCallback(() => {
        setOpenPrintConfirm(false);
        navigate("/quotation-preview", {
            state: {
                quot_id: savedQuotationId,
                bill_id: savedBillId,
                fromNewBooking: true
            }
        });
    }, [navigate, savedQuotationId, savedBillId]);

    const handlePrintCancel = useCallback(() => {
        setOpenPrintConfirm(false);
        clearAllSessionData();
        navigate("/select-dashboard", { replace: true });
    }, [clearAllSessionData, navigate]);
    const handleBackNavigation = useCallback(() => {
        clearAllSessionData();

        // If we know exactly where to go back → use it (Enquiry Dashboard)
        if (backToPath) {
            navigate(backToPath, { replace: true });
            return;
        }

        // Fallback: if it was started from an Enquiry but backTo not set
        if (fromEnquiry) {
            // 👉 You can either go to a fixed route:
            // navigate('/enquiry-dashboard', { replace: true });

            // or, if you prefer, use history:
            // navigate(-1);

            navigate('/enquiry-dashboard', { replace: true }); // adjust path if different
            return;
        }

        // Default behaviour (for normal bookings)
        navigate('/select-dashboard', { replace: true });
    }, [clearAllSessionData, navigate, backToPath, fromEnquiry]);
    // Helper: parse FunctionFrom / FunctionTo from enquiry list
    const parseEnquiryDateTime = (value) => {
        if (!value) return null;
        const formats = [
            "DD-MM-YYYY HH:mm:ss",
            "DD-MM-YYYY HH:mm",
            "YYYY-MM-DD HH:mm:ss",
            "YYYY-MM-DD HH:mm",
        ];

        for (const fmt of formats) {
            const d = dayjs(value, fmt, true);
            if (d.isValid()) return d;
        }

        const fallback = dayjs(value);
        return fallback.isValid() ? fallback : null;
    };
    useEffect(() => {
        const st = location.state;
        if (!st?.fromEnquiry || !st.enquiryMeta || enquiryAppliedRef.current) return;

        enquiryAppliedRef.current = true;  // ✅ only apply once

        const enq = st.enquiryMeta;
        console.log("🧾 Applying enquiry to NewBooking:", enq);

        // 1) Parse function date/times
        const fromDT = parseEnquiryDateTime(enq.FunctionFrom);
        const toDT = parseEnquiryDateTime(enq.FunctionTo);

        // 2) Update main bookingData
        setBookingData(prev => ({
            ...prev,

            // Booking dates & times
            bookingFromDate: fromDT || prev.bookingFromDate,
            bookingFromTime: fromDT || prev.bookingFromTime,
            bookingToDate: toDT || fromDT || prev.bookingToDate,
            bookingToTime: toDT || fromDT || prev.bookingToTime,

            // Customer info
            customer: {
                ...prev.customer,
                partyName: enq.PartyName || prev.customer.partyName,
                companyName: enq.Company || prev.customer.companyName,
                functionName: enq.Function || prev.customer.functionName,

                // if your enquiry list has these:
                phone: enq.PhoneNo || enq.ContactNo || prev.customer.phone,
                email: enq.Email || prev.customer.email,

                partyId: enq.PartyId || prev.customer.partyId,
                companyId: enq.CompanyId || prev.customer.companyId,
                functionId: enq.FunctionId || prev.customer.functionId,
            },

            // Event details
            eventDetails: {
                ...prev.eventDetails,
                minPeople: enq.MinPax || prev.eventDetails.minPeople,
                maxPeople: enq.MaxPax || prev.eventDetails.maxPeople,

                // If your enquiry row has these:
                venue: enq.VenueName || prev.eventDetails.venue,
                venueId: enq.VenueId || prev.eventDetails.venueId,
                servingName: enq.ServingName || prev.eventDetails.servingName,
                servingId: enq.ServingId || prev.eventDetails.servingId,
            },
        }));

        // 3) Also store IDs/names in sessionStorage – your app already uses these later
        if (enq.PartyId) {
            safeSessionStorage.setItem("partyId", enq.PartyId);
            safeSessionStorage.setItem("partyName", enq.PartyName || "");
        }
        if (enq.CompanyId) {
            safeSessionStorage.setItem("companyId", enq.CompanyId);
            safeSessionStorage.setItem("companyName", enq.Company || "");
        }
        if (enq.FunctionId) {
            safeSessionStorage.setItem("functionId", enq.FunctionId);
            safeSessionStorage.setItem("functionName", enq.Function || "");
        }

        if (enq.ServingId) {
            safeSessionStorage.setItem("servingId", enq.ServingId);
            safeSessionStorage.setItem("servingName", enq.ServingName || "");
        }
        if (enq.VenueId) {
            safeSessionStorage.setItem("venueId", enq.VenueId);
            safeSessionStorage.setItem("venueName", enq.VenueName || "");
        }

    }, [location.state, setBookingData]);

    // Bill calculations
    const { subTotal, totalDiscount, taxableAmount, taxAmount, grossAmount, roundOff, billAmount } =
        useMemo(() => {
            const items = bookingData.itemDetails || [];
            let subTotal = 0;
            let totalDiscount = 0;
            let taxAmount = 0;

            items.forEach(item => {
                const qty = Number(item.quantity) || 0;
                const rate = Number(item.rate) || 0;
                const amount = qty * rate;
                const discount = Number(item.discount || 0);
                subTotal += amount;
                totalDiscount += discount;
                const taxable = Math.max(0, amount - discount);
                const taxPercent = Number(item.taxPercent || 0);
                taxAmount += (taxable * taxPercent) / 100;
            });

            const taxableAmount = subTotal - totalDiscount;
            const otherChargesNum = Number(otherCharges) || 0;
            const settlementDiscountNum = Number(settlementDiscount) || 0;
            const grossAmount = taxableAmount + taxAmount + otherChargesNum - settlementDiscountNum;
            const roundOff = Math.round(grossAmount) - grossAmount;
            const billAmount = grossAmount + roundOff;

            return { subTotal, totalDiscount, taxableAmount, taxAmount, grossAmount, roundOff, billAmount };
        }, [bookingData.itemDetails, otherCharges, settlementDiscount]);

    // Calculate balance amount for display
    const { totalReceived, balanceAmount } = useMemo(() => {
        const totalReceived = (receipts || []).reduce(
            (sum, receipt) => sum + (Number(receipt.Amount) || 0),
            0
        );

        const balanceAmount = Math.max(0, billAmount - totalReceived);

        return { totalReceived, balanceAmount };
    }, [receipts, billAmount]);

    const isFullyPaid = isEditMode && balanceAmount <= 0.01; // Use small tolerance for float comparison
    const invoiceButtonText = useMemo(() => {
        if (isMakingInvoice) return "Creating Invoice...";
        return editingBillId ? "Modify Invoice" : "Make Invoice";
    }, [isMakingInvoice, editingBillId]);

    // Get button text based on current action
    const getSaveButtonText = () => {
        if (isMakingInvoice) return "Creating Invoice...";
        if (isMakingReceipt) return "Creating Receipt...";
        if (isSaving) return isEditMode ? "Updating..." : "Saving...";
        return isEditMode ? "Modify Event" : "Save Event";
    };

    // handleMakeReceipt with direct save
    const handleMakeReceipt = useCallback(() => {
        if (!editingQuotId) {
            safeToast.error("No quotation in edit to make a receipt!");
            return;
        }

        // Hard stop if bill is already fully received
        if (balanceAmount <= 0.01) {
            safeToast.info("This bill is already fully received. You can't receive more.");
            return;
        }

        const hotelId = localStorage.getItem("hotel_id") || "";

        const partyLedgerId =
            safeSessionStorage.getItem("partyId") ||
            bookingData.customer.partyId ||
            location.state?.quotationMeta?.PartyId ||
            location.state?.quotationMeta?.party_id ||
            "";

        if (!partyLedgerId) {
            console.warn("⚠️ No party ledger id found while making receipt");
        } else {
            console.log("✅ Using partyLedgerId for receipt:", partyLedgerId);
        }

        // Pass bill/received/balance meta down to dialog
        setReceiptDialogMeta({
            quot_id: editingQuotId,
            hotel_id: hotelId,
            party_name: bookingData.customer.partyName,
            bill_amount: billAmount,
            received_amount: totalReceived,
            balance_amount: balanceAmount,
            party_ledger_id: partyLedgerId,
            party_id: partyLedgerId,
            PartyId: partyLedgerId,
            LedgerId: partyLedgerId,
        });

        setOpenReceiptDialog(true);
    }, [editingQuotId, bookingData.customer.partyName, billAmount, balanceAmount, totalReceived, bookingData.customer.partyId, location.state, safeToast]);

    // handleMakeInvoice with direct save and navigation
    const handleMakeInvoice = useCallback(() => {
        if (!editingQuotId) {
            safeToast.error("No quotation in edit to make an invoice!");
            return;
        }

        // Show different message for modification vs creation
        if (editingBillId) {
            safeToast.info("Modifying existing invoice...");
        } else {
            safeToast.info("Creating new invoice...");
        }

        // 🔥 ADD: Validate form before opening dialog
        if (!validateForm()) {
            safeToast.error("Please fix form errors before creating invoice");
            return;
        }

        setOpenInvoiceDialog(true);
    }, [editingQuotId, editingBillId, validateForm, safeToast]);


    useEffect(() => {
        const handleKeyDown = (event) => {
            console.log('Key pressed:', event.key, 'isDirty:', isDirty);

            // Handle Escape key
            if (event.key === 'Escape') {
                console.log('Escape pressed - Checking dialogs:', {
                    openConfirm,
                    openSaveConfirm,
                    openPrintConfirm,
                    deleteReceiptConfirmOpen: deleteReceiptConfirm.open,
                    openInvoiceDialog,
                    openReceiptDialog
                });

                // Check if ANY dialog is currently open
                const isAnyDialogOpen =
                    openConfirm ||
                    openSaveConfirm ||
                    openPrintConfirm ||
                    deleteReceiptConfirm.open ||
                    openInvoiceDialog ||
                    openReceiptDialog;

                console.log('Is any dialog open?', isAnyDialogOpen);

                // If NO dialog is open AND form has changes, show confirmation
                if (!isAnyDialogOpen && isDirty) {
                    console.log('Showing confirmation dialog');
                    setOpenConfirm(true);
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }

                // Close the currently open dialog (in order of priority)
                if (openConfirm) {
                    console.log('Closing openConfirm dialog');
                    setOpenConfirm(false);
                    event.preventDefault();
                } else if (openSaveConfirm) {
                    console.log('Closing openSaveConfirm dialog');
                    setOpenSaveConfirm(false);
                    event.preventDefault();
                } else if (openPrintConfirm) {
                    console.log('Closing openPrintConfirm dialog');
                    setOpenPrintConfirm(false);
                    event.preventDefault();
                } else if (deleteReceiptConfirm.open) {
                    console.log('Closing deleteReceiptConfirm dialog');
                    setDeleteReceiptConfirm({ open: false, receipt: null });
                    event.preventDefault();
                } else if (openInvoiceDialog) {
                    console.log('Closing openInvoiceDialog');
                    setOpenInvoiceDialog(false);
                    setInvoiceWithPrint(false);
                    event.preventDefault();
                } else if (openReceiptDialog) {
                    console.log('Closing openReceiptDialog');
                    setOpenReceiptDialog(false);
                    event.preventDefault();
                }
            }

            // Handle Enter key
            else if (event.key === 'Enter') {
                console.log('Enter pressed - Checking dialogs');

                if (openConfirm) {
                    console.log('Confirming back navigation');
                    handleBackNavigation();
                    event.preventDefault();
                } else if (openSaveConfirm) {
                    console.log('Confirming save');
                    handleSaveConfirm();
                    event.preventDefault();
                } else if (openPrintConfirm) {
                    console.log('Confirming print');
                    handlePrintConfirm();
                    event.preventDefault();
                } else if (deleteReceiptConfirm.open) {
                    console.log('Confirming receipt deletion');
                    confirmDeleteReceipt();
                    event.preventDefault();
                }
            }
        };

        // Add the event listener
        window.addEventListener('keydown', handleKeyDown);

        // Clean up on unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        // Add ALL state and function dependencies here:
        openConfirm,
        openSaveConfirm,
        openPrintConfirm,
        deleteReceiptConfirm,
        openInvoiceDialog,
        openReceiptDialog,
        isDirty,
        handleBackNavigation,
        handleSaveConfirm,
        handlePrintConfirm,
        confirmDeleteReceipt,
        setDeleteReceiptConfirm,
        setOpenInvoiceDialog,
        setInvoiceWithPrint,
        setOpenReceiptDialog,
        setOpenConfirm,
        setOpenSaveConfirm,
        setOpenPrintConfirm
    ]);
    useEffect(() => {
        const handleFunctionKeys = (e) => {
            // Check if F1-F12 keys are pressed
            if (e.key.startsWith('F')) {
                e.preventDefault(); // Prevent browser default behavior

                switch (e.key) {
                    case 'F2':
                        handleSaveClick();
                        break;
                    case 'F1':
                        handleReset();
                        break;
                    case 'F3':
                        handleItemPage();
                        break;
                    case 'F4':
                        if (isEditMode) handleMakeInvoice();
                        break;
                    case 'F5':
                        if (isEditMode) handleMakeReceipt();
                        break;
                    case 'F6':
                        handleNewParty();
                        break;
                    case 'F7':
                        handleNewCompany();
                        break;
                    case 'F8':
                        handleNewFunction();
                        break;
                    case 'F9':
                        handleServingNames();
                        break;
                    default:
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleFunctionKeys);

        return () => {
            document.removeEventListener('keydown', handleFunctionKeys);
        };
    }, [
        handleSaveClick,
        handleReset,
        handleItemPage,
        handleMakeInvoice,
        handleMakeReceipt,
        handleNewParty,
        handleNewCompany,
        handleNewFunction,
        handleServingNames,
        isEditMode
    ]);
    // Add these refs at the top of your component with other refs



    return (
        <Suspense fallback={<div className="loading-spinner">Loading New Booking...</div>}>
            <ConfirmBackButton
                title={
                    <>
                        {isEditMode ? (
                            // Existing behaviour for edit mode
                            `Modify${editHeaderNumber ? ` #${editHeaderNumber}` : " Quotation"}`
                        ) : fromEnquiry && enquiryHeaderNumber ? (
                            // When coming from Enquiry → show E + quotation no.
                            `New Booking E${enquiryHeaderNumber}`
                        ) : (
                            // Normal fresh booking
                            "New Booking"
                        )}
                    </>
                }
                onClick={(e) => {
                    e.preventDefault();
                    if (isDirty) {
                        setOpenConfirm(true);
                    } else {
                        handleBackNavigation();
                    }
                }}
            />

            <ConfirmationDialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                onConfirm={handleBackNavigation}
                title="Go Back to Dashboard?"
                message="Are you sure you want to go back? All form data will be permanently lost."
                confirmText="Yes, Go Back"
                confirmColor="error"
            />

            <ConfirmationDialog
                open={openSaveConfirm}
                onClose={handleSaveCancel}
                onConfirm={handleSaveConfirm}
                title="Save Event?"
                message="Are you sure you want to save this event? After saving, you can choose to print the quotation."
                confirmText="Yes, Save"
                confirmColor="success"
            />

            {/* Delete Receipt Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteReceiptConfirm.open}
                onClose={cancelDeleteReceipt}
                onConfirm={confirmDeleteReceipt}
                title="Delete Receipt?"
                message={`Are you sure you want to delete receipt Voucher No: ${deleteReceiptConfirm.receipt?.voucherNo}? This action cannot be undone.`}
                confirmText={isDeletingReceipt ? "Deleting..." : "Yes, Delete"}
                cancelText="Cancel"
                confirmColor="error"
                disabled={isDeletingReceipt}
            />

            <MakeInvoiceDialog
                open={openInvoiceDialog}
                loading={isMakingInvoice}
                onClose={() => {
                    setOpenInvoiceDialog(false);
                    setInvoiceWithPrint(false);
                }}
                onConfirm={() => {
                    console.log(`🔄 ${editingBillId ? "Modifying" : "Creating"} invoice only...`);
                    setInvoiceWithPrint(false);
                    const fakeEvent = { preventDefault: () => { } };
                    handleSubmit(fakeEvent, "invoice");
                }}
                onConfirmWithPrint={() => {
                    console.log(`🔄 ${editingBillId ? "Modifying" : "Creating"} invoice with print...`);
                    setInvoiceWithPrint(true);
                    const fakeEvent = { preventDefault: () => { } };
                    handleSubmit(fakeEvent, "invoice-print");
                }}
                data={{
                    partyName: bookingData.customer.partyName,
                    companyName: bookingData.customer.companyName,
                    venueName: bookingData.eventDetails.venue,
                    servingName: bookingData.eventDetails.servingName,
                    fromDate: bookingData.bookingFromDate,
                    toDate: bookingData.bookingToDate,
                    fromTime: bookingData.bookingFromTime,
                    toTime: bookingData.bookingToTime,
                    subTotal,
                    totalDiscount,
                    taxAmount,
                    otherCharges: Number(otherCharges) || 0,
                    settlementDiscount: Number(settlementDiscount) || 0,
                    roundOff,
                    billAmount,
                }}
                // Add this prop to indicate edit mode
                isEditMode={!!editingBillId}
            />
            <MakeReceiptDialog
                open={openReceiptDialog}
                onClose={() => setOpenReceiptDialog(false)}
                quotationMeta={receiptDialogMeta}
                billAmount={billAmount}
                receivedAmount={totalReceived}
                remainingAmount={balanceAmount}
                onSaved={async () => {
                    await refreshReceipts();
                    const el = document.querySelector(".receipts-section");
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
            />

            <ConfirmationDialog
                open={openPrintConfirm}
                onClose={handlePrintCancel}
                onConfirm={handlePrintConfirm}
                title="Quotation Saved Successfully!"
                message="Do you want to print the quotation?"
                confirmText="Yes, Print"
                cancelText="No, Go to Dashboard"
                confirmColor="primary"
            />
            <ReceiptPrintDialog
                open={openReceiptPrintDialog}
                loading={isLoadingReceiptPrint}
                data={printReceiptData}
                onClose={() => setOpenReceiptPrintDialog(false)}
            />



            <div className="formContainer">
                <form onSubmit={(e) => handleSubmit(e, "normal")}>
                    <DateTimeSection
                        bookingData={bookingData}
                        onDateChange={handleDateChange}
                        onKeyDown={handleKeyDown}
                        refs={{ entryDateRef, entryTimeRef }}
                    />

                    <DropdownSection
                        title={"Guest Billing Company"}
                        name="billingCompany"
                        icon={<FaPeopleGroup size={25} color="#847239be" />}
                        value={bookingData.billingCompany}
                        onChange={handleChange}
                        options={billingCompanies}
                        optionKey="BillingCompanyId"
                        optionValue="Name"
                        optionLabel="Name"
                        required
                        ref={billingCompanyRef}
                        onKeyDown={handleKeyDown}
                    />

                    {/* Attended By Section with Toggle Option */}
                    <div className="dropdown-section">
                        <h3 style={{ alignItems: "center", display: "flex", gap: "8px" }}>
                            <MdCoPresent size={20} color="#847239be" /> Attended By
                        </h3>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {!showOtherAttendedBy ? (
                                <select
                                    name="attendedBy"
                                    value={bookingData.attendedBy}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    ref={attendedByRef}
                                    required
                                    style={{ flex: 1 }}
                                >
                                    <option value="" hidden>Select Attended By</option>
                                    {attendees.map((attendee) => (
                                        <option key={attendee.Userid} value={attendee.Name}>
                                            {attendee.Name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    id="other-attended-by-input"
                                    type="text"
                                    value={otherAttendedByValue}
                                    onChange={handleOtherAttendedByChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter attended by name"
                                    required
                                    style={{ flex: 1 }}
                                />
                            )}
                            <button
                                type="button"
                                onClick={handleToggleAttendedBy}
                                className="toggle-attended-by-btn"
                            >
                                {showOtherAttendedBy ? 'Back to List' : 'Other'}
                            </button>
                        </div>
                    </div>

                    <DropdownSection
                        title="Status"
                        name="status"
                        icon={<GrStatusUnknown size={20} color="#847239be" />}
                        value={bookingData.status}
                        onChange={handleChange}
                        options={statuses}
                        optionKey="LedgerId"
                        optionValue="LedgerName"
                        optionLabel="LedgerName"
                        required
                        ref={statusRef}
                        onKeyDown={handleKeyDown}
                    />

                    {/* Booking Date/Time Sections with Validation */}
                    <div className="pickers">
                        <div className="booking-date">
                            <h4>Booking From</h4>
                            <DatePicker
                                label="Booking From Date"
                                value={bookingData.bookingFromDate}
                                onChange={(v) => handleDateChange("bookingFromDate", v)}
                                {...datePickerProps}
                            />
                            <TimePicker
                                label="Booking From Time"
                                value={bookingData.bookingFromTime}
                                onChange={(v) => handleDateChange("bookingFromTime", v)}
                                {...timePickerProps}
                            />
                        </div>
                        <div className="booking-to">
                            <h4>Booking To</h4>
                            <DatePicker
                                label="Booking To Date"
                                value={bookingData.bookingToDate}
                                onChange={(v) => handleDateChange("bookingToDate", v)}
                                {...toDatePickerProps}
                            />
                            <TimePicker
                                label="Booking To Time"
                                value={bookingData.bookingToTime}
                                onChange={(v) => handleDateChange("bookingToTime", v)}
                                {...toTimePickerProps}
                            />
                        </div>

                        {/* Date Validation Error Message */}
                        {!dateValidation.isValid && (
                            <div className="date-validation-error">
                                <span className="error-icon">⚠️</span>
                                <span className="error-message">{dateValidation.error}</span>
                            </div>
                        )}
                    </div>

                    <h3 className="sectionTitle">
                        <FaUserAlt style={{ marginRight: 8, color: '#ffffffff' }} size={20} />
                        Customer Information
                    </h3>
                    <CustomerInfoSection
                        bookingData={bookingData}
                        onFieldClick={(type) => {
                            if (type === "party") handleNewParty();
                            else if (type === "company") handleNewCompany();
                            else if (type === "function") handleNewFunction();
                        }}
                        onAddFunction={addNewFunction}
                        onFieldChange={handleChange}
                        refs={{ partyNameRef, companyNameRef, functionNameRef }}
                    />

                    <h3 className="sectionTitle">
                        <FaMapMarkerAlt style={{ marginRight: 8, color: '#ffffffff' }} size={20} />
                        Event Details
                    </h3>
                    <EventDetailsSection
                        bookingData={bookingData}
                        venues={venues}
                        onVenueChange={handleVenueChange}
                        onServingNameClick={handleServingNames}
                        onFieldChange={handleChange}
                        refs={refs}
                        onKeyDown={handleKeyDown}
                    />

                    <h3 className="sectionTitle">
                        <MdShoppingCart style={{ marginRight: 8, color: '#ffffffff' }} size={20} />
                        Item Details
                    </h3>
                    <div ref={itemDetailsSectionRef} className="item-details-container">
                        <ItemDetailsSection
                            currentItem={currentItem}
                            setCurrentItem={setCurrentItem}
                            bookingData={bookingData}
                            editingIndex={editingIndex}
                            onItemPageClick={handleItemPage}
                            onAddItem={handleAddItem}
                            onCancelEdit={handleCancelEdit}
                            onDeleteItem={handleDeleteItem}
                            onEditItem={handleEditItem}
                            onModifyMenus={handleModifyMenus}
                            onRowDiscountChange={handleRowDiscountChange}
                            onKeyDown={handleKeyDown}
                            onDateChange={handleDateChange}
                        />
                    </div>

                    <h3 className="sectionTitle">
                        <TiPrinter style={{ marginRight: 8, color: '#ffffffff' }} size={20} />
                        Billing Summary
                    </h3>
                    <BillDetailsSection
                        subTotal={subTotal}
                        totalDiscount={totalDiscount}
                        taxableAmount={taxableAmount}
                        taxAmount={taxAmount}
                        grossAmount={grossAmount}
                        otherCharges={otherCharges}
                        setOtherCharges={setOtherCharges}
                        settlementDiscount={settlementDiscount}
                        setSettlementDiscount={setSettlementDiscount}
                        roundOff={roundOff}
                        billAmount={billAmount}
                        onKeyDown={handleKeyDown}
                    />

                    {/* Receipts Table - Only shown in edit mode with safeguards */}
                    {isEditMode && receipts && receipts.length > 0 && (
                        <ReceiptsTable
                            receipts={receipts}
                            onDeleteReceipt={handleDeleteReceipt}
                            onPrintReceipt={handleOpenReceiptPrint}
                            isDeleting={isDeletingReceipt}
                            isPrinting={isLoadingReceiptPrint}
                            billAmount={billAmount}
                        />
                    )}


                    {/* Balance Amount Display - Always shown in edit mode with safeguards */}
                    {isEditMode && receipts && (
                        <BalanceAmountDisplay
                            receipts={receipts}
                            billAmount={billAmount}
                        />
                    )}

                    {/* Buttons */}
                    <div className="buttonContainer">
                        <button
                            type="button"
                            onClick={handleSaveClick}
                            className="save-button"
                            disabled={isSaving || isMakingInvoice || isMakingReceipt}
                            style={{
                                opacity: (isSaving || isMakingInvoice || isMakingReceipt) ? 0.6 : 1,
                                cursor: (isSaving || isMakingInvoice || isMakingReceipt) ? "not-allowed" : "pointer",
                            }}
                        >
                            <FaSave style={{ marginRight: 6 }} /> {getSaveButtonText()}
                        </button>

                        {!isEditMode && (
                            <button
                                type="button"
                                className="reset-button"
                                onClick={handleReset}
                                disabled={isSaving || isMakingInvoice || isMakingReceipt}
                            >
                                <FaRedoAlt style={{ marginRight: 6 }} /> Reset
                            </button>
                        )}

                        {/* Show these ONLY in edit mode */}
                        {isEditMode && (
                            <>
                                <button
                                    type="button"
                                    className="receipt-button"
                                    onClick={handleMakeReceipt}
                                    disabled={isSaving || isMakingInvoice || isMakingReceipt || isFullyPaid}
                                    title={isFullyPaid ? "Bill already fully received" : "Make Receipt"}
                                >
                                    <LuReceiptIndianRupee style={{ marginRight: 6 }} size={20} />
                                    {isMakingReceipt ? "Creating Receipt..." : "Make Receipt"}
                                </button>

                                <button
                                    type="button"
                                    className="invoice-button"
                                    onClick={handleMakeInvoice}
                                    disabled={isSaving || isMakingInvoice || isMakingReceipt}
                                >
                                    <HiPrinter style={{ marginRight: 6 }} size={20} />
                                    {invoiceButtonText}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>

            <style>{`
                .receipts-section {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #e0e0e0;
                }

                .receipts-table-container {
                    overflow-x: auto;
                    margin-top: 15px;
                }

                .receipts-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 6px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .receipts-table th {
                    background: #847239;
                    color: white;
                    padding: 12px 8px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 14px;
                }

                .receipts-table td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #e0e0e0;
                    font-size: 14px;
                }

                .receipts-table tbody tr:hover {
                    background: #f5f5f5;
                }

                .receipts-table tfoot {
                    background: #f8f9fa;
                }

                .receipts-total-row td {
                    font-weight: bold;
                    border-top: 2px solid #847239;
                    background: #e9ecef;
                }

                .receipts-outstanding-row td {
                    font-weight: bold;
                    border-top: 2px solid #dc3545;
                    background: #f8d7da;
                }

                .amount-cell {
                    text-align: right;
                    font-family: 'Courier New', monospace;
                }

                .total-amount {
                    color: #847239;
                    font-size: 16px;
                }

                .outstanding-amount {
                    color: #dc3545;
                    font-size: 16px;
                }

                .no-receipts-message {
                    text-align: center;
                    padding: 20px;
                    color: #6c757d;
                    font-style: italic;
                }

                .delete-receipt-btn {
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                    min-width: 32px;
                    min-height: 32px;
                }

                .delete-receipt-btn:hover:not(:disabled) {
                    background: #c82333;
                }

                .delete-receipt-btn:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                .loading-spinner-small {
                    width: 14px;
                    height: 14px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #847239;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .receipts-summary-card {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 15px;
                    padding: 15px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e0e0e0;
                }

                .summary-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                }

                .summary-item.outstanding {
                    color: #dc3545;
                }

                .summary-label {
                    font-size: 12px;
                    color: #6c757d;
                    margin-bottom: 5px;
                }

                .summary-value {
                    font-size: 16px;
                    font-weight: bold;
                    font-family: 'Courier New', monospace;
                }

                /* Balance Amount Display Styles */
                .balance-amount-display {
                  background-color: rgb(21, 81, 130);
                    margin: 15px;
                    bottom: 20px;
                    color: white;
                    padding: 10px;
                    border-radius: 12px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                    z-index: 1000;
                    min-width: 320px;
                    animation: slideInUp 0.4s ease-out;
                    border: 2px solid #fff;
                    backdrop-filter: blur(10px);
                }

                .balance-amount-content {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .balance-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 4px 0;
                }

                .balance-row.outstanding {
                    border-top: 2px solid rgba(255,255,255,0.3);
                    padding-top: 12px;
                    margin-top: 4px;
                }

                .balance-label {
                    font-size: 14px;
                    font-weight: 500;
                    opacity: 0.9;
                }

                .balance-value {
                    font-size: 16px;
                    font-weight: bold;
                    font-family: 'Courier New', monospace;
                }

                .balance-value.bill-amount {
                    font-size: 18px;
                    color: #ff0000ff;
                }

                .balance-value.received-amount {
                    color: #06d51aff;
                }

                .balance-value.balance-amount {
                    color: #f7062aff;
                    font-size: 17px;
                }

                .receipt-button {
                    background-color: rgb(21, 81, 130);
                    color: #fefefeff !important;
                    border: none;
                    padding: 18px 14px !important;
                    border-radius: 4px;
                    margin-right: 8px;
                    display: inline-flex;
                    align-items: center;
                }

                .invoice-button {
                    background-color: #007bff;
                    color: #fff;
                    border: none;
                    padding: 18px 14px;
                    border-radius: 4px;
                    margin-right: 8px;
                    display: inline-flex;
                    align-items: center;
                }

                .buttonContainer {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-top: 20px;
                    margin-bottom: 100px; /* Extra space for balance display */
                }

                .save-button, .reset-button, .receipt-button, .invoice-button {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    transition: all 0.3s ease;
                }

                .save-button {
                    background-color: #847239;
                    color: white;
                }

                .save-button:hover:not(:disabled) {
                    background-color: #756035;
                }

                .reset-button {
                    background-color: #6c757d;
                    color: white;
                }

                .reset-button:hover:not(:disabled) {
                    background-color: #5a6268;
                }

                .receipt-button:hover:not(:disabled) {
                    background-color: rgb(16, 65, 105);
                }

                .invoice-button:hover:not(:disabled) {
                    background-color: #0056b3;
                }

                button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .toggle-attended-by-btn {
                    background: #847239;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    white-space: nowrap;
                }

                .toggle-attended-by-btn:hover {
                    background: #756035;
                }

                .receipt-btns{
                    display: flex;
                    gap: 8px;
                }
                .print-receipt{
                    background-color: #28a745;
                    color: #ffffff;
                    padding: 6px 10px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                }

                /* Date Validation Styles */
                .pickers {
                    position: relative;
                }

                .date-validation-error {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 6px;
                    color: #dc2626;
                    font-size: 14px;
                    margin-top: 12px;
                    grid-column: 1 / -1;
                }

                .error-icon {
                    font-size: 16px;
                }

                .error-message {
                    font-weight: 500;
                }
/* Error Highlight Styles */
.field-error-highlight {
    border-color: #dc3545 !important;
    border-width: 2px !important;
    background-color: #fff5f5 !important;
}

.input-error {
    background-color: #fff5f5 !important;
    border: 2px solid #dc3545 !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2) !important;
}

/* Shake Animation */
.shake-error {
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {
    0%, 100% {
        transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
        transform: translateX(-5px);
    }
    20%, 40%, 60%, 80% {
        transform: translateX(5px);
    }
}

/* Material UI Error Styles */
.Mui-error .MuiOutlinedInput-notchedOutline {
    border-color: #dc3545 !important;
    border-width: 2px !important;
    animation: pulse-error 2s ease-in-out;
}

.Mui-error .MuiInputLabel-root {
    color: #dc3545 !important;
    font-weight: bold !important;
}

.Mui-error .MuiInputLabel-root.Mui-focused {
    color: #dc3545 !important;
}

/* Date picker error styles */
.Mui-error .MuiOutlinedInput-root {
    animation: shake 0.5s ease-in-out;
}

/* Section error highlighting */
.section-error-highlight {
    border: 2px solid #dc3545 !important;
    border-radius: 8px !important;
    padding: 12px !important;
    background-color: #fff5f5 !important;
    animation: pulse-error 2s infinite !important;
}

/* Red border for dropdowns and inputs */
select.field-error-highlight,
input.field-error-highlight,
textarea.field-error-highlight {
    border: 2px solid #dc3545 !important;
    border-radius: 4px !important;
    background-color: #fff5f5 !important;
}

/* Error message styling */
.error-message-container {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    padding: 8px 12px;
    margin-top: 5px;
    color: #721c24;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.error-message-container::before {
    content: "⚠️";
    font-size: 16px;
}

/* Focus state for errored fields */
.field-error-highlight:focus {
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.3) !important;
}

/* Highlight for entire sections when they have errors */
.item-details-container.field-error-highlight {
    border: 2px solid #dc3545 !important;
    border-radius: 8px !important;
    padding: 15px !important;
    background-color: #fff5f5 !important;
    animation: pulse-error 2s ease-in-out !important;
}

@keyframes pulse-error {
    0% {
        box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
    }
    50% {
        box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
    }
}
            `}</style>
        </Suspense>
    );
}

export default NewBooking;