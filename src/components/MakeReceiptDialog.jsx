// src/components/MakeReceiptDialog.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { FaSave, FaTimes } from "react-icons/fa";

const TOASTS = {
    noHotel: "receipt_no_hotel",
    noQuot: "receipt_no_quotation",
    loadAccountsFail: "receipt_load_accounts_fail",
    loadPaymodesFail: "receipt_load_paymodes_fail",
    invalidAmount: "receipt_invalid_amount",
    noAccount: "receipt_no_account",
    noPaymode: "receipt_no_paymode",
    missingLogin: "receipt_missing_login",
    missingLedger: "receipt_missing_ledger",
    saveSuccess: "receipt_save_success",
    saveFail: "receipt_save_fail",
    serverError: "receipt_server_error",
};

function MakeReceiptDialog({ 
    open, 
    onClose, 
    quotationMeta, 
    onSaved,
    billAmount = 0,
    receivedAmount: initialReceivedAmount = 0,
    remainingAmount: remainingFromParent 
}) {
    if (!open || !quotationMeta) return null;

    const {
        quot_id,
        hotel_id: metaHotelId,
        party_name,
        party_ledger_id,
        party_id,
        PartyId,
        LedgerId,
    } = quotationMeta;

    // ---------- Read user / hotel / login from localStorage ----------
    let parsedUser = null;
    try {
        const userStr = localStorage.getItem("user");
        parsedUser = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error("Error parsing localStorage.user:", e);
    }

    const hotelId = metaHotelId || localStorage.getItem("hotel_id") || (parsedUser && parsedUser.hotel_id) || "";
    const loginId = localStorage.getItem("login_id") || (parsedUser && (parsedUser.login_id || parsedUser.LoginId || parsedUser.user_id || parsedUser.UserId)) || localStorage.getItem("user_id") || "";

    // ---------- Compute remaining amount ----------
    const remainingAmount = useMemo(() => {
        const b = Number(billAmount) || 0;
        const r = Number(initialReceivedAmount) || 0;
        const rawRem = typeof remainingFromParent === "number" ? remainingFromParent : Math.max(0, b - r);
        return Math.max(0, rawRem);
    }, [billAmount, initialReceivedAmount, remainingFromParent]);

    const billFullySettled = remainingAmount <= 0.0001;

    // ---------- Local state ----------
    const [receiptDateTime] = useState(dayjs());
    const [discount, setDiscount] = useState("");
    const [tds, setTds] = useState("");
    const [receivedAmount, setReceivedAmount] = useState("");
    const [accountId, setAccountId] = useState("");
    const [paymodeId, setPaymodeId] = useState("");
    const [note, setNote] = useState("");

    const [accounts, setAccounts] = useState([]);
    const [paymodes, setPaymodes] = useState([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(true);
    const [saving, setSaving] = useState(false);

    const [ledgerId, setLedgerId] = useState(() => {
        return party_ledger_id || party_id || PartyId || LedgerId || "";
    });

    // --- Net receipt calculation ---
    const netReceiptAmount = useMemo(() => {
        const a = Number(receivedAmount) || 0;
        const d = Number(discount) || 0;
        const t = Number(tds) || 0;
        const net = a - d - t;
        return net > 0 ? net : 0;
    }, [receivedAmount, discount, tds]);

    // --- Guard: cannot receive more than remaining ---
    const exceedsBill = netReceiptAmount > remainingAmount + 0.0001;

    // ---------- Set default received amount to 0 when dialog opens ----------
    useEffect(() => {
        if (open) {
            // Changed from remainingAmount to 0
            setReceivedAmount("0");
            setDiscount("");
            setTds("");
        }
    }, [open]); // Removed remainingAmount dependency

    // ---------- Guards ----------
    useEffect(() => {
        if (!hotelId) {
            toast.error("No hotel ID found. Please login again.", { toastId: TOASTS.noHotel });
        }
        if (!quot_id) {
            toast.error("No quotation found for receipt!", { toastId: TOASTS.noQuot });
        }
    }, [hotelId, quot_id]);

    // ---------- Resolve ledger id (fallbacks) ----------
    useEffect(() => {
        if (ledgerId) {
            console.log("✅ ledgerId from navigation/dialog =", ledgerId);
            return;
        }

        const ssLedger = sessionStorage.getItem("partyId") || sessionStorage.getItem("PartyId") || sessionStorage.getItem("ledgerId") || sessionStorage.getItem("LedgerId") || "";

        if (ssLedger) {
            console.log("✅ ledgerId from sessionStorage =", ssLedger);
            setLedgerId(ssLedger);
            return;
        }

        const fetchLedgerFromQuotation = async () => {
            try {
                if (!hotelId || !quot_id) return;

                const url = `/banquetapi/get_quot_details.php?quot_id=${quot_id}&hotel_id=${hotelId}`;
                console.log("📡 Fetching quotation for ledger id (dialog):", url);
                const res = await fetch(url);
                const data = await res.json();
                const main = data?.result?.[0] || {};

                const apiPartyId = main.PartyId || main.LedgerId || main.party_id || main.ledger_id || "";

                if (apiPartyId) {
                    console.log("✅ ledgerId from API =", apiPartyId);
                    setLedgerId(apiPartyId);
                } else {
                    console.warn("⚠️ Could not resolve ledgerId from API.");
                }
            } catch (err) {
                console.error("Error fetching ledgerId from API:", err);
            }
        };

        fetchLedgerFromQuotation();
    }, [ledgerId, hotelId, quot_id]);

    // ---------- Load accounts ----------
    useEffect(() => {
        const loadAccounts = async () => {
            try {
                setLoadingDropdowns(true);

                const accountsRes = await fetch(`/banquetapi/get_all_account.php?hotel_id=${hotelId}`);
                const accountsData = await accountsRes.json();

                const accList = accountsData?.result || accountsData?.accounts || [];
                setAccounts(accList);

                if (accList.length > 0) {
                    const first = accList[0];
                    const firstId = first.AccountId || first.LedgerId || first.id || "";
                    setAccountId(firstId);
                }

                setLoadingDropdowns(false);
            } catch (err) {
                console.error("Error loading accounts:", err);
                toast.error("Failed to load accounts!", { toastId: TOASTS.loadAccountsFail });
                setLoadingDropdowns(false);
            }
        };

        if (hotelId && quot_id && open) {
            loadAccounts();
        }
    }, [hotelId, quot_id, open]);

    // ---------- Load paymodes when account changes ----------
    useEffect(() => {
        const loadPaymodes = async () => {
            if (!accountId) {
                setPaymodes([]);
                return;
            }
            try {
                setLoadingDropdowns(true);

                const paymodesRes = await fetch(`/banquetapi/get_paymodes_from_account.php?acc_id=${accountId}`);
                const paymodesData = await paymodesRes.json();

                const pmList = paymodesData?.result || paymodesData?.paymodes || [];
                setPaymodes(pmList);

                if (pmList.length > 0) {
                    const first = pmList[0];
                    const firstId = first.PaymodeId || first.id || "";
                    setPaymodeId(firstId);
                } else {
                    setPaymodeId("");
                }

                setLoadingDropdowns(false);
            } catch (err) {
                console.error("Error loading paymodes:", err);
                toast.error("Failed to load paymodes!", { toastId: TOASTS.loadPaymodesFail });
                setLoadingDropdowns(false);
            }
        };

        if (accountId && open) {
            loadPaymodes();
        }
    }, [accountId, open]);

    // ---------- Validation & Save ----------
    const validateForm = useCallback(() => {
        if (billFullySettled) {
            toast.error("This bill is already fully settled. No further receipts allowed.");
            return false;
        }

        if (!receivedAmount || Number(receivedAmount) <= 0) {
            toast.error("Please enter a valid Received Amount", { toastId: TOASTS.invalidAmount });
            return false;
        }

        if (netReceiptAmount <= 0) {
            toast.error("Net receipt amount must be greater than zero");
            return false;
        }

        if (exceedsBill) {
            toast.error(`You can receive maximum ₹${remainingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} for this bill`);
            return false;
        }

        if (!accountId) {
            toast.error("Please select Account", { toastId: TOASTS.noAccount });
            return false;
        }
        if (!paymodeId) {
            toast.error("Please select Paymode", { toastId: TOASTS.noPaymode });
            return false;
        }
        return true;
    }, [receivedAmount, accountId, paymodeId, netReceiptAmount, exceedsBill, remainingAmount, billFullySettled]);

    const handleSave = useCallback(async () => {
        if (!validateForm()) return;

        if (!loginId) {
            toast.error("Login ID missing. Please login again.", { toastId: TOASTS.missingLogin });
            return;
        }

        if (!ledgerId) {
            toast.error("Party ledger id missing for receipt.", { toastId: TOASTS.missingLedger });
            return;
        }

        setSaving(true);

        const strDate = dayjs(receiptDateTime).format("YYYY-MM-DD");

        const formBody = new URLSearchParams();
        formBody.append("hotel_id", String(hotelId));
        formBody.append("login_id", String(loginId));
        formBody.append("str_date", strDate);
        formBody.append("str_ledger_id", String(ledgerId));
        formBody.append("str_amount", String(Number(receivedAmount) || 0));
        formBody.append("str_ac_id", String(accountId || ""));
        formBody.append("str_paymode_id", String(paymodeId || ""));
        formBody.append("str_note", note || "");
        formBody.append("str_discount", String(Number(discount) || 0));
        formBody.append("str_tds", String(Number(tds) || 0));
        formBody.append("quot_id", String(quot_id || ""));
        formBody.append("bill_amount", String(Number(billAmount) || 0));
        formBody.append("already_received", String(Number(initialReceivedAmount) || 0));
        formBody.append("remaining_before", String(remainingAmount));
        formBody.append("net_receipt", String(netReceiptAmount));

        try {
            const res = await fetch("/banquetapi/save_inward.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
                body: formBody.toString(),
            });

            const text = await res.text();

            if (text && text.includes("1")) {
                toast.success("Receipt saved successfully!", { toastId: TOASTS.saveSuccess });
                onSaved?.();
                onClose();
            } else {
                toast.error("Failed to save receipt!", { toastId: TOASTS.saveFail });
            }
        } catch (err) {
            console.error("Error saving receipt:", err);
            toast.error("Server error while saving receipt!", { toastId: TOASTS.serverError });
        } finally {
            setSaving(false);
        }
    }, [validateForm, loginId, ledgerId, receiptDateTime, receivedAmount, accountId, paymodeId, note, discount, tds, quot_id, hotelId, onSaved, onClose, billAmount, initialReceivedAmount, remainingAmount, netReceiptAmount]);

    if (!quot_id) return null;

    const displayDate = receiptDateTime.format("DD-MM-YYYY");
    const displayTime = receiptDateTime.format("hh:mm a");

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="receipt-dialog-backdrop">
            <div className="receipt-dialog-card">
                <div className="receipt-dialog-header">
                    <h2 className="receipt-title">Payment Receipt</h2>
                    <button type="button" className="receipt-close-btn" onClick={onClose} disabled={saving}>
                        <FaTimes />
                    </button>
                </div>

                {loadingDropdowns && accounts.length === 0 ? (
                    <div className="loading-spinner">Loading accounts & paymodes...</div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        {/* Bill Summary Section */}
                        <div className="receipt-summary-panel">
                            <div className="receipt-summary-row">
                                <span>Bill Amount:</span>
                                <strong>{formatCurrency(billAmount)}</strong>
                            </div>
                            <div className="receipt-summary-row">
                                <span>Already Received:</span>
                                <strong>{formatCurrency(initialReceivedAmount)}</strong>
                            </div>
                            <div className="receipt-summary-row">
                                <span>Balance Before Receipt:</span>
                                <strong className={remainingAmount > 0 ? "text-warning" : "text-success"}>
                                    {formatCurrency(remainingAmount)}
                                </strong>
                            </div>
                            <div className="receipt-summary-row">
                                <span>Net This Receipt:</span>
                                <strong className={netReceiptAmount > 0 ? "text-success" : "text-muted"}>
                                    {formatCurrency(netReceiptAmount)}
                                </strong>
                            </div>
                            <div className={`receipt-summary-row ${exceedsBill || billFullySettled ? "error" : ""}`}>
                                <span>Balance After Receipt:</span>
                                <strong>{formatCurrency(Math.max(0, remainingAmount - netReceiptAmount))}</strong>
                            </div>
                        </div>

                        {billFullySettled && (
                            <div className="receipt-error-text">
                                ✅ This bill is fully settled. No further receipts can be created.
                            </div>
                        )}

                        {/* Receipt Details */}
                        <div className="receipt-details-grid">
                            <div className="receipt-field">
                                <label className="receipt-label">Date</label>
                                <div className="receipt-value">{displayDate} &nbsp; {displayTime}</div>
                            </div>

                            <div className="receipt-field">
                                <label className="receipt-label">Party Name</label>
                                <div className="receipt-value">{party_name || "-"}</div>
                            </div>
                            <div className="receipt-field">
                                <label className="receipt-label">Account</label>
                                <select
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    disabled={saving}
                                    required
                                    className="receipt-input"
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map((acc) => (
                                        <option key={acc.AccountId || acc.id} value={acc.AccountId || acc.id}>
                                            {acc.AccountName || acc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <div className="receipt-field">
                                <label className="receipt-label">Paymode</label>
                                <select
                                    value={paymodeId}
                                    onChange={(e) => setPaymodeId(e.target.value)}
                                    disabled={saving}
                                    required
                                    className="receipt-input"
                                >
                                    <option value="">Select Paymode</option>
                                    {paymodes.map((pm) => (
                                        <option key={pm.PaymodeId || pm.id} value={pm.PaymodeId || pm.id}>
                                            {pm.PaymodeName || pm.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="receipt-field">
                                <label className="receipt-label">Discount</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    disabled={saving || billFullySettled}
                                    className="receipt-input"
                                />
                            </div>

                            <div className="receipt-field">
                                <label className="receipt-label">TDS</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={tds}
                                    onChange={(e) => setTds(e.target.value)}
                                    disabled={saving || billFullySettled}
                                    className="receipt-input"
                                />
                            </div>


                            <div className="receipt-field">
                                <label className="receipt-label receipt-bold">
                                    Receive Amount
                                    <span className="remaining-hint">
                                        (Max: {formatCurrency(remainingAmount)})
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={remainingAmount}
                                    step="0.01"
                                    value={receivedAmount}
                                    onChange={(e) => setReceivedAmount(e.target.value)}
                                    disabled={saving || billFullySettled}
                                    required
                                    placeholder="Enter amount to receive"
                                    className="receipt-input"
                                />
                            </div>

                            <div className="receipt-field full-width">
                                <label className="receipt-label">Note</label>
                                <textarea
                                    rows={2}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Enter note..."
                                    disabled={saving}
                                    className="receipt-input"
                                />
                            </div>
                        </div>

                        {exceedsBill && !billFullySettled && (
                            <div className="receipt-error-text">
                                Net receipt exceeds remaining bill amount. Please reduce the amount.
                            </div>
                        )}

                        <div className="receipt-buttons">
                            <button type="button" className="receipt-btn receipt-btn-secondary" onClick={onClose} disabled={saving}>
                                <FaTimes style={{ marginRight: 6 }} />
                                CANCEL
                            </button>
                            <button
                                type="submit"
                                className="receipt-btn receipt-btn-primary"
                                disabled={saving || exceedsBill || netReceiptAmount <= 0 || billFullySettled}
                            >
                                <FaSave style={{ marginRight: 6 }} />
                                {saving ? "SAVING..." : "SAVE RECEIPT"}
                            </button>
                        </div>
                    </form>
                )}

                <style>{`
                    .receipt-dialog-backdrop {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 2000;
                        padding: 20px;
                    }

                    .receipt-dialog-card {
                        background: white;
                        border-radius: 8px;
                        width: 100%;
                        max-width: 650px;
                        max-height: 85vh;
                        overflow-y: auto;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    }

                    .receipt-dialog-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px;
                        border-bottom: 1px solid #e0e0e0;
                        background: #145181 !important;
                        border-radius: 8px 8px 0 0;
                    }

                    .receipt-title {
                        margin: 0;
                        font-size: 18px;
                        font-weight: 600;
                        color: #ffffffff;
                        
                    }

                    .receipt-close-btn {
                        background: none;
                        border: none;
                        font-size: 18px;
                        cursor: pointer;
                        color: #fbfbfbff;
                        padding: 4px;
                    }

                    .receipt-close-btn:hover:not(:disabled) {
                        color: #333;
                    }

                    .receipt-close-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    form {
                        padding: 15px;
                    }

                    .receipt-summary-panel {
                        background: #f8f9fa;
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        padding: 16px;
                        margin-bottom: 10px;
                    }

                    .receipt-summary-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 6px 0;
                        border-bottom: 1px solid #e8e8e8;
                    }

                    .receipt-summary-row:last-child {
                        border-bottom: none;
                        background: #e8f5e8;
                        margin: 8px -8px -8px -8px;
                        padding: 10px 8px;
                        border-radius: 4px;
                        border: 1px solid #c8e6c9;
                    }

                    .receipt-summary-row.error {
                        background: #f8d7da;
                        border-color: #f5c6cb;
                    }

                    .receipt-summary-row.error span,
                    .receipt-summary-row.error strong {
                        color: #721c24;
                    }

                    .text-warning { color: #ff6b35; }
                    .text-success { color: #28a745; }
                    .text-muted { color: #666; }

                    .receipt-details-grid {
                        display: grid;
                        grid-template-columns:  1fr 1fr;
                        gap: 12px;
                        margin-bottom: 20px;
                    }

                    .receipt-field {
                        display: flex;
                        flex-direction: column;
                    }

                    .receipt-field.full-width {
                        grid-column: 1 / -1;
                    }

                    .receipt-label {
                        font-size: 13px;
                        font-weight: 500;
                        color: #555;
                        margin-bottom: 4px;
                    }

                    .receipt-label.receipt-bold {
                        font-weight: 600;
                    }

                    .remaining-hint {
                        font-size: 11px;
                        color: #666;
                        font-weight: normal;
                        margin-left: 6px;
                        font-style: italic;
                    }

                    .receipt-value {
                        font-size: 14px;
                        color: #1976d2;
                        font-weight: 600;
                        padding: 6px 0;
                    }

                    .receipt-input {
                        padding: 8px 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 14px;
                        outline: none;
                    }

                    .receipt-input:focus {
                        border-color: #1976d2;
                        box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
                    }

                    .receipt-input:disabled {
                        background-color: #f5f5f5;
                        cursor: not-allowed;
                        opacity: 0.7;
                    }

                    textarea.receipt-input {
                        resize: vertical;
                        min-height: 60px;
                    }

                    .receipt-error-text {
                        background: #f8d7da;
                        color: #721c24;
                        padding: 10px 12px;
                        border-radius: 4px;
                        border: 1px solid #f5c6cb;
                        font-size: 13px;
                        text-align: center;
                        margin-bottom: 16px;
                    }

                    .receipt-buttons {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid #e0e0e0;
                    }

                    .receipt-btn {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-width: 120px;
                        transition: all 0.2s;
                    }

                    .receipt-btn-primary {
                        background: #1976d2;
                        color: white;
                    }

                    .receipt-btn-primary:hover:not(:disabled) {
                        background: #1565c0;
                    }

                    .receipt-btn-primary:disabled {
                        background: #ccc;
                        cursor: not-allowed;
                        opacity: 0.6;
                    }

                    .receipt-btn-secondary {
                        background: white;
                        color: #666;
                        border: 1px solid #ddd;
                    }

                    .receipt-btn-secondary:hover:not(:disabled) {
                        background: #f5f5f5;
                        border-color: #999;
                    }

                    .receipt-btn-secondary:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .loading-spinner {
                        text-align: center;
                        padding: 40px;
                        color: #666;
                        font-size: 14px;
                    }

                    @media (max-width: 600px) {
                        .receipt-dialog-backdrop {
                            padding: 6px;
                        }

                        .receipt-dialog-card {
                            max-width: 100%;
                            max-height: 90vh;
                        }

                        .receipt-details-grid {
                            grid-template-columns: 1fr;
                            gap: 10px;
                        }

                        .receipt-buttons {
                            flex-direction: column;
                        }

                        .receipt-btn {
                            width: 100%;
                            min-width: auto;
                        }
                        
                        .remaining-hint {
                            display: block;
                            margin-left: 0;
                            margin-top: 2px;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}

export default MakeReceiptDialog;