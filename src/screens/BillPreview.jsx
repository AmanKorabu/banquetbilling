import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEdit, FaPrint, FaArrowLeft, FaShare, FaWhatsapp, FaFilePdf, FaDownload } from "react-icons/fa";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import useEscapeNavigate from "../hooks/EscapeNavigate";

const BillPreview = () => {
    const navigate = useNavigate();
    useEscapeNavigate('/bill-list')
    const location = useLocation();
    const [billData, setBillData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [generatingPDF, setGeneratingPDF] = useState(false);

    const {
        quotationId: quotationIdFromState,
        invoiceId: invoiceIdFromState,
        billAmount: navBillAmount,
        receivedAmount: navReceivedAmount,
        discount: navDiscount,
        tds: navTds,
        balance: navBalance,
        quot_id: legacyQuotId,
        bill_id: legacyBillId,
    } = location.state || {};

    const quotationId = quotationIdFromState || legacyQuotId;
    const invoiceId = invoiceIdFromState || legacyBillId;

    const hotel_id = localStorage.getItem("hotel_id");

    useEffect(() => {
        if (quotationId) {
            fetchBillData();
        } else {
            toast.error("No quotation ID provided");
            navigate("/bill-list");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quotationId, invoiceId]);

    const fetchBillData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/banquetapi/print_preview.php?hotel_id=${hotel_id}&quot_id=${quotationId}&bill_id=${invoiceId}`
            );
            const data = await response.json();

            console.log("🔍 Full Bill API Response:", data);

            if (data.result && data.result.length > 0) {
                setBillData(data);

                const mainData = data.result[0];
                const events = data.events || [];
                const allItems = events.flatMap(event => event.items_arr || []);

                console.log("🔍 Main Data:", mainData);
                console.log("🔍 Events:", events);
                console.log("🔍 All Items:", allItems);

                const calculatedSubTotal = allItems.reduce((sum, item) =>
                    sum + (parseFloat(item.Quantity || 0) * parseFloat(item.Rate || 0)), 0);
                console.log("🔍 Calculated SubTotal from items:", calculatedSubTotal);
                console.log("🔍 API SubTotal:", mainData.SubtotalAll || mainData.SubTotalAll || mainData.SubTotal);

            } else {
                toast.error("Bill not found");
                navigate("/bill-list");
            }
        } catch (error) {
            console.error("Error fetching bill:", error);
            toast.error("Failed to load bill data");
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        if (!whatsappNumber || whatsappNumber.length !== 10) {
            toast.error("Please enter a valid 10-digit WhatsApp number");
            return;
        }

        setGeneratingPDF(true);
        try {
            toast.info("Generating PDF...");

            const billElement = document.getElementById('bill-print');
            
            // Generate high-quality canvas
            const canvas = await html2canvas(billElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                removeContainer: true,
                width: billElement.scrollWidth,
                height: billElement.scrollHeight
            });

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Calculate dimensions to fit PDF page
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            
            pdf.addImage(canvas, 'JPEG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
            
            // Generate PDF as blob
            const pdfBlob = pdf.output('blob');
            await sharePDFViaWhatsApp(pdfBlob);

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setGeneratingPDF(false);
        }
    };

    const sharePDFViaWhatsApp = async (pdfBlob) => {
        const mainData = billData.result[0];
        
        // Create file object
        const pdfFile = new File([pdfBlob], `invoice_${mainData.InvoiceNo || invoiceId}.pdf`, {
            type: 'application/pdf'
        });

        // Create message
        const message = 
            `*XPRESS BANQUET - INVOICE*\n\n` +
            `Guest: ${mainData.PartyName}\n` +
            `Function: ${mainData.FunctionName}\n` +
            `Invoice Amount: ₹${mainData.BillAmount}\n` +
            `Date: ${mainData.InvoiceDate || mainData.BillDate || mainData.QuotationDate}\n` +
            `Invoice No: ${mainData.InvoiceNo || invoiceId}\n\n` +
            `Please find the attached invoice.\n\n` +
            `Thank you for choosing XPRESS BANQUET!`;

        // Method 1: Native Share API (Mobile Devices)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            try {
                await navigator.share({
                    files: [pdfFile],
                    title: `Invoice - ${mainData.InvoiceNo || invoiceId}`,
                    text: message
                });
                toast.success("PDF shared successfully via WhatsApp!");
                return;
            } catch (shareError) {
                console.log("Native share failed:", shareError);
            }
        }

        // Method 2: WhatsApp API with PDF
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/91${whatsappNumber}?text=${encodedMessage}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Auto-download the PDF for manual attachment
        setTimeout(() => {
            const downloadLink = document.createElement('a');
            downloadLink.href = pdfUrl;
            downloadLink.download = `invoice_${mainData.InvoiceNo || invoiceId}.pdf`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            toast.info(
                <div>
                    PDF downloaded. Please attach it manually to WhatsApp.<br/>
                    <small>File: invoice_{mainData.InvoiceNo || invoiceId}.pdf</small>
                </div>,
                { autoClose: 5000 }
            );
        }, 1000);
    };

    const downloadPDF = async () => {
        setGeneratingPDF(true);
        try {
            toast.info("Generating PDF...");

            const billElement = document.getElementById('bill-print');
            const canvas = await html2canvas(billElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            
            pdf.addImage(canvas, 'JPEG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
            
            const mainData = billData.result[0];
            pdf.save(`invoice_${mainData.InvoiceNo || invoiceId}.pdf`);
            toast.success("PDF downloaded successfully!");

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setGeneratingPDF(false);
        }
    };

    const handleShareWhatsAppText = () => {
        if (!whatsappNumber || whatsappNumber.length !== 10) {
            toast.error("Please enter a valid 10-digit WhatsApp number");
            return;
        }

        const mainData = billData.result[0];
        const invoiceDateRaw = mainData.InvoiceDate || mainData.BillDate || mainData.Bill_Date || mainData.BillDt || mainData.QuotationDate;

        const message =
            `*XPRESS BANQUET - INVOICE*\n\n` +
            `Guest: ${mainData.PartyName}\n` +
            `Function: ${mainData.FunctionName}\n` +
            `Invoice Amount: ₹${mainData.BillAmount}\n` +
            `Date: ${invoiceDateRaw}\n` +
            `Invoice No: ${mainData.InvoiceNo || invoiceId}\n\n` +
            `Thank you for choosing XPRESS BANQUET!`;

        const whatsappUrl = `https://wa.me/91${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        navigate("/bill-list");
    };

    const handleEdit = () => {
        const mainData = billData?.result?.[0] || {};

        const invoiceNo =
            mainData.InvoiceNo ||
            mainData.BillNo ||
            mainData.QuotationNo ||
            invoiceId;

        navigate("/new-booking", {
            state: {
                mode: "edit",
                quotationMeta: {
                    hotel_id,
                    quot_id: quotationId || mainData.QuotId || mainData.QuotationId,
                    quotation_no: mainData.QuotationNo,
                    invoice_no: invoiceNo,
                    party_name: mainData.PartyName,
                    bill_id: invoiceId || mainData.BillId || mainData.InvoiceId,
                    from: "bill",
                },
            },
        });
    };

    const convertNumberToWords = (num) => {
        if (!num || isNaN(num)) return "ZERO";

        const number = parseFloat(num);
        if (number === 0) return "ZERO";

        const ones = [
            "",
            "ONE",
            "TWO",
            "THREE",
            "FOUR",
            "FIVE",
            "SIX",
            "SEVEN",
            "EIGHT",
            "NINE",
            "TEN",
            "ELEVEN",
            "TWELVE",
            "THIRTEEN",
            "FOURTEEN",
            "FIFTEEN",
            "SIXTEEN",
            "SEVENTEEN",
            "EIGHTEEN",
            "NINETEEN",
        ];
        const tens = [
            "",
            "",
            "TWENTY",
            "THIRTY",
            "FORTY",
            "FIFTY",
            "SIXTY",
            "SEVENTY",
            "EIGHTY",
            "NINETY",
        ];

        const convertBelowHundred = (n) => {
            if (n < 20) return ones[n];
            return (
                tens[Math.floor(n / 10)] +
                (n % 10 !== 0 ? " " + ones[n % 10] : "")
            );
        };

        const convertBelowThousand = (n) => {
            if (n < 100) return convertBelowHundred(n);
            return (
                ones[Math.floor(n / 100)] +
                " HUNDRED" +
                (n % 100 !== 0
                    ? " AND " + convertBelowHundred(n % 100)
                    : "")
            );
        };

        let n = Math.floor(number);
        let result = "";

        if (n >= 10000000) {
            const crores = Math.floor(n / 10000000);
            result += convertBelowThousand(crores) + " CRORE ";
            n %= 10000000;
        }

        if (n >= 100000) {
            const lakhs = Math.floor(n / 100000);
            result += convertBelowThousand(lakhs) + " LAKH ";
            n %= 100000;
        }

        if (n >= 1000) {
            const thousands = Math.floor(n / 1000);
            result += convertBelowThousand(thousands) + " THOUSAND ";
            n %= 1000;
        }

        if (n > 0) {
            if (result !== "") result += "AND ";
            result += convertBelowThousand(n);
        }

        return result.trim() + " ONLY";
    };

    const groupItemsBySubCategory = (items) => {
        const grouped = {};

        items.forEach((item) => {
            const category = item.SubCategory || item.Category || "";

            if (!grouped[category]) {
                grouped[category] = {
                    items: [],
                    subtotal: 0,
                };
            }

            const itemAmount =
                parseFloat(item.Quantity || 0) *
                parseFloat(item.Rate || 0);
            grouped[category].items.push({
                ...item,
                amount: itemAmount,
            });
            grouped[category].subtotal += itemAmount;
        });

        return grouped;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">Loading Bill Preview...</div>
            </div>
        );
    }

    if (!billData) {
        return (
            <div className="error-container">
                <div>No bill data found</div>
                <button onClick={handleBack} className="btn btn-back">
                    <FaArrowLeft /> Back to List
                </button>
            </div>
        );
    }

    const mainData = billData.result[0];
    const events = billData.events || [];
    const firstEvent = events[0] || {};

    const allItems = events.flatMap((event) => event.items_arr || []);
    const groupedItems = groupItemsBySubCategory(allItems);

    const calculatedSubTotal = allItems.reduce(
        (sum, item) =>
            sum +
            parseFloat(item.Quantity || 0) * parseFloat(item.Rate || 0),
        0
    );

    const apiSubTotal = parseFloat(
        mainData.SubtotalAll ||
        mainData.SubTotalAll ||
        mainData.SubTotal ||
        0
    );
    const subTotal =
        Math.abs(apiSubTotal - calculatedSubTotal) > 1
            ? calculatedSubTotal
            : apiSubTotal;

    const discount = parseFloat(mainData.Discount ?? navDiscount ?? 0);
    const otherCharges = parseFloat(
        mainData.OtherchBill || mainData.OtherCharges || 0
    );
    const settlementDiscount = parseFloat(
        mainData.SettlementDiscount || 0
    );
    const taxAmount = parseFloat(mainData.Tax || 0);
    const roundOff = parseFloat(
        mainData.Roundoff || mainData.RoundOff || 0
    );

    const calculatedGrandTotal =
        subTotal -
        discount +
        taxAmount +
        otherCharges -
        settlementDiscount +
        roundOff;
    const apiGrandTotal = parseFloat(
        mainData.BillAmount || navBillAmount || 0
    );
    const grandTotal =
        Math.abs(apiGrandTotal - calculatedGrandTotal) > 1
            ? calculatedGrandTotal
            : apiGrandTotal;

    const advanceReceived = (() => {
        const raw =
            mainData.ReceivedAmount ??
            mainData.ReceivedAmt ??
            mainData.AdvanceAmount ??
            navReceivedAmount ??
            0;
        const num = parseFloat(raw || 0);
        return isNaN(num) ? 0 : num;
    })();

    const remainingBalance = grandTotal - advanceReceived;

    console.log("💰 FINAL CALCULATIONS:", {
        calculatedSubTotal,
        apiSubTotal,
        finalSubTotal: subTotal,
        calculatedGrandTotal,
        apiGrandTotal,
        finalGrandTotal: grandTotal,
        advanceReceived,
        remainingBalance,
        groupedItems,
    });

    // 🔴 Derive a proper invoice date/time string from API
    const rawInvoiceDate =
        mainData.InvoiceDate ||
        mainData.BillDate ||
        mainData.Bill_Date ||
        mainData.BillDt ||
        mainData.QuotationDate || // fallback
        "";

    const rawInvoiceTime =
        mainData.InvoiceTime ||
        mainData.BillTime ||
        mainData.Bill_Time ||
        mainData.FunctionTime ||
        ""; // fallback

    // We don't know exact format from server, so keep as-is but combined
    const invoiceDateTime = rawInvoiceTime
        ? `${rawInvoiceDate}`
        : rawInvoiceDate;
    // Convert "HH:mm:ss" or "HH:mm" to "hh:mm:ss AM/PM"
    const formatTimeTo12h = (timeStr) => {
        if (!timeStr) return "";

        // Accept "HH:mm:ss" or "HH:mm"
        const parts = timeStr.split(":");
        if (parts.length < 2) return timeStr; // fallback if unexpected

        let [h, m, s = "00"] = parts;
        let hour = parseInt(h, 10);
        const minute = parseInt(m, 10);
        const second = parseInt(s, 10);

        if (isNaN(hour) || isNaN(minute) || isNaN(second)) return timeStr;

        const suffix = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        if (hour === 0) hour = 12;

        const pad = (n) => n.toString().padStart(2, "0");

        return `${pad(hour)}:${pad(minute)}:${pad(second)} ${suffix}`;
    };

    return (
        <div className="preview-container">
            {/* Action Buttons - Hidden in print */}
            <div className="action-buttons no-print">
                <button onClick={handleBack} className="btn btn-back">
                    <FaArrowLeft /> Back to List
                </button>
                <button onClick={handleEdit} className="btn btn-edit">
                    <FaEdit /> Edit Bill
                </button>
                <button onClick={handlePrint} className="btn btn-print">
                    <FaPrint /> Print
                </button>
            </div>

            {/* WhatsApp Share Section - Hidden in print */}
            <div className="whatsapp-section no-print">
                <div className="share-header">
                    <FaWhatsapp className="whatsapp-icon" />
                    <span>Share Invoice:</span>
                </div>
                <div className="share-controls">
                    <input
                        type="text"
                        placeholder="Enter 10-digit WhatsApp Number"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ""))}
                        maxLength="10"
                        className="whatsapp-input"
                        disabled={generatingPDF}
                    />
                    <div className="share-buttons">
                        <button
                            onClick={generatePDF}
                            className="btn-whatsapp-pdf"
                            disabled={generatingPDF || !whatsappNumber}
                        >
                            <FaFilePdf /> 
                            {generatingPDF ? "Generating..." : "SHARE PDF"}
                        </button>
                        <button
                            onClick={handleShareWhatsAppText}
                            className="btn-whatsapp-text"
                            disabled={generatingPDF || !whatsappNumber}
                        >
                            <FaShare /> SHARE TEXT
                        </button>
                        <button
                            onClick={downloadPDF}
                            className="btn-download-pdf"
                            disabled={generatingPDF}
                        >
                            <FaDownload /> DOWNLOAD PDF
                        </button>
                    </div>
                </div>
                {generatingPDF && (
                    <div className="pdf-generation-info">
                        <small>Generating PDF... This may take a few seconds.</small>
                    </div>
                )}
            </div>

            {/* Bill Content */}
            <div className="bill-print" id="bill-print">
                {/* Header */}
                <div className="print-header">
                    <div className="company-info">
                        <h1>XPRESS BANQUET</h1>
                        <p>Kolhapur Maharashtra</p>
                    </div>
                </div>
                <div className="bill-title">
                    <h2>TAX INVOICE</h2>
                </div>

                {/* Customer Details */}
                <div className="customer-details">
                    <table className="details-table">
                        <tbody>
                            <tr>
                                <td width="50%">
                                    <strong>Invoice No:</strong>{" "}
                                    {mainData.InvoiceNo || invoiceId}
                                </td>
                                <td width="50%">
                                    <strong>Invoice Date:</strong>{" "}
                                    {invoiceDateTime}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Billing Name:</strong>{" "}
                                    {mainData.BillingCompany}
                                </td>
                                <td>
                                    <strong>Attended By:</strong>{" "}
                                    {mainData.AttendedByName}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Guest Name:</strong>{" "}
                                    {mainData.PartyName}
                                </td>
                                <td>
                                    <strong>Guest Mobile:</strong>{" "}
                                    {mainData.PhoneNo}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Company Name:</strong>{" "}
                                    {mainData.CompanyName ||
                                        "RN Software and consultors"}
                                </td>
                                <td>
                                    <strong>GST No.:</strong>{" "}
                                    {mainData.GSTNo || "N/A"}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Address:</strong>{" "}
                                    {mainData.AddressLine1}{" "}
                                    {mainData.AddressLine2}
                                </td>
                                <td>
                                    <strong>Venue:</strong>{" "}
                                    {firstEvent.VenueName}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Status:</strong>{" "}
                                    <span className="status">
                                        {mainData.Status}
                                    </span>
                                </td>
                                <td>
                                    <strong>Function:</strong>{" "}
                                    {mainData.FunctionName}
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Min Pax:</strong> {firstEvent.MinPax}</td>
                                <td>
                                    <strong>Function Start:</strong>{" "}
                                    {mainData.QuotationDate}{" "}
                                    {formatTimeTo12h(mainData.FunctionTime)}
                                </td>
                            </tr>
                            <tr>
                                <td></td>
                                <td>
                                    <strong>Function End:</strong>{" "}
                                    {mainData.QuotationDateTo}{" "}
                                    {formatTimeTo12h(firstEvent.TimeTo)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
     
                {/* Items Table with Sub-Categories */}
                <div className="items-section">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th
                                    width="60%"
                                    style={{ textAlign: "left" }}
                                >
                                    Item Name
                                </th>
                                <th
                                    width="13%"
                                    className="text-center"
                                >
                                    Qty
                                </th>
                                <th
                                    width="13%"
                                    className="text-center"
                                >
                                    Rate
                                </th>
                                <th
                                    width="14%"
                                    className="text-center"
                                >
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedItems).map(
                                ([category, categoryData], categoryIndex) => (
                                    <React.Fragment key={category}>
                                        {categoryData.items.map(
                                            (item, itemIndex) => (
                                                <tr
                                                    key={`${categoryIndex}-${itemIndex}`}
                                                >
                                                    <td
                                                        style={{
                                                            paddingLeft:
                                                                "20px",
                                                        }}
                                                    >
                                                        {item.ItemName}
                                                        <h4>
                                                            {
                                                                item.menus_names
                                                            }
                                                        </h4>
                                                    </td>
                                                    <td className="text-center">
                                                        {parseFloat(
                                                            item.Quantity ||
                                                            0
                                                        ).toFixed(2)}
                                                    </td>
                                                    <td className="text-center">
                                                        ₹
                                                        {parseFloat(
                                                            item.Rate || 0
                                                        ).toLocaleString(
                                                            "en-IN",
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        ₹
                                                        {item.amount.toLocaleString(
                                                            "en-IN",
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )}

                                        <tr className="category-subtotal">
                                            <td
                                                colSpan="3"
                                                style={{
                                                    textAlign: "right",
                                                    fontWeight: "bold",
                                                    padding: "6px 10px",
                                                    border: "1px solid #888",
                                                }}
                                            >
                                                {category} Subtotal:
                                            </td>
                                            <td
                                                className="text-center"
                                                style={{
                                                    fontWeight: "bold",
                                                    border:
                                                        "1px solid #888",
                                                }}
                                            >
                                                ₹
                                                {categoryData.subtotal.toLocaleString(
                                                    "en-IN",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                            </td>
                                        </tr>

                                        <tr>
                                            <td
                                                colSpan="4"
                                                style={{
                                                    height: "5px",
                                                    border: "none",
                                                }}
                                            ></td>
                                        </tr>
                                    </React.Fragment>
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bill Summary */}
                <div className="bill-summary">
                    <table className="summary-table">
                        <tbody>
                            <tr>
                                <td width="50%"></td>
                                <td
                                    width="40%"
                                    className="text-right"
                                >
                                    <table className="amount-table">
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <strong>Sub Total:</strong>
                                                </td>
                                                <td className="text-center">
                                                    ₹
                                                    {subTotal.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>Discount:</strong>
                                                </td>
                                                <td className="text-center">
                                                    ₹
                                                    {discount.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>Tax:</strong>
                                                </td>
                                                <td className="text-center">
                                                    ₹
                                                    {taxAmount.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>
                                                        Other Charges:
                                                    </strong>
                                                </td>
                                                <td className="text-center">
                                                    ₹
                                                    {otherCharges.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>
                                                        Settlement Discount:
                                                    </strong>
                                                </td>
                                                <td className="text-center">
                                                    ₹
                                                    {settlementDiscount.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>Round Off:</strong>
                                                </td>
                                                <td className="text-center">
                                                    ₹
                                                    {roundOff.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                            <tr className="grand-total">
                                                <td>
                                                    <strong>
                                                        Grand Total:
                                                    </strong>
                                                </td>
                                                <td className="text-center">
                                                    ₹
                                                    {grandTotal.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>
                                                        Advance Received:
                                                    </strong>
                                                </td>
                                                <td className="text-center">
                                                    ₹
                                                    {advanceReceived.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>
                                                        Remaining Balance:
                                                    </strong>
                                                </td>
                                                <td className="text-center">
                                                    ₹
                                                    {remainingBalance.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Amount in Words */}
                <div className="amount-words">
                    <p>
                        <strong>Rupees:</strong>{" "}
                        {convertNumberToWords(grandTotal)}
                    </p>
                </div>

                {/* Tax Summary */}
                <div className="tax-summary">
                    <p>
                        <strong>Tax Summary:</strong>{" "}
                        {firstEvent.tax_arr?.[0]?.TaxSummary ||
                            "CGST 9% 3,240.00, SGST 9% 3,240.00"}
                    </p>
                </div>

                {/* Footer */}
                <div className="print-footer">
                    <div className="signatures">
                        <div className="jurisdiction">
                            <p>
                                <strong>Subject to Jurisdiction:</strong>{" "}
                                Kolhapur
                            </p>
                            <p>
                                <strong>Bank Details:</strong> XPRESS BANQUET,
                                A/C No: XXXX XXXX XXXX, IFSC: XXXX
                            </p>
                        </div>
                        <div className="signature-box">
                            <div className="signature-line"></div>
                            <p>Guest Signature</p>
                        </div>
                        <div className="signature-box">
                            <div className="signature-line"></div>
                            <p>Authorised Signatory</p>
                        </div>
                    </div>
                    <div className="closing">
                        <p className="thank-you">Thank You! Visit Again!</p>
                        <p className="print-date">
                            {new Date().toLocaleDateString("en-GB")}{ " "}
                            {new Date().toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                            })}
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .preview-container {
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 20px;
                    background: white;
                    font-family: Arial, sans-serif;
                    border: 1px solid black;
                }

                .no-print {
                    margin-bottom: 20px;
                }

                .action-buttons {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .btn-back { 
                    background: #6c757d; 
                    color: white; 
                }
                .btn-edit { 
                    background: #17a2b8; 
                    color: white; 
                }
                .btn-print { 
                    background: #28a745; 
                    color: white; 
                }

                .whatsapp-section {
                    background: #e9f7f1;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }

                .share-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                    color: #25D366;
                    font-weight: bold;
                }

                .share-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .whatsapp-input {
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .share-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .btn-whatsapp-pdf, .btn-whatsapp-text, .btn-download-pdf {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    flex: 1;
                    justify-content: center;
                    min-width: 120px;
                }

                .btn-whatsapp-pdf { 
                    background: #25D366; 
                    color: white; 
                }
                .btn-whatsapp-pdf:hover:not(:disabled) { 
                    background: #1da851; 
                }

                .btn-whatsapp-text { 
                    background: #128C7E; 
                    color: white; 
                }
                .btn-whatsapp-text:hover:not(:disabled) { 
                    background: #0e6e5e; 
                }

                .btn-download-pdf { 
                    background: #dc3545; 
                    color: white; 
                }
                .btn-download-pdf:hover:not(:disabled) { 
                    background: #c82333; 
                }

                button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .pdf-generation-info {
                    text-align: center;
                    margin-top: 8px;
                    color: #666;
                }

                .bill-print {
                    background: white;
                    color: black;
                }

                .print-header {
                    text-align: center;
                    margin-bottom: 5px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 2px;
                }

                .company-info h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: bold;
                }

                .company-info p {
                    font-size: 14px;
                }

                .bill-title h2 {
                    text-align: center;
                    margin: 12px 0 0 0;
                    font-size: 18px;
                    text-decoration: underline;
                }

                .customer-details {
                    margin-bottom: 15px;
                }

                .details-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .details-table td {
                    padding: 4px 8px;
                    vertical-align: top;
                    border-bottom: 1px solid #f0f0f0;
                    font-size: 12px;
                }

                .status {
                    font-weight: bold;
                    color: #d63384;
                }

                .items-section {
                    margin-bottom: 15px;
                }

                .items-table {
                    width: 100%;
                    font-size: 12px;
                    border-collapse: collapse;
                }

                .items-table th {
                    background: #f8f9fa;
                    border: 1px solid #c8c8c8ff;
                    padding: 8px 5px;
                    text-align: right;
                    font-weight: bold;
                }

                .items-table td {
                    border: 1px solid #888888ff;
                    padding: 6px 5px;
                    
                }

                .category-header {
                    background: #f0f0f0 !important;
                    font-weight: bold;
                }

                .category-subtotal {
                    background: #f8f9fa !important;
                }

                .text-center { 
                    text-align: right; 
                }
                .text-right { 
                    text-align: left; 
                }

                .bill-summary {
                    margin-bottom: 10px;
                }

                .summary-table {
                    width: 100%;
                }

                .amount-table {
                    width: 100%;
                    font-size: 12px;
                    border-collapse: collapse;
                }

                .amount-table td {
                    border: 1px solid black;
                    padding: 4px 5px;
                }

                .grand-total {
                    font-weight: bold;
                    border-top: 2px solid #333;
                }

                .amount-words {
                    font-size: 12px;
                    margin-bottom: 8px;
                    padding: 5px;
                    background: #f8f9fa;
                }

                .tax-summary {
                    font-size: 12px;
                    margin-bottom: 85px;
                    padding: 5px;
                }

                .print-footer {
                    margin-top: 20px;
                }

                .jurisdiction {
                    font-size: 12px;
                }

                .signatures {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    gap: 10px;
                    align-items: flex-end;
                }

                .signature-box {
                    text-align: center;
                    width: 45%;
                }

                .signature-line {
                    border-bottom: 1px solid #333;
                    margin-bottom: 5px;
                    height: 20px;
                }

                .signature-box p {
                    margin: 0;
                    font-size: 12px;
                    font-weight: bold;
                }

                .closing {
                    text-align: center;
                }

                .thank-you {
                    font-weight: bold;
                    font-size: 14px;
                    margin: 0 0 5px 0;
                    color: #28a745;
                }

                .print-date {
                    font-size: 12px;
                    margin: 0;
                    color: #666;
                    text-align: end;
                }

                .loading-container, .error-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 50px 20px;
                    text-align: center;
                }

                .loading-spinner {
                    font-size: 18px;
                    color: #666;
                }

                @media print {
                    .no-print {
                        display: none !important;
                    }
                    
                    .preview-container {
                        padding: 0;
                        margin: 0;
                        max-width: none;
                        border: none;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                    }

                    .category-header {
                        background: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact;
                    }
                }

                @media (max-width: 768px) {
                    .preview-container {
                        padding: 10px;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 8px;
                        margin-bottom: 15px;
                        padding: 0 10px;
                        margin-left: -10px;
                        margin-right: -10px;
                    }
                    
                    .btn {
                        justify-content: center;
                        padding: 12px 16px;
                        font-size: 14px;
                        border-radius: 6px;
                        width: 100%;
                    }
                    
                    .whatsapp-section {
                        margin: 0 -10px 15px -10px;
                        border-radius: 0;
                        padding: 15px 10px;
                    }
                    
                    .share-buttons {
                        flex-direction: column;
                    }
                    
                    .btn-whatsapp-pdf, .btn-whatsapp-text, .btn-download-pdf {
                        width: 100%;
                    }
                    
                    .whatsapp-input {
                        min-width: 100%;
                        padding: 10px 12px;
                        font-size: 14px;
                    }
                    
                    .bill-print {
                        margin: 0 -10px;
                        padding: 0 10px;
                    }
                    
                    .print-header {
                        padding: 10px 0;
                    }
                    
                    .company-info h1 {
                        font-size: 20px;
                    }
                    
                    .bill-title h2 {
                        font-size: 16px;
                    }
                    
                    .details-table td {
                        display: block;
                        width: 100%;
                        padding: 6px 0;
                    }
                    
                    .details-table tr {
                        display: block;
                        margin-bottom: 8px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid #eee;
                    }
                    
                    .items-table {
                        font-size: 11px;
                    }
                    
                    .items-table th,
                    .items-table td {
                        padding: 4px 2px;
                    }
                    
                    .signatures {
                        flex-direction: column;
                        gap: 20px;
                    }
                    
                    .signature-box {
                        width: 100%;
                    }
                }

                @media (max-width: 480px) {
                    .preview-container {
                        padding: 5px;
                    }
                    
                    .action-buttons {
                        margin-left: -5px;
                        margin-right: -5px;
                    }
                    
                    .whatsapp-section {
                        margin-left: -5px;
                        margin-right: -5px;
                    }
                    
                    .bill-print {
                        margin: 0 -5px;
                        padding: 0 5px;
                    }
                    
                    .items-table {
                        font-size: 10px;
                    }
                    
                    .company-info h1 {
                        font-size: 18px;
                    }
                    
                    .bill-title h2 {
                        font-size: 14px;
                    }
                }
            `}</style>
        </div>
    );
};

export default BillPreview;