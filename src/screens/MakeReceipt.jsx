// src/pages/MakeReceipt.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { FaArrowLeft, FaSave } from "react-icons/fa";

/* ---------- Toast IDs ---------- */
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

function MakeReceipt() {
    const navigate = useNavigate();
    const location = useLocation();

    // Data passed from NewBooking (Make Receipt button)
    const quotationMeta = location.state?.quotationMeta || {};
    const {
        quot_id,
        hotel_id: metaHotelId,
        party_name,
        bill_amount,
        party_ledger_id,
        party_id,
        PartyId,
        LedgerId,
    } = quotationMeta;

    /* ---------- Read user / hotel / login from localStorage ---------- */
    let parsedUser = null;
    try {
        const userStr = localStorage.getItem("user");
        parsedUser = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error("Error parsing localStorage.user:", e);
    }

    const hotelId =
        metaHotelId ||
        localStorage.getItem("hotel_id") ||
        (parsedUser && parsedUser.hotel_id) ||
        "";

    // ✅ login_id stored at login + some fallbacks
    const loginId =
        localStorage.getItem("login_id") ||
        (parsedUser &&
            (parsedUser.login_id ||
                parsedUser.LoginId ||
                parsedUser.user_id ||
                parsedUser.UserId)) ||
        localStorage.getItem("user_id") ||
        "";

    console.log("✅ resolved loginId =", loginId);

    /* ---------- Local state ---------- */
    const [receiptDateTime] = useState(dayjs()); // fixed at open time
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

    // this will hold final Party Ledger Id (str_ledger_id)
    const [ledgerId, setLedgerId] = useState(() => {
        const navLid =
            party_ledger_id ||
            party_id ||
            PartyId ||
            LedgerId ||
            "";
        return navLid || "";
    });

    /* ---------- Guards ---------- */
    useEffect(() => {
        if (!hotelId) {
            toast.error("No hotel ID found. Please login again.", {
                toastId: TOASTS.noHotel,
            });
            navigate("/login");
            return;
        }
        if (!quot_id) {
            toast.error("No quotation found for receipt!", {
                toastId: TOASTS.noQuot,
            });
            navigate("/new-booking");
        }
    }, [hotelId, quot_id, navigate]);

    /* ---------- Resolve ledger id (fallbacks) ---------- */
    useEffect(() => {
        // already had from navigation
        if (ledgerId) {
            console.log("✅ ledgerId from navigation =", ledgerId);
            return;
        }

        // 2) Try from sessionStorage (PartySearch / edit mode)
        const ssLedger =
            sessionStorage.getItem("partyId") ||
            sessionStorage.getItem("PartyId") ||
            sessionStorage.getItem("ledgerId") ||
            sessionStorage.getItem("LedgerId") ||
            "";

        if (ssLedger) {
            console.log("✅ ledgerId from sessionStorage =", ssLedger);
            setLedgerId(ssLedger);
            return;
        }

        // 3) Fallback: fetch from get_quot_details.php using quot_id
        const fetchLedgerFromQuotation = async () => {
            try {
                if (!hotelId || !quot_id) return;

                const url = `/banquetapi/get_quot_details.php?quot_id=${quot_id}&hotel_id=${hotelId}`;
                console.log("📡 Fetching quotation for ledger id:", url);
                const res = await fetch(url);
                const data = await res.json();
                const main = data?.result?.[0] || {};

                const apiPartyId =
                    main.PartyId ||
                    main.LedgerId ||
                    main.party_id ||
                    main.ledger_id ||
                    "";

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

    /* ---------- 1) Load accounts ---------- */
    useEffect(() => {
        const loadAccounts = async () => {
            try {
                setLoadingDropdowns(true);

                const accountsRes = await fetch(
                    `/banquetapi/get_all_account.php?hotel_id=${hotelId}`
                );
                const accountsData = await accountsRes.json();

                const accList = accountsData?.result || accountsData?.accounts || [];
                setAccounts(accList);

                // Default to first account (e.g. Cash)
                if (accList.length > 0) {
                    const first = accList[0];
                    const firstId = first.AccountId || first.LedgerId || first.id || "";
                    setAccountId(firstId);
                }

                setLoadingDropdowns(false);
            } catch (err) {
                console.error("Error loading accounts:", err);
                toast.error("Failed to load accounts!", {
                    toastId: TOASTS.loadAccountsFail,
                });
                setLoadingDropdowns(false);
            }
        };

        if (hotelId && quot_id) {
            loadAccounts();
        }
    }, [hotelId, quot_id]);

    /* ---------- 2) Load paymodes whenever account changes ---------- */
    useEffect(() => {
        const loadPaymodes = async () => {
            if (!accountId) {
                setPaymodes([]);
                return;
            }
            try {
                setLoadingDropdowns(true);

                const paymodesRes = await fetch(
                    `/banquetapi/get_paymodes_from_account.php?acc_id=${accountId}`
                );
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
                toast.error("Failed to load paymodes!", {
                    toastId: TOASTS.loadPaymodesFail,
                });
                setLoadingDropdowns(false);
            }
        };

        if (accountId) {
            loadPaymodes();
        }
    }, [accountId]);

    /* ---------- Handlers ---------- */
    const handleBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const validateForm = useCallback(() => {
        if (!receivedAmount || Number(receivedAmount) <= 0) {
            toast.error("Please enter a valid Received Amount", {
                toastId: TOASTS.invalidAmount,
            });
            return false;
        }
        if (!accountId) {
            toast.error("Please select Account", {
                toastId: TOASTS.noAccount,
            });
            return false;
        }
        if (!paymodeId) {
            toast.error("Please select Paymode", {
                toastId: TOASTS.noPaymode,
            });
            return false;
        }
        return true;
    }, [receivedAmount, accountId, paymodeId]);

    const handleSave = useCallback(async () => {
        if (!validateForm()) return;

        if (!loginId) {
            toast.error("Login ID missing. Please login again.", {
                toastId: TOASTS.missingLogin,
            });
            console.error("❌ loginId is empty, check localStorage/login setup.");
            return;
        }

        if (!ledgerId) {
            toast.error("Party ledger id missing for receipt.", {
                toastId: TOASTS.missingLedger,
            });
            console.error("❌ ledgerId is empty, check NewBooking / Party selection / quotation.");
            return;
        }

        setSaving(true);

        // API expects YYYY-MM-DD
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

        const payloadObject = Object.fromEntries(formBody);
        console.log("📦 save_inward payload:", payloadObject);

        try {
            const res = await fetch("/banquetapi/save_inward.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                },
                body: formBody.toString(),
            });

            const text = await res.text();
            console.log("✅ save_inward raw response:", text);

            // 🔍 LOG for debugging
            console.log("login_id sent =", loginId, "ledgerId sent =", ledgerId);

            // ✅ Don't depend on res.ok, just check text from your PHP
            if (text && text.includes("1")) {
                // 🔐 store the final data so list page can show it
                sessionStorage.setItem("lastReceiptData", JSON.stringify(payloadObject));

                toast.success("Receipt saved successfully!", {
                    toastId: TOASTS.saveSuccess,
                });

                // ⏳ small delay so toast is visible even if route changes
                setTimeout(() => {
                    navigate("/select-dashboard");
                }, 1500);
            } else {
                toast.error("Failed to save receipt!", {
                    toastId: TOASTS.saveFail,
                });
            }
        } catch (err) {
            console.error("Error saving receipt:", err);
            toast.error("Server error while saving receipt!", {
                toastId: TOASTS.serverError,
            });
        } finally {
            setSaving(false);
        }
    }, [
        validateForm,
        loginId,
        ledgerId,
        receiptDateTime,
        receivedAmount,
        accountId,
        paymodeId,
        note,
        discount,
        tds,
        quot_id,
        hotelId,
        navigate,
    ]);

    /* ---------- Render ---------- */
    if (!quot_id) return null;

    const displayDate = receiptDateTime.format("DD-MM-YYYY");
    const displayTime = receiptDateTime.format("hh:mm a");

    return (
        <>
            <div className="formContainer receipt-wrapper">
                <div className="receipt-card">
                    <h2 className="receipt-title">Receipt</h2>

                    {loadingDropdowns && accounts.length === 0 ? (
                        <div className="loading-spinner">
                            Loading accounts &amp; paymodes...
                        </div>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSave();
                            }}
                        >
                            {/* Date row */}
                            <div className="receipt-row">
                                <div className="receipt-label">Date</div>
                                <div className="receipt-value receipt-highlight">
                                    {displayDate} &nbsp; {displayTime}
                                </div>
                            </div>

                            {/* Party row */}
                            <div className="receipt-row">
                                <div className="receipt-label">Party Name</div>
                                <div className="receipt-value receipt-highlight">
                                    {party_name || "-"}
                                </div>
                            </div>

                            {/* Discount */}
                            <div className="receipt-row">
                                <div className="receipt-label">Discount</div>
                                <div className="receipt-value">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* TDS */}
                            <div className="receipt-row">
                                <div className="receipt-label">TDS</div>
                                <div className="receipt-value">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={tds}
                                        onChange={(e) => setTds(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Received Amount */}
                            <div className="receipt-row">
                                <div className="receipt-label receipt-bold">
                                    Received Amount
                                </div>
                                <div className="receipt-value">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={receivedAmount}
                                        onChange={(e) => setReceivedAmount(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Account */}
                            <div className="receipt-row">
                                <div className="receipt-label">Account</div>
                                <div className="receipt-value">
                                    <select
                                        value={accountId}
                                        onChange={(e) => setAccountId(e.target.value)}
                                        required
                                    >
                                        <option value="" hidden>
                                            Select Account
                                        </option>
                                        {accounts.map((acc) => (
                                            <option key={acc.AccountId} value={acc.AccountId}>
                                                {acc.AccountName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Paymode */}
                            <div className="receipt-row">
                                <div className="receipt-label">Paymode</div>
                                <div className="receipt-value">
                                    <select
                                        value={paymodeId}
                                        onChange={(e) => setPaymodeId(e.target.value)}
                                        required
                                    >
                                        <option value="" hidden>
                                            Select Paymode
                                        </option>
                                        {paymodes.map((pm) => (
                                            <option key={pm.PaymodeId} value={pm.PaymodeId}>
                                                {pm.PaymodeName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Note */}
                            <div className="receipt-row">
                                <div className="receipt-label">Note</div>
                                <div className="receipt-value">
                                    <textarea
                                        rows={3}
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Enter note..."
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="receipt-buttons">
                                <button
                                    type="button"
                                    className="receipt-btn receipt-btn-secondary"
                                    onClick={handleBack}
                                >
                                    <FaArrowLeft style={{ marginRight: 6 }} />
                                    BACK
                                </button>
                                <button
                                    type="submit"
                                    className="receipt-btn receipt-btn-primary"
                                    disabled={saving}
                                >
                                    <FaSave style={{ marginRight: 6 }} />
                                    {saving ? "SAVING..." : "SAVE"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style>{`
        .receipt-wrapper {
          display: flex;
          justify-content: center;
          padding: 20px;
        }

        .receipt-card {
          width: 100%;
          max-width: 700px;
          background: #ffffff;
          border-radius: 6px;
          padding: 24px 32px 32px;
          box-shadow: 0 0 0 1px #e5e5e5;
        }

        .receipt-title {
          text-align: center;
          margin: 0 0 24px;
          font-size: 20px;
          font-weight: 600;
        }

        .receipt-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 10px;
        }

        .receipt-label {
          width: 160px;
          font-size: 14px;
          color: #444;
        }

        .receipt-label.receipt-bold {
          font-weight: 600;
        }

        .receipt-value {
          flex: 1;
          font-size: 14px;
        }

        .receipt-highlight {
          color: #c2185b;
          font-weight: 600;
        }

        .receipt-value input,
        .receipt-value select,
        .receipt-value textarea {
          width: 100%;
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          font-size: 14px;
          outline: none;
        }

        .receipt-value input:focus,
        .receipt-value select:focus,
        .receipt-value textarea:focus {
          border-color: #c2185b;
        }

        .receipt-value textarea {
          resize: vertical;
        }

        .receipt-buttons {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 24px;
        }

        .receipt-btn {
          min-width: 110px;
          padding: 8px 18px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .receipt-btn-primary {
          background: #c2185b;
          color: #fff;
        }

        .receipt-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .receipt-btn-secondary {
          background: #ffffff;
          color: #c2185b;
          border: 1px solid #c2185b;
        }

        @media (max-width: 600px) {
          .receipt-card {
            padding: 16px;
          }
          .receipt-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .receipt-label {
            width: 100%;
          }
          .receipt-buttons {
            flex-direction: row;
            gap: 12px;
          }
        }
      `}</style>
        </>
    );
}

export default MakeReceipt;
