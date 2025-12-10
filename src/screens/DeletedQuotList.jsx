import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { FaSync, FaSearch, FaTrashRestore, FaHistory, FaTimes, FaCalendarAlt } from "react-icons/fa";
import NewBookingDashboard from "../components/NewBookingDashboard";

const DeletedQuotList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(null);

  // Initialize dates from localStorage or use today's date
  const [fromDate, setFromDate] = useState(() => {
    const savedFromDate = localStorage.getItem('deletedQuot_fromDate');
    return savedFromDate ? dayjs(savedFromDate) : dayjs();
  });

  const [toDate, setToDate] = useState(() => {
    const savedToDate = localStorage.getItem('deletedQuot_toDate');
    return savedToDate ? dayjs(savedToDate) : dayjs();
  });

  // Date Validation State
  const [dateValidation, setDateValidation] = useState({
    isValid: true,
    error: null
  });

  // Save dates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('deletedQuot_fromDate', fromDate.format('YYYY-MM-DD'));
    localStorage.setItem('deletedQuot_toDate', toDate.format('YYYY-MM-DD'));
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

  // Fetch Deleted Quotations - UPDATED with validation check
  const fetchDeletedItems = async () => {
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
      const apiUrl = `/banquetapi/get_quot_list_deleted.php?hotel_id=${hotelId}&fromdate=${fromDateStr}&todate=${toDateStr}`;

      console.log("📡 Fetching deleted quotations from:", apiUrl);

      const res = await fetch(apiUrl);
      const data = await res.json();

      console.log("📦 API Response:", data);

      const parsed = Array.isArray(data)
        ? data
        : data?.result && Array.isArray(data.result)
          ? data.result
          : [];

      if (parsed.length > 0) {
        setDeletedItems(parsed);
        // toast.success(`Loaded ${parsed.length} deleted quotations`, { toastId: 'load-success' });
      } else {
        setDeletedItems([]);
        // toast.info("No deleted quotations found for selected dates", { toastId: 'no-deleted' });
      }
    } catch (e) {
      console.error("❌ Error fetching deleted quotations:", e);
      toast.error("Failed to load deleted quotations", { toastId: 'load-failed' });
      setDeletedItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Use useEffect to fetch items when dates change
  useEffect(() => {
    // Only fetch if date range is valid
    if (dateValidation.isValid) {
      fetchDeletedItems();
    }
  }, [fromDate, toDate, dateValidation.isValid]);

  // Restore Quotation
  const handleRestore = async (item) => {
    setRestoring(item.QuotationId);
    try {
      const url = `/banquetapi/delete_or_active_quot.php?quot_id=${item.QuotationId}&action=active&cancel_reason=restored`;
      const res = await fetch(url, { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Quotation ${item.QuotationNo} restored successfully`, { toastId: 'restore-success' });
        setDeletedItems((prev) => prev.filter((i) => i.QuotationId !== item.QuotationId));
      } else throw new Error(result.message || "Restore failed");
    } catch {
      toast.error("Failed to restore quotation", { toastId: 'restore-failed' });
    } finally {
      setRestoring(null);
    }
  };

  // Filter by search
  const filtered = deletedItems.filter((i) =>
    [i.PartyName, i.QuotationNo, i.FunctionName, i.BillingCompany]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Reset dates to today
  const resetDatesToToday = () => {
    const today = dayjs();
    setFromDate(today);
    setToDate(today);
    toast.info("Dates reset to today", { toastId: 'date-reset' });
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.shiftKey && (event.key === 'R' || event.key === 'r')) {
        event.preventDefault();
        fetchDeletedItems();
      }
      if (event.shiftKey && (event.key === 'T' || event.key === 't')) {
        event.preventDefault();
        resetDatesToToday();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [fetchDeletedItems]);

  return (
    <>
      <NewBookingDashboard />
      <div className="deleted-list-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-title">
              <h1>Deleted Quotations</h1>
              <p>View and restore banquet quotations</p>
            </div>
            <button
              onClick={fetchDeletedItems}
              className="btn btn-refresh"
              disabled={loading || !dateValidation.isValid}
            >
              <FaSync className={loading ? "spinning" : ""} />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-row">
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
                  }
                }}
              />
            </div>
            <div className="date-filter-group">
              <label>To Date</label>
              <DatePicker
                value={toDate}
                onChange={handleToDateChange}
                format="DD-MM-YYYY"
                minDate={fromDate}
                slotProps={{
                  textField: {
                    size: "small",
                    placeholder: "To Date",
                    fullWidth: true,
                    error: !dateValidation.isValid
                  }
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
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search deleted quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
        </div>

        {/* Content */}
        <div className="content-section">
          {loading ? (
            <div className="state">
              <FaSync className="spinning" size={28} />
              <p>Loading deleted quotations...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="state empty">
              <FaHistory size={50} color="#9ca3af" />
              <h3>No Deleted Quotations</h3>
              <p>Adjust your search filters or try again.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="deleted-table">
                <thead>
                  <tr>
                    <th>Quotation No</th>
                    <th>Function Date</th>
                    <th>Party Name</th>
                    <th>Company Name</th>
                    <th>Status</th>
                    <th>Quotation Date</th>
                    <th>Function</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.QuotationId}>
                      <td>{item.QuotationNo}</td>
                      <td>{item.QuotationDate}</td>
                      <td>{item.PartyName}</td>
                      <td>{item.BillingCompany}</td>
                      <td>{item.Status}</td>
                      <td>{item.CreatedDate}</td>
                      <td>{item.FunctionName}</td>
                      <td>
                        <button
                          onClick={() => handleRestore(item)}
                          disabled={restoring === item.QuotationId}
                          className="btn btn-restore"
                        >
                          {restoring === item.QuotationId ? (
                            <FaSync className="spinning" />
                          ) : (
                            <FaTrashRestore />
                          )}
                          {restoring === item.QuotationId ? "..." : "Restore"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="summary">
          Showing <b>{filtered.length}</b> of <b>{deletedItems.length}</b> deleted quotations
          {searchTerm && ` • Search: "${searchTerm}"`}
        </div>

        {/* Styles */}
        <style>{`
          .deleted-list-page {
            max-width: 1400px;
            margin: 0 auto;
            padding: 1px;
            background: #f8fafc;
            min-height: 100vh;
            color: #1f2937;
            font-family: "Inter", sans-serif;
          }

          .spinning {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          /* Header */
          .page-header {
            background: white;
            border-radius: 12px;
            margin-bottom: 6px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }
          
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 20px;
          }
          
          .header-title h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 4px;
            color: #dc2626;
          }
          
          .header-title p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
          }

          /* Buttons */
          .btn {
            display: flex;
            align-items: center;
            gap: 6px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          
          .btn-refresh {
            background: #dc2626;
            color: white;
          }
          
          .btn-refresh:hover:not(:disabled) {
            background: #b91c1c;
          }
          
          .btn-refresh:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .btn-restore {
            background: #059669;
            color: white;
            font-size: 13px;
            padding: 6px 12px;
            border-radius: 6px;
          }
          
          .btn-restore:hover:not(:disabled) {
            background: #047857;
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
            height: 40px;
          }
          
          .btn-reset-date:hover {
            background: #4b5563;
          }

          /* Filter Bar */
          .filter-bar {
            background: white;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #e2e8f0;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .filter-row {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: end;
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
          
          .date-controls {
            display: flex;
            align-items: end;
          }
          
          .search-box {
            flex: 2;
            position: relative;
            min-width: 250px;
          }
          
          .search-box input {
            width: 100%;
            padding: 8px 12px 8px 36px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            height: 40px;
          }
          
          .search-box input:focus {
            outline: none;
            border-color: #dc2626;
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
          }
          
          .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
          }

          /* Date Validation Error */
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
            margin-top: 12px;
          }
          
          .error-icon {
            font-size: 16px;
          }
          
          .error-message {
            font-weight: 500;
          }

          /* Content */
          .content-section {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            min-height: 400px;
            margin-bottom: 16px;
          }
          
          .state {
            text-align: center;
            color: #6b7280;
            padding: 60px 0;
          }
          
          .empty h3 {
            margin: 16px 0 8px;
            color: #374151;
          }
          
          .empty p {
            color: #6b7280;
            font-size: 14px;
          }
          
          .table-container {
            overflow-x: auto;
          }
          
          .deleted-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
          }
          
          .deleted-table th,
          .deleted-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
            text-align: left;
          }
          
          .deleted-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .deleted-table tr:hover {
            background: #f9fafb;
          }
          
          .deleted-table tr:last-child td {
            border-bottom: none;
          }

          /* Summary */
          .summary {
            text-align: center;
            background: white;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            color: #6b7280;
            font-size: 14px;
          }

          /* Responsive */
          @media (max-width: 768px) {
            .deleted-list-page {
              padding: 12px;
            }
            
            .header-content {
              flex-direction: row;
              align-items: stretch;
              gap: 12px;
            }
            
            .filter-row {
              flex-direction: column;
              align-items: stretch;
            }
            
            .date-filter-group,
            .date-controls,
            .search-box {
              width: 100%;
            }
            
            .btn-reset-date {
              width: 100%;
              justify-content: center;
            }
            
            .deleted-table {
              font-size: 12px;
            }
            
            .deleted-table th,
            .deleted-table td {
              padding: 8px;
            }
            
            .btn {
              padding: 6px 12px;
              font-size: 13px;
            }
          }

          @media (max-width: 480px) {
            .deleted-list-page {
              padding: 8px;
            }
            
            .deleted-table {
              font-size: 11px;
            }
            
            .deleted-table th,
            .deleted-table td {
              padding: 6px;
            }
            
            .btn-restore {
              padding: 4px 8px;
              font-size: 11px;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default DeletedQuotList;