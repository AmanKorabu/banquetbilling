import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { FaSync, FaSearch, FaTrashRestore, FaHistory, FaCalendarAlt } from "react-icons/fa";
import Header from "./Header";
import { VscArrowLeft } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import useEscapeNavigate from "../hooks/EscapeNavigate";

const DeletedBillList = () => {
  useEscapeNavigate('/bill-list')
  const [searchTerm, setSearchTerm] = useState("");
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize dates from localStorage or use today's date for first visit
  const [fromDate, setFromDate] = useState(() => {
    const savedFromDate = localStorage.getItem('deletedBillList_fromDate');
    return savedFromDate ? dayjs(savedFromDate) : dayjs();
  });

  const [toDate, setToDate] = useState(() => {
    const savedToDate = localStorage.getItem('deletedBillList_toDate');
    return savedToDate ? dayjs(savedToDate) : dayjs();
  });

  const [restoring, setRestoring] = useState(null);

  // Save dates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('deletedBillList_fromDate', fromDate.format('YYYY-MM-DD'));
    localStorage.setItem('deletedBillList_toDate', toDate.format('YYYY-MM-DD'));
  }, [fromDate, toDate]);

  // Fetch Deleted Quotations
  const fetchDeletedItems = async () => {
    setLoading(true);
    try {
      const hotelId = localStorage.getItem("hotel_id") || "290";
      const fromDateStr = fromDate.format("YYYY-MM-DD");
      const toDateStr = toDate.format("YYYY-MM-DD");
      const apiUrl = `/banquetapi/get_deleted_bills.php?hotel_id=${hotelId}&fromdate=${fromDateStr}&todate=${toDateStr}`;

      const res = await fetch(apiUrl);
      const data = await res.json();

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
      toast.error("Failed to load deleted quotations", { toastId: 'load-failed' }, e);
      setDeletedItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedItems();
  }, [fromDate, toDate]);

  // Enhanced date change handlers
  const handleFromDateChange = (newDate) => {
    setFromDate(newDate);

    // If to date is before from date, adjust to date
    if (newDate && toDate && newDate.isAfter(toDate)) {
      setToDate(newDate);
    }
  };

  const handleToDateChange = (newDate) => {
    setToDate(newDate);
  };

  // Reset dates to today
  const resetDatesToToday = () => {
    const today = dayjs();
    setFromDate(today);
    setToDate(today);
    toast.info("Dates reset to today", { toastId: 'date-reset' });
  };

  // Restore Quotation
  const handleRestore = async (item) => {
    setRestoring(item.QuotationId);
    try {
      const url = `/banquetapi/delete_or_active_inv.php?quot_id=${item.QuotationId}&action=active&cancel_reason=restored`;
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

  const navigate = useNavigate();
  const navigateBill = () => {
    navigate('/bill-list');
  }
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
      <Header />
      <div className="deleted-list-page">
        <div className="page-header">
          <div className="header-content">
            <div className="header-title">
              <button className="btn btn-back" onClick={navigateBill}>
                <VscArrowLeft size={24} />
              </button>
              <h1>Deleted Invoices</h1>
              <p>View and restore banquet invoices</p>
            </div>
            <button
              onClick={fetchDeletedItems}
              className="btn btn-refresh"
              disabled={loading}
            >
              <FaSync className={loading ? "spinning" : ""} />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-container">
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
                  minDate={fromDate}
                  slotProps={{
                    textField: {
                      size: "small",
                      placeholder: "To Date",
                      fullWidth: true,
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
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search deleted quotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
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
                        padding: 10px;
                        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                        min-height: 100vh;
                        color: #1f2937;
                        font-family: "Inter", sans-serif;
                    }

                    .spinning {
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }

                    /* Header */
                    .page-header {
                        background: white;
                        border-radius: 12px;
                        margin-bottom: 5px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                        border: 1px solid #e2e8f0;
                    }
                    .header-content {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 16px;
                    }
                    .header-title {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .header-title h1 {
                        font-size: 20px;
                        font-weight: 700;
                        margin: 0 0 2px;
                    }
                    .header-title p {
                        font-size: 13px;
                        color: #6b7280;
                        margin: 0;
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

                    /* Buttons */
                    .btn {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        padding: 8px 12px;
                        font-size: 14px;
                        transition: all 0.3s ease;
                    }
                    .btn-refresh {
                        background: #dc2626;
                        color: white;
                    }
                    .btn-refresh:hover {
                        background: #b91c1c;
                    }
                    .btn-restore {
                        background: #059669;
                        color: white;
                        font-size: 13px;
                        padding: 6px 10px;
                        border-radius: 6px;
                    }
                    .btn-restore:hover {
                        background: #047857;
                    }
                    .btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
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

                    /* Filter Bar */
                    .filter-bar {
                        background: white;
                        border-radius: 12px;
                        padding: 16px;
                        border: 1px solid #e2e8f0;
                        margin-bottom: 8px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    }
                    .filter-container {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
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
                    .search-box {
                        flex: 2;
                        min-width: 250px;
                        position: relative;
                    }
                    .search-box input {
                        width: 100%;
                        padding: 10px 10px 10px 36px;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        font-size: 14px;
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

                    /* Content */
                    .content-section {
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 16px;
                        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
                        min-height: 400px;
                    }
                    .state {
                        text-align: center;
                        color: #6b7280;
                        padding: 60px 0;
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
                        padding: 10px;
                        border-bottom: 1px solid #f1f5f9;
                        font-size: 13px;
                        text-align: left;
                    }
                    
                    .deleted-table th {
                        background: #f8fafc;
                        font-weight: 600;
                        color: #374151;
                    }
                    
                    .deleted-table tr:hover {
                        background: #f9fafb;
                    }

                    /* Summary */
                    .summary {
                        text-align: center;
                        background: white;
                        padding: 10px;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        color: #6b7280;
                        font-size: 14px;
                        margin-top: 8px;
                    }

                    /* Responsive */
                    @media (max-width: 768px) {
                        .deleted-list-page {
                            padding: 8px;
                        }
                        
                        .header-content {
                            flex-direction: row;
                            gap: 12px;
                            align-items: flex-start;
                        }
                        
                        .filter-row {
                            flex-direction: column;
                            align-items: stretch;
                        }
                        
                        .date-filter-group, 
                        .search-box,
                        .date-controls {
                            width: 100%;
                        }
                        
                        .date-controls {
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
                            padding: 6px 10px;
                            font-size: 12px;
                        }
                    }

                    @media (max-width: 480px) {
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

export default DeletedBillList;