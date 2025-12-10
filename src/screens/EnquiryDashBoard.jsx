import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ConfirmBackButton from '../components/ConfirmBackButton';
import { DatePicker } from "@mui/x-date-pickers";
import { useNavigate } from 'react-router-dom';
import { IoIosAddCircleOutline } from "react-icons/io";
import { IoChevronForward } from "react-icons/io5";
import { MdDeleteOutline, MdDownload } from "react-icons/md";
import { FaSearch, FaCalendarAlt, FaSync, FaHistory, FaEdit, FaFileInvoice } from "react-icons/fa";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import useEscapeNavigate from '../hooks/EscapeNavigate';

function EnquiryDashBoard() {
  const navigate = useNavigate();
  useEscapeNavigate('/dashboard');

  // ----------------- STATE -----------------
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Dates (same pattern as DeletedBillList)
  const [fromDate, setFromDate] = useState(() => {
    const saved = localStorage.getItem('enquiryDashboard_fromDate');
    return saved ? dayjs(saved) : dayjs();
  });

  const [toDate, setToDate] = useState(() => {
    const saved = localStorage.getItem('enquiryDashboard_toDate');
    return saved ? dayjs(saved) : dayjs();
  });

  // Save dates in localStorage
  useEffect(() => {
    localStorage.setItem('enquiryDashboard_fromDate', fromDate.format('YYYY-MM-DD'));
    localStorage.setItem('enquiryDashboard_toDate', toDate.format('YYYY-MM-DD'));
  }, [fromDate, toDate]);

  // ----------------- DATE HANDLERS -----------------
  const handleFromDateChange = (newDate) => {
    setFromDate(newDate);

    // Ensure To Date is not before From Date
    if (newDate && toDate && newDate.isAfter(toDate)) {
      setToDate(newDate);
    }
  };

  const handleToDateChange = (newDate) => {
    setToDate(newDate);
  };

  const resetDatesToToday = useCallback(() => {
    const today = dayjs();
    setFromDate(today);
    setToDate(today);
    toast.info("Dates reset to today", { toastId: 'enq-date-reset' });
  }, []);

  // ----------------- API CALL -----------------
  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const hotelId = localStorage.getItem("hotel_id") || "290";
      const fromDateStr = fromDate.format("YYYY-MM-DD");
      const toDateStr = toDate.format("YYYY-MM-DD");

      const apiUrl = `/banquetapi/get_enq_list.php?hotel_id=${hotelId}&fromdate=${fromDateStr}&todate=${toDateStr}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      const parsed = Array.isArray(data)
        ? data
        : Array.isArray(data?.result)
          ? data.result
          : [];

      setEnquiries(parsed);

      if (parsed.length === 0) {
        // toast.info("No enquiries found for selected dates", { toastId: 'enq-no-data' });
      } else {
        // toast.success(`Loaded ${parsed.length} enquiries`, { toastId: 'enq-load-success' });
      }
    } catch (e) {
      console.error("Error loading enquiries:", e);
      toast.error("Failed to load enquiries", { toastId: 'enq-load-failed' });
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  // Auto-load on mount & date change
  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // ----------------- ROW ACTION HANDLERS -----------------
  const GoToNewEnquiry = () => {
    navigate('/new-enquiry');
  };

  const GoToBack = () => {
    navigate('/dashboard');
  };

  const handleEditEnquiry = (item) => {
    // Adjust state shape as per your NewEnquiry page
    navigate('/new-enquiry', {
      state: {
        mode: 'edit',
        enquiryId: item.QuotationId,
        enquiry: item,
      },
    });
  };

  const handleMakeQuotation = (item) => {
    navigate('/new-booking', {
      state: {
        fromEnquiry: true,
        mode: 'from-enquiry',     // you can also make this 'enquiry'
        enquiryId: item.QuotationId,
        enquiryMeta: item,
        backTo: '/enquiry-dashboard',  // <-- IMPORTANT
      },
    });
  };

  const handleDeleteEnquiry = async (item) => {
    if (!window.confirm(`Delete enquiry ref #${item.QuotationNo}?`)) return;

    setDeletingId(item.QuotationId);
    try {
      // 🔴 Adjust this URL TO YOUR REAL DELETE API
      const hotelId = localStorage.getItem("hotel_id") || "290";
      const url = `/banquetapi/delete_or_active_enquiry.php?hotel_id=${hotelId}&enq_id=${item.QuotationId}&action=delete`;

      const res = await fetch(url, { method: "POST" });
      const result = await res.json();

      if (res.ok && (result.success === "1" || result.status === "success")) {
        toast.success(`Enquiry ${item.QuotationNo} deleted`, { toastId: 'enq-delete-ok' });
        setEnquiries(prev => prev.filter(e => e.QuotationId !== item.QuotationId));
      } else {
        throw new Error(result.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete enquiry error:", err);
      toast.error("Failed to delete enquiry", { toastId: 'enq-delete-failed' });
    } finally {
      setDeletingId(null);
    }
  };

  // ----------------- SEARCH / FILTER -----------------
  const filteredEnquiries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return enquiries;

    return enquiries.filter(e =>
      [
        e.QuotationNo,
        e.PartyName,
        e.Company,
        e.Function,
        e.FunctionFrom,
        e.FunctionTo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [enquiries, searchTerm]);

  // ----------------- KEYBOARD SHORTCUTS -----------------
  useEffect(() => {
    const handleKeyPress = (event) => {
      // F1 → New Enquiry
      if (event.key === 'F1') {
        event.preventDefault();
        GoToNewEnquiry();
      }

      // Shift + R → Refresh enquiries
      if (event.shiftKey && (event.key === 'R' || event.key === 'r')) {
        event.preventDefault();
        fetchEnquiries();
      }

      // Shift + T → Reset dates to today
      if (event.shiftKey && (event.key === 'T' || event.key === 't')) {
        event.preventDefault();
        resetDatesToToday();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [fetchEnquiries, resetDatesToToday]);

  return (
    <>
      <ConfirmBackButton title="Enquiry Dashboard" onClick={GoToBack} />

      <div className="dashboard-container">
        {/* Actions & Filters */}
        <div className="enquiry-actions-section">
          {/* Quick Actions */}
          <div className="action-card">
            <div className="action-header">
              <h3 className="action-title">Quick Actions</h3>
              <p className="action-subtitle">Manage your enquiries efficiently</p>
            </div>

            <div className="action-buttons">
              <button className="action-btn primary" onClick={GoToNewEnquiry}>
                <div className="btn-icon">
                  <IoIosAddCircleOutline size={20} />
                </div>
                <span>New Enquiry</span>
                <div className="btn-arrow">
                  <IoChevronForward size={14} />
                </div>
              </button>

              <button
                className="action-btn secondary"
                // TODO: add navigation to deleted-enquiries if you have that page
                onClick={() => toast.info("Hook this to Deleted Enquiries page")}
              >
                <div className="btn-icon">
                  <MdDeleteOutline size={20} />
                </div>
                <span>View Deleted</span>
                <div className="btn-arrow">
                  <IoChevronForward size={14} />
                </div>
              </button>
            </div>
          </div>

          {/* Filter Card */}
          <div className="filter-card">
            <div className="filter-header">
              <h3 className="filter-title">Filter Enquiries</h3>
              <p className="filter-subtitle">Load enquiries by date range</p>
            </div>

            <div className="filter-controls">
              <div className="date-time-pickers">
                <div className="picker-group">
                  <label className="picker-label">From Date</label>
                  <div className="picker-container">
                    <DatePicker
                      value={fromDate}
                      onChange={handleFromDateChange}
                      format="DD-MM-YYYY"
                      slotProps={{
                        textField: {
                          size: 'small',
                          variant: 'outlined',
                          fullWidth: true,
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="picker-group">
                  <label className="picker-label">To Date</label>
                  <div className="picker-container">
                    <DatePicker
                      value={toDate}
                      onChange={handleToDateChange}
                      format="DD-MM-YYYY"
                      minDate={fromDate}
                      slotProps={{
                        textField: {
                          size: 'small',
                          variant: 'outlined',
                          fullWidth: true,
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="filter-actions-row">
                <button
                  className="btn-reset-date"
                  onClick={resetDatesToToday}
                  type="button"
                  title="Reset to today's date (Shift + T)"
                >
                  <FaCalendarAlt />
                  Today
                </button>

                <button
                  className="load-btn"
                  type="button"
                  onClick={fetchEnquiries}
                  disabled={loading}
                  title="Reload enquiries (Shift + R)"
                >
                  {loading ? <FaSync className="spinning" /> : <MdDownload size={16} />}
                  <span>{loading ? 'Loading...' : 'Load Enquiries'}</span>
                </button>
              </div>

              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by ref no, party, company, function..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enquiry List */}
        <div className="enquiry-list-section">
          {loading ? (
            <div className="state">
              <FaSync className="spinning" size={28} />
              <p>Loading enquiries...</p>
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="state empty">
              <FaHistory size={46} color="#9ca3af" />
              <h3>No Enquiries Found</h3>
              <p>Try changing the date range or search term.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="enquiry-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Actions</th>
                    <th>Ref No.</th>
                    <th>Party Name</th>
                    <th>Company</th>
                    <th>Function</th>
                    <th>Function From</th>
                    <th>Function To</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.map((item) => (
                    <tr key={item.QuotationId}>
                      <td className="action-cell">
                        <button
                          className="row-action-btn edit"
                          type="button"
                          title="Edit Enquiry"
                          onClick={() => handleEditEnquiry(item)}
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          className="row-action-btn make-quotation"
                          type="button"
                          title="Make Quotation"
                          onClick={() => handleMakeQuotation(item)}
                        >
                          <FaFileInvoice size={14} />
                        </button>
                        <button
                          className="row-action-btn delete"
                          type="button"
                          title="Delete Enquiry"
                          onClick={() => handleDeleteEnquiry(item)}
                          disabled={deletingId === item.QuotationId}
                        >
                          {deletingId === item.QuotationId ? (
                            <FaSync className="spinning" size={14} />
                          ) : (
                            <MdDeleteOutline size={16} />
                          )}
                        </button>
                      </td>
                      <td>{item.QuotationNo || "-"}</td>
                      <td>{item.PartyName || "-"}</td>
                      <td>{item.Company || "-"}</td>
                      <td>{item.Function || "-"}</td>
                      <td>{item.FunctionFrom || "-"}</td>
                      <td>{item.FunctionTo || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="summary">
          Showing <b>{filteredEnquiries.length}</b> of <b>{enquiries.length}</b> enquiries
          {searchTerm && <> • Search: "<b>{searchTerm}</b>"</>}
        </div>
      </div>

      <style>{`
        .dashboard-container {
          padding: 20px 16px;
          background: #f8fafc;
          min-height: calc(100vh - 140px);
          max-width: 1200px;
          margin: 0 auto;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Action Section */
        .enquiry-actions-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }

        .action-card, .filter-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }

        .action-header, .filter-header {
          margin-bottom: 20px;
        }

        .action-title, .filter-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px;
        }

        .action-subtitle, .filter-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          width: 100%;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #0d4781 0%, #287c77 100%);
          color: white;
        }

        .action-btn.secondary {
          background: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }

        .action-btn.primary:hover {
          background: linear-gradient(135deg, #0c3d6d 0%, #216a65 100%);
        }

        .action-btn.secondary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
        }

        .btn-arrow {
          margin-left: auto;
          opacity: 0.7;
          transition: transform 0.3s ease;
        }

        .action-btn:hover .btn-arrow {
          transform: translateX(3px);
        }

        /* Filter Section */
        .filter-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .date-time-pickers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .picker-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .picker-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .picker-container {
          background: #fff;
          border-radius: 8px;
        }

        .filter-actions-row {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-reset-date {
          background: #6b7280;
          color: white;
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
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

        .load-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #0d4781 0%, #287c77 100%);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .load-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(13, 71, 129, 0.3);
          background: linear-gradient(135deg, #0c3d6d 0%, #216a65 100%);
        }

        .load-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .search-box {
          position: relative;
          margin-top: 4px;
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
          border-color: #0d4781;
          box-shadow: 0 0 0 3px rgba(13, 71, 129, 0.15);
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        /* Enquiry List */
        .enquiry-list-section {
          margin-top: 24px;
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          min-height: 260px;
        }

        .state {
          text-align: center;
          color: #6b7280;
          padding: 60px 0;
        }

        .state h3 {
          margin-top: 8px;
          margin-bottom: 4px;
        }

        .table-container {
          overflow-x: auto;
        }

        .enquiry-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .enquiry-table th,
        .enquiry-table td {
          padding: 10px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          text-align: left;
          white-space: nowrap;
        }

        .enquiry-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #374151;
        }

        .enquiry-table tr:hover {
          background: #f9fafb;
        }

        .action-cell {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .row-action-btn {
          border: none;
          border-radius: 6px;
          padding: 4px 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
        }

        .row-action-btn.edit {
          background: #e0f2fe;
          color: #0369a1;
        }

        .row-action-btn.make-quotation {
          background: #ecfdf3;
          color: #15803d;
        }

        .row-action-btn.delete {
          background: #fee2e2;
          color: #b91c1c;
        }

        .row-action-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }

        .row-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        /* Responsive Design */
        @media (max-width: 1024px) {
          .enquiry-actions-section {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px 12px;
          }

          .date-time-pickers {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .enquiry-table {
            font-size: 12px;
          }

          .enquiry-table th,
          .enquiry-table td {
            padding: 8px;
          }
        }

        @media (max-width: 480px) {
          .enquiry-table {
            font-size: 11px;
          }

          .enquiry-table th,
          .enquiry-table td {
            padding: 6px;
          }

          .row-action-btn {
            padding: 3px 5px;
          }
        }
      `}</style>
    </>
  );
}

export default EnquiryDashBoard;
