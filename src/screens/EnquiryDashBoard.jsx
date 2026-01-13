// EnquiryDashBoard.jsx - COMPLETE FIXED VERSION
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useNavigate } from "react-router-dom";
import { IoIosAddCircleOutline } from "react-icons/io";
import {
  MdDeleteOutline,
  MdDownload,
  MdOutlineFilterList,
  MdOutlineSearch,
} from "react-icons/md";
import { FaCalendarAlt, FaSync, FaHistory, FaEdit, FaFileInvoice, FaBackward, FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";
import dayjs from "dayjs";
import useEscapeNavigate from "../hooks/EscapeNavigate";

import NewEnquiryDialog from "../components/NewEnquiryDialog";
import { useNotify } from "../context/NotifyProvider";
import { message } from "antd";

function EnquiryDashBoard() {
  const navigate = useNavigate();
  const notifyApi = useNotify();

  const showToast = useCallback(
    (type, message, opts = {}) => {
      if (!notifyApi) return;

      if (typeof notifyApi[type] === "function") return notifyApi[type](message, opts);
      if (typeof notifyApi.notify === "function") return notifyApi.notify(message, type, opts);
      if (typeof notifyApi === "function") return notifyApi(message, type, opts);


    },
    [notifyApi]
  );

  // STATE
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Dialog state
  const [showNewEnquiryDialog, setShowNewEnquiryDialog] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [loadingEnquiryDetails, setLoadingEnquiryDetails] = useState(false);

  // Delete Confirmation Popup State
  const [deletePopup, setDeletePopup] = useState({
    isOpen: false,
    enquiry: null,
    reason: "",
    loading: false
  });

  useEscapeNavigate(deletePopup.isOpen ? null : "/dashboard");

  // Dates
  const [fromDate, setFromDate] = useState(() => {
    const saved = localStorage.getItem("enquiryDashboard_fromDate");
    return saved ? dayjs(saved).startOf("day") : dayjs().startOf("day");
  });

  const [toDate, setToDate] = useState(() => {
    const saved = localStorage.getItem("enquiryDashboard_toDate");
    return saved ? dayjs(saved).startOf("day") : dayjs().startOf("day");
  });

  useEffect(() => {
    localStorage.setItem("enquiryDashboard_fromDate", fromDate.format("YYYY-MM-DD"));
    localStorage.setItem("enquiryDashboard_toDate", toDate.format("YYYY-MM-DD"));
  }, [fromDate, toDate]);

  // DATE HANDLERS
  const handleFromDateChange = (newDate) => {
    const d = newDate ? dayjs(newDate).startOf("day") : dayjs().startOf("day");
    setFromDate(d);

    if (d && toDate && d.isAfter(toDate, "day")) {
      setToDate(d);
    }
  };

  const handleToDateChange = (newDate) => {
    const d = newDate ? dayjs(newDate).startOf("day") : dayjs().startOf("day");
    setToDate(d);
  };

  const resetDatesToToday = useCallback(() => {
    const today = dayjs().startOf("day");
    setFromDate(today);
    setToDate(today);
    showToast("info", "Dates reset to today", { id: "enq-date-reset" });
  }, [showToast]);

  // API CALL - UPDATED WITH DEBUG LOGGING
  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const hotelId = localStorage.getItem("hotel_id");

      const fromDateStr = fromDate.format("DD-MM-YYYY");
      const toDateStr = toDate.format("DD-MM-YYYY");

      const apiUrl = `/banquetapi/get_enq_list.php?hotel_id=${encodeURIComponent(
        hotelId
      )}&fromdate=${encodeURIComponent(fromDateStr)}&todate=${encodeURIComponent(toDateStr)}`;



      const res = await fetch(apiUrl, { cache: "no-store" });
      const data = await res.json();



      const parsed = Array.isArray(data) ? data : Array.isArray(data?.result) ? data.result : [];

      setEnquiries(parsed);
    } catch (e) {
      console.error("Error loading enquiries:", e);
      showToast("error", "Failed to load enquiries", { id: "enq-load-failed" });
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, showToast]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // ROW ACTION HANDLERS
  const GoToBack = () => navigate("/dashboard");

  const handleNewEnquiry = () => {
    setEditingEnquiry(null);
    setShowNewEnquiryDialog(true);
  };

  // FIXED: Enhanced handleEditEnquiry with API call to get full details
  const handleEditEnquiry = async (item) => {


    // Check what we have in the list item
    const listItemAttendedBy = item.AttendedBy || item.attended_by || "";


    if (listItemAttendedBy) {
      // If we have it in the list, use it directly


      const editData = {
        ...item,
        QuotationId: item.QuotationId,
        QuotationNo: item.QuotationNo,

        // Use the attended by from list
        AttendedBy: listItemAttendedBy,
        attended_by: listItemAttendedBy,

        Company: item.Company || item.companyName || "",
        CompId: item.CompId || item.companyId || item.CompanyId || "",
        PartyName: item.PartyName || item.partyName || "",
        PartyId: item.PartyId || item.partyId || item.LedgerId || "",
        Function: item.Function || item.functionName || "",
        FunctionId: item.FunctionId || item.functionId || "",
        FunctionFrom: item.FunctionFrom,
        FunctionTo: item.FunctionTo,
      };


      setEditingEnquiry(editData);
      setShowNewEnquiryDialog(true);
    } else {
      // If not in list, fetch from API

      await fetchEnquiryDetailsForEdit(item);
    }
  };

  // NEW FUNCTION: Fetch enquiry details from API
  const fetchEnquiryDetailsForEdit = async (item) => {
    setLoadingEnquiryDetails(true);
    try {
      const hotelId = localStorage.getItem("hotel_id");
      const quotationId = item.QuotationId;

      if (!hotelId || !quotationId) {
        showToast("error", "Missing hotel ID or quotation ID", { id: "missing-ids" });
        return;
      }

      // Try multiple API endpoints
      const apiEndpoints = [
        `/banquetapi/get_enq_details.php?hotel_id=${hotelId}&quot_id=${quotationId}`,
        `/banquetapi/get_quot_details.php?hotel_id=${hotelId}&quot_id=${quotationId}`,
        `/banquetapi/get_enquiry_details.php?hotel_id=${hotelId}&enquiry_id=${quotationId}`
      ];

      let enquiryDetails = null;

      for (const endpoint of apiEndpoints) {
        try {

          const res = await fetch(endpoint, { cache: "no-store" });
          const data = await res.json();

          if (data && (data.result || data.data || Array.isArray(data))) {
            message.error(`✅ Found data from ${endpoint}:`, data);
            enquiryDetails = data;
            break;
          }
        } catch (err) {
          message.error(`❌ Failed to fetch from ${endpoint}:`, err.message);
          continue;
        }
      }

      if (!enquiryDetails) {
        showToast("warning", "Could not fetch enquiry details. Using list data.", { id: "no-details" });

        // Fallback to list data
        const editData = {
          ...item,
          QuotationId: item.QuotationId,
          QuotationNo: item.QuotationNo,
          AttendedBy: "",
          attended_by: "",
          Company: item.Company || item.companyName || "",
          CompId: item.CompId || item.companyId || item.CompanyId || "",
          PartyName: item.PartyName || item.partyName || "",
          PartyId: item.PartyId || item.partyId || item.LedgerId || "",
          Function: item.Function || item.functionName || "",
          FunctionId: item.FunctionId || item.functionId || "",
          FunctionFrom: item.FunctionFrom,
          FunctionTo: item.FunctionTo,
        };

        setEditingEnquiry(editData);
        setShowNewEnquiryDialog(true);
        return;
      }

      // Extract data from the response
      let extractedData = null;

      if (Array.isArray(enquiryDetails.result) && enquiryDetails.result.length > 0) {
        extractedData = enquiryDetails.result[0];
      } else if (Array.isArray(enquiryDetails.data) && enquiryDetails.data.length > 0) {
        extractedData = enquiryDetails.data[0];
      } else if (Array.isArray(enquiryDetails) && enquiryDetails.length > 0) {
        extractedData = enquiryDetails[0];
      } else if (enquiryDetails.result && typeof enquiryDetails.result === 'object') {
        extractedData = enquiryDetails.result;
      } else if (enquiryDetails.data && typeof enquiryDetails.data === 'object') {
        extractedData = enquiryDetails.data;
      } else {
        extractedData = enquiryDetails;
      }



      // Extract attended by from the details
      let attendedByName = "";
      let attendedById = "";

      // Check all possible field names
      const possibleNameFields = [
        'AttendedBy', 'attended_by', 'AttendedByName', 'attended_by_name',
        'Attended_By', 'AttendedBy_Name', 'UserName', 'user_name',
        'AttendedByPerson', 'attended_by_person'
      ];

      const possibleIdFields = [
        'AttendedById', 'attended_by_id', 'Userid', 'UserId',
        'AttendedByID', 'UserID', 'AttendedBy_Id'
      ];

      for (const field of possibleNameFields) {
        if (extractedData[field] && String(extractedData[field]).trim()) {
          attendedByName = String(extractedData[field]).trim();

          break;
        }
      }

      for (const field of possibleIdFields) {
        if (extractedData[field] && String(extractedData[field]).trim()) {
          attendedById = String(extractedData[field]).trim();

          break;
        }
      }

      // Combine with list data
      const editData = {
        ...item,
        ...extractedData,
        QuotationId: item.QuotationId,
        QuotationNo: item.QuotationNo,

        // Use the extracted attended by data
        AttendedBy: attendedByName,
        AttendedById: attendedById,
        attended_by: attendedByName,
        attended_by_id: attendedById,

        // Ensure other fields
        Company: extractedData.Company || item.Company || "",
        CompId: extractedData.CompId || item.CompId || "",
        PartyName: extractedData.PartyName || item.PartyName || "",
        PartyId: extractedData.PartyId || item.PartyId || "",
        Function: extractedData.Function || item.Function || "",
        FunctionId: extractedData.FunctionId || item.FunctionId || "",
        FunctionFrom: extractedData.FunctionFrom || item.FunctionFrom,
        FunctionTo: extractedData.FunctionTo || item.FunctionTo,
      };



      setEditingEnquiry(editData);
      setShowNewEnquiryDialog(true);

    } catch (error) {
      console.error("❌ Error fetching enquiry details:", error);
      showToast("error", "Failed to load enquiry details", { id: "details-error" });

      // Fallback to list data
      const editData = {
        ...item,
        QuotationId: item.QuotationId,
        QuotationNo: item.QuotationNo,
        AttendedBy: "",
        attended_by: "",
        Company: item.Company || "",
        CompId: item.CompId || "",
        PartyName: item.PartyName || "",
        PartyId: item.PartyId || "",
        Function: item.Function || "",
        FunctionId: item.FunctionId || "",
        FunctionFrom: item.FunctionFrom,
        FunctionTo: item.FunctionTo,
      };

      setEditingEnquiry(editData);
      setShowNewEnquiryDialog(true);
    } finally {
      setLoadingEnquiryDetails(false);
    }
  };

  // In EnquiryDashBoard.jsx - Update the handleMakeQuotation function
  const handleMakeQuotation = (item) => {
    // Extract ALL important data from enquiry
    const enquiryMeta = {
      ...item,
      // Ensure attended by is properly extracted with multiple field names
      AttendedBy: item.AttendedBy || item.attended_by || item.AttendedByName || "",
      attended_by: item.AttendedBy || item.attended_by || item.AttendedByName || "",
      PartyName: item.PartyName || item.party_name || "",
      PartyId: item.PartyId || item.party_id || item.LedgerId || "",
      Company: item.Company || item.company_name || item.CompName || "",
      CompId: item.CompId || item.company_id || item.CompanyId || "",
      Function: item.Function || item.function_name || item.Occasion || "",
      FunctionId: item.FunctionId || item.function_id || "",
      FunctionFrom: item.FunctionFrom,
      FunctionTo: item.FunctionTo,
      MinPax: item.MinPax || item.min_people || "",
      MaxPax: item.MaxPax || item.max_people || "",
      VenueName: item.VenueName || item.venue_name || "",
      VenueId: item.VenueId || item.venue_id || "",
      ServingName: item.ServingName || item.serving_name || "",
      ServingId: item.ServingId || item.serving_id || "",
      // ADD THESE 2 LINES
      enquiryQuotId: item.QuotationId, // Store the enquiry quotation ID
      QuotationNo: item.QuotationNo, // Store the enquiry number
    };



    // ADD THESE 3 LINES - Store in session storage
    sessionStorage.setItem('enquiryMeta', JSON.stringify(enquiryMeta));
    sessionStorage.setItem('enquiryQuotationId', item.QuotationId);
    sessionStorage.setItem('fromEnquiry', 'true');

    navigate("/new-booking", {
      state: {
        fromEnquiry: true,
        mode: "from-enquiry",
        enquiryId: item.QuotationId,
        enquiryMeta: enquiryMeta,
        backTo: "/enquiry-dashboard",
      },
    });
  };

  // DELETE POPUP FUNCTIONS
  const openDeletePopup = (enquiry) => {
    setDeletePopup({
      isOpen: true,
      enquiry: enquiry,
      reason: "",
      loading: false
    });
  };

  const closeDeletePopup = () => {
    setDeletePopup({
      isOpen: false,
      enquiry: null,
      reason: "",
      loading: false
    });
  };

  const handleDeleteConfirm = async () => {
    const enquiry = deletePopup.enquiry;
    const reason = deletePopup.reason?.trim() || "";

    if (!enquiry || reason.length < 3) return;

    const deleteId = String(enquiry.QuotationId);
    const deleteNo = enquiry.QuotationNo;

    setDeletePopup((prev) => ({ ...prev, loading: true }));

    try {
      const hotelId = localStorage.getItem("hotel_id") || "290";

      const url = `/banquetapi/delete_or_active_quot.php?hotel_id=${encodeURIComponent(
        hotelId
      )}&quot_id=${encodeURIComponent(deleteId)}&action=delete&cancel_reason=${encodeURIComponent(
        reason
      )}`;

      const res = await fetch(url, { method: "POST", cache: "no-store" });

      let result = null;
      try {
        result = await res.json();
      } catch {
        result = null;
      }

      if (!res.ok) {
        throw new Error(result?.message || "Delete failed");
      }

      showToast("success", `Enquiry ${deleteNo} deleted`, { id: "enq-delete-ok" });

      setEnquiries((prev) => prev.filter((e) => String(e.QuotationId) !== deleteId));

      closeDeletePopup();

      await fetchEnquiries();
    } catch (err) {
      console.error("Delete enquiry error:", err);
      showToast("error", "Failed to delete enquiry", { id: "enq-delete-failed" });
      setDeletePopup((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleEnquirySuccess = useCallback(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // SEARCH / FILTER
  const filteredEnquiries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return enquiries;

    return enquiries.filter((e) =>
      [e.QuotationNo, e.PartyName, e.Company, e.Function, e.FunctionFrom, e.FunctionTo]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [enquiries, searchTerm]);

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "F1") {
        event.preventDefault();
        handleNewEnquiry();
      }

      if (event.shiftKey && (event.key === "R" || event.key === "r")) {
        event.preventDefault();
        fetchEnquiries();
      }

      if (event.shiftKey && (event.key === "T" || event.key === "t")) {
        event.preventDefault();
        resetDatesToToday();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [fetchEnquiries, resetDatesToToday]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Enter" && deletePopup.isOpen) {
        event.preventDefault();
        handleDeleteConfirm();
      }

      if (event.key === "Escape" && deletePopup.isOpen) {
        event.preventDefault();
        closeDeletePopup();
      }
    };

    window.addEventListener("keyup", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [deletePopup, handleDeleteConfirm]);

  return (
    <>
      <div className="body-enquiry">
        {/* ENQUIRY DASHBOARD HEADER */}
        <div className="enquiry-dashboard-header">
          <div className="header-container">
            <div className="header-title-section">
              <div className="header-top-row">
                <FaBackward size={20} style={{ cursor: "pointer", color: "white" }} onClick={GoToBack} />
                <h1>Enquiry Dashboard</h1>
              </div>
              <p>Manage customer inquiries & track leads</p>
            </div>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-number">{enquiries.length}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
          </div>
        </div>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {/* Delete Confirmation Popup */}
          {deletePopup.isOpen && (
            <div className="delete-popup-overlay">
              <div className="delete-popup">
                <div className="popup-header">
                  <h3>Delete Enquiry</h3>
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
                    <MdDeleteOutline className="warning-icon" />
                    <p>You are about to delete enquiry <strong>#{deletePopup.enquiry?.QuotationNo}</strong> for <strong>{deletePopup.enquiry?.PartyName}</strong>.</p>
                  </div>

                  <div className="reason-input-group">
                    <label htmlFor="deleteReason">
                      Reason for deletion <span className="required">*</span>
                    </label>
                    <textarea
                      id="deleteReason"
                      placeholder="Please provide a reason for deletion (minimum 3 characters)..."
                      value={deletePopup.reason}
                      onChange={(e) => setDeletePopup(prev => ({ ...prev, reason: e.target.value }))}
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
                    disabled={deletePopup.reason.length < 3 || deletePopup.loading}
                  >
                    {deletePopup.loading ? (
                      <>
                        <FaSync className="spinning" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <MdDeleteOutline />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading overlay for enquiry details */}
          {loadingEnquiryDetails && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="spinner"></div>
                <p>Loading enquiry details...</p>
              </div>
            </div>
          )}

          <div className="dashboard-container">
            {/* Header Bar with Search and Actions */}
            <div className="dashboard-header-bar">
              <div className="header-left">
                <div className="search-box">
                  <MdOutlineSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search enquiries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    className="search-filter-btn mobile-filter-toggle"
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <MdOutlineFilterList />
                  </button>
                </div>
              </div>

              <div className="header-actions">
                <button
                  className="action-btn primary-btn"
                  onClick={handleNewEnquiry}
                  title="New Enquiry (F1)"
                  type="button"
                >
                  <IoIosAddCircleOutline /> ADD NEW

                </button>
                <button
                  className="action-btn today-btn"
                  onClick={resetDatesToToday}
                  title="Reset to today (Shift+T)"
                  type="button"
                >
                  Today

                </button>
                <button
                  className="action-btn refresh-btn"
                  onClick={fetchEnquiries}
                  disabled={loading}
                  title="Refresh (Shift+R)"
                  type="button"
                >
                  <FaSync className={loading ? "spinning" : ""} />Refresh
                  <span className="btn-text">{loading ? "..." : ""}</span>
                </button>

              </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
              {/* Left Column - Filters (Collapsible on mobile) */}
              <div className={`left-column ${showFilters ? 'show-mobile' : 'hide-mobile'}`}>
                <div className="filter-card">
                  <div className="card-header" onClick={() => setShowFilters(!showFilters)}>
                    <FaCalendarAlt className="card-icon" />
                    <h3>Date Range</h3>
                    <button className="collapse-btn">
                      {showFilters ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                  <div className="filter-content">
                    <div className="date-range-display">
                      <span className="date-label">Selected Range:</span>
                      <span className="date-value">
                        {fromDate.format("DD MMM YYYY")} - {toDate.format("DD MMM YYYY")}
                      </span>
                    </div>

                    <div className="date-pickers">
                      <div className="date-field">
                        <label>From Date</label>
                        <div className="date-input-wrapper">
                          <DatePicker
                            value={fromDate}
                            onChange={handleFromDateChange}
                            format="DD-MM-YYYY"
                            slotProps={{
                              textField: {
                                size: "small",
                                variant: "outlined",
                                fullWidth: true,
                                className: "custom-date-field",
                              },
                            }}
                          />
                        </div>
                      </div>

                      <div className="date-field">
                        <label>To Date</label>
                        <div className="date-input-wrapper">
                          <DatePicker
                            value={toDate}
                            onChange={handleToDateChange}
                            format="DD-MM-YYYY"
                            minDate={fromDate}
                            slotProps={{
                              textField: {
                                size: "small",
                                variant: "outlined",
                                fullWidth: true,
                                className: "custom-date-field",
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <button className="load-btn" onClick={fetchEnquiries} disabled={loading} type="button">
                      <MdDownload />
                      <span>{loading ? "Loading..." : "Load Enquiries"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Enquiries List */}
              <div className="right-column">
                <div className="enquiries-list-card">
                  <div className="card-header">
                    <h3>Enquiries List</h3>
                    <div className="list-info">
                      <span className="count-badge">
                        {filteredEnquiries.length} of {enquiries.length}
                      </span>
                      {searchTerm && <span className="search-indicator">"{searchTerm}"</span>}
                    </div>
                  </div>

                  {loading ? (
                    <div className="loading-state">
                      <div className="spinner-container">
                        <div className="spinner"></div>
                      </div>
                      <p>Loading enquiries...</p>
                    </div>
                  ) : filteredEnquiries.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-illustration">
                        <FaHistory />
                      </div>
                      <h4>No Enquiries Found</h4>
                      <p>Try adjusting your filters or search criteria</p>
                      <button className="create-btn" onClick={handleNewEnquiry} type="button">
                        <IoIosAddCircleOutline />
                        Create New Enquiry
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="enquiries-table-container desktop-only">
                        <div className="table-responsive">
                          <table className="enquiries-table">
                            <thead>
                              <tr>
                                <th>Reference</th>
                                <th>Party Name</th>
                                <th>Company</th>
                                <th>Function</th>
                                <th>Date Range</th>
                                <th className="actions-column">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredEnquiries.map((item) => (
                                <tr key={item.QuotationId}>
                                  <td>
                                    <div className="ref-cell">
                                      <span className="ref-number">#{item.QuotationNo || "N/A"}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="party-cell">
                                      <strong>{item.PartyName || "Not Specified"}</strong>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="company-cell">{item.Company || "-"}</span>
                                  </td>
                                  <td>
                                    <span className="function-badge">{item.Function || ""}</span>
                                  </td>
                                  <td>
                                    <div className="date-range-cell">
                                      <span>{item.FunctionFrom || "-"}</span>
                                      {item.FunctionTo && item.FunctionTo !== item.FunctionFrom && (
                                        <>
                                          <span className="date-separator">→</span>
                                          <span>{item.FunctionTo}</span>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    <div className="action-buttons-group">
                                      <button
                                        className="table-action-btn edit-btn"
                                        onClick={() => handleEditEnquiry(item)}
                                        title="Edit"
                                        type="button"
                                        disabled={loadingEnquiryDetails}
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        className="table-action-btn quote-btn"
                                        onClick={() => handleMakeQuotation(item)}
                                        title="Create Quotation"
                                        type="button"
                                      >
                                        <FaFileInvoice />
                                      </button>
                                      <button
                                        className="table-action-btn delete-btn"
                                        onClick={() => openDeletePopup(item)}
                                        title="Delete"
                                        type="button"
                                      >
                                        <MdDeleteOutline />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mobile Card View */}
                      <div className="mobile-cards-container mobile-only">
                        {filteredEnquiries.map((item) => (
                          <div className="enquiry-card" key={item.QuotationId}>
                            <div className="card-top-row">
                              <span className="ref-number">#{item.QuotationNo || "N/A"}</span>
                              <span className="function-badge">{item.Function || ""}</span>
                            </div>

                            <div className="card-main-info">
                              <h4 className="party-name">{item.PartyName || "Not Specified"}</h4>
                              {item.Company && <p className="company-name">{item.Company}</p>}
                            </div>

                            <div className="card-date-info">
                              <FaCalendarAlt className="date-icon" />
                              <span>
                                {item.FunctionFrom || "-"}
                                {item.FunctionTo && item.FunctionTo !== item.FunctionFrom && (
                                  <> → {item.FunctionTo}</>
                                )}
                              </span>
                            </div>

                            <div className="card-actions">
                              <button
                                className="card-action-btn edit-btn"
                                onClick={() => handleEditEnquiry(item)}
                                type="button"
                                disabled={loadingEnquiryDetails}
                              >
                                <FaEdit />
                                <span>Edit</span>
                              </button>
                              <button
                                className="card-action-btn quote-btn"
                                onClick={() => handleMakeQuotation(item)}
                                type="button"
                              >
                                <FaFileInvoice />
                                <span>Quote</span>
                              </button>
                              <button
                                className="card-action-btn delete-btn"
                                onClick={() => openDeletePopup(item)}
                                type="button"
                              >
                                <MdDeleteOutline />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dialog */}
          <NewEnquiryDialog
            open={showNewEnquiryDialog}
            onClose={() => setShowNewEnquiryDialog(false)}
            onSuccess={handleEnquirySuccess}
            editData={editingEnquiry}
          />

          <style>{`
            /* ========== BASE STYLES ========== */
            * {
              box-sizing: border-box;
            }

            .body-enquiry {
              min-height: 100vh;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 12px;
              padding-bottom: 40px;
            }

            .dashboard-container {
              max-width: 1200px;
              margin: 0 auto;
            }

            /* ========== LOADING OVERLAY ========== */
            .loading-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 10001;
            }

            .loading-content {
              background: white;
              padding: 30px 40px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }

            .loading-content .spinner {
              width: 40px;
              height: 40px;
              border: 3px solid #f3f3f3;
              border-top: 3px solid #6366f1;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 15px;
            }

            .loading-content p {
              margin: 0;
              color: #374151;
              font-weight: 500;
            }

            /* ========== DELETE POPUP STYLES ========== */
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
              padding: 16px;
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
              padding: 16px 20px;
              border-bottom: 1px solid #e2e8f0;
              background: #fef2f2;
            }

            .popup-header h3 {
              margin: 0;
              color: #dc2626;
              font-size: 16px;
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
              padding: 20px;
            }

            .warning-message {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              margin-bottom: 16px;
              padding: 12px;
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
              font-size: 14px;
            }

            .reason-input-group {
              margin-bottom: 8px;
            }

            .reason-input-group label {
              display: block;
              margin-bottom: 8px;
              font-weight: 500;
              color: #374151;
              font-size: 14px;
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
              padding: 16px 20px;
              border-top: 1px solid #e2e8f0;
              background: #f8fafc;
            }

            .btn-cancel {
              background: #6b7280;
              color: white;
              padding: 10px 16px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: all 0.3s ease;
              font-size: 14px;
            }

            .btn-cancel:hover:not(:disabled) {
              background: #4b5563;
            }

            .btn-delete-confirm {
              background: #dc2626;
              color: white;
              padding: 10px 16px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
            }

            .btn-delete-confirm:hover:not(:disabled) {
              background: #b91c1c;
            }

            .btn-delete-confirm:disabled {
              background: #fca5a5;
              cursor: not-allowed;
              transform: none;
            }

            .spinning {
              animation: spin 1s linear infinite;
            }

            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            /* ========== HEADER STYLES ========== */
            .enquiry-dashboard-header {
              background: linear-gradient(135deg, 
                rgba(80, 83, 241, 0.95) 0%, 
                rgba(155, 54, 249, 0.95) 50%, 
                rgba(237, 40, 139, 0.9) 100%);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 16px;
              padding: 16px;
              position: fixed !important;
              top: 12px;
              left: 12px;
              right: 12px;
              margin: 0px 4px 16px 4px;
              max-width: 1200px;
              box-shadow: 
                0 15px 30px rgba(99, 102, 241, 0.25),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset;
              position: relative;
              overflow: hidden;
              z-index: 10;
            }

            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              position: relative;
              z-index: 2;
              gap: 12px;
            }

            .header-title-section {
              display: flex;
              flex-direction: column;
              gap: 4px;
              flex: 1;
              min-width: 0;
            }

            .header-top-row {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .header-title-section h1 {
              font-size: 20px;
              font-weight: 800;
              color: #fff;
              margin: 0;
              text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
              white-space: nowrap;
            }

            .header-title-section p {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.9);
              margin: 0;
              font-weight: 500;
            }

            .header-stats {
              display: flex;
              gap: 12px;
              flex-shrink: 0;
            }

            .stat-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 8px 12px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 10px;
              border: 1px solid rgba(255, 255, 255, 0.3);
              min-width: 60px;
            }

            .stat-number {
              font-size: 18px;
              font-weight: 800;
              color: #fff;
            }

            .stat-label {
              font-size: 10px;
              color: rgba(255, 255, 255, 0.9);
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .enquiry-dashboard-header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: radial-gradient(
                circle at 30% 50%,
                rgba(255, 255, 255, 0.3) 0%,
                transparent 50%
              );
              z-index: 1;
            }

            /* ========== HEADER BAR ========== */
            .dashboard-header-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              padding: 12px 16px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              border: 1px solid #e2e8f0;
              margin-bottom: 16px;
              flex-wrap: wrap;
              margin-top: 100px;
            
            }

            .header-left {
              flex: 1;
              min-width: 200px;
            }

            .search-box {
              display: flex;
              align-items: center;
              flex: 1;
              background: #f8fafc;
              border-radius: 10px;
              padding: 0 12px;
              border: 1px solid #e2e8f0;
              transition: all 0.3s ease;
            }

            .search-box:focus-within {
              border-color: #6366f1;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
              background: white;
            }

            .search-box input {
              flex: 1;
              width: 100%;
              padding: 10px 12px;
              border: none;
              background: transparent;
              font-size: 14px;
              color: #334155;
              font-family: 'Inter', sans-serif;
            }

            .search-box input:focus {
              outline: none;
            }

            .search-icon {
              color: #94a3b8;
              font-size: 18px;
              flex-shrink: 0;
            }

            .search-filter-btn {
              background: none;
              border: none;
              color: #94a3b8;
              cursor: pointer;
              padding: 8px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
            }

            .search-filter-btn:hover {
              background: #e2e8f0;
              color: #6366f1;
            }

            .header-actions {
              display: flex;
              gap: 8px;
              align-items: center;
              flex-wrap: wrap;
            }

            .action-btn {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              border: none;
              font-family: 'Inter', sans-serif;
              white-space: nowrap;
            }

            .today-btn {
              background: #f1f5f9;
              color: #475569;
              border: 1px solid #e2e8f0;
            }

            .today-btn:hover {
              background: #e2e8f0;
              transform: translateY(-1px);
            }

            .refresh-btn {
              background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
              color: white;
            }

            .refresh-btn:hover:not(:disabled) {
              background: linear-gradient(135deg, #0d6561 0%, #0d9488 100%);
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
            }

            .primary-btn {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
            }

            .primary-btn:hover {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              transform: translateY(-1px);
              box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
            }

            /* ========== GRID LAYOUT ========== */
            .dashboard-grid {
              display: grid;
              grid-template-columns: 320px 1fr;
              gap: 16px;
            }

            .left-column {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .right-column {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }

            /* ========== FILTER CARD ========== */
            .filter-card, .enquiries-list-card {
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              border: 1px solid #e2e8f0;
              overflow: hidden;
            }

            .card-header {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 12px 16px;
              border-bottom: 1px solid #f1f5f9;
            }

            .card-header h3 {
              font-size: 16px;
              font-weight: 700;
              color: #556d9aff;
              margin: 0;
              flex: 1;
            }

            .card-icon {
              color: #6366f1;
              font-size: 18px;
            }

            .collapse-btn {
              display: none;
              background: none;
              border: none;
              color: #94a3b8;
              cursor: pointer;
              padding: 4px;
            }

            .filter-content {
              padding: 16px;
              
            }

            .date-range-display {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              padding: 12px 14px;
              border-radius: 10px;
              margin-bottom: 16px;
              display: flex;
              flex-direction: column;
              gap: 4px;
              
            }

            .date-label {
              font-size: 11px;
              opacity: 0.9;
            }

            .date-value {
              font-size: 13px;
              font-weight: 600;
            }

            .date-pickers {
              display: flex;
              flex-direction: column;
              gap: 12px;
              margin-bottom: 16px;
            }

            .date-field {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }

            .date-field label {
              font-size: 13px;
              font-weight: 600;
              color: #475569;
            }

            .custom-date-field .MuiOutlinedInput-root {
              border-radius: 8px;
              background: #f8fafc;
            }

            .load-btn {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              width: 100%;
              padding: 10px;
              background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            }

            .load-btn:hover:not(:disabled) {
              background: linear-gradient(135deg, #0d6561 0%, #0d9488 100%);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
            }

            /* ========== LIST INFO ========== */
            .list-info {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;
            }

            .count-badge {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              padding: 4px 10px;
              border-radius: 16px;
              font-size: 11px;
              font-weight: 600;
            }

            .search-indicator {
              background: #e0f2fe;
              color: #0369a1;
              padding: 4px 10px;
              border-radius: 16px;
              font-size: 11px;
              font-weight: 500;
              max-width: 120px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            /* ========== LOADING & EMPTY STATES ========== */
            .loading-state, .empty-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 60px 20px;
              text-align: center;
            }

            .spinner-container {
              width: 50px;
              height: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 16px;
            }

            .spinner {
              width: 36px;
              height: 36px;
              border: 3px solid #f1f5f9;
              border-top-color: #6366f1;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }

            .empty-illustration {
              width: 70px;
              height: 70px;
              background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 20px;
              color: #94a3b8;
              font-size: 28px;
            }

            .empty-state h4 {
              margin: 0 0 8px;
              color: #334155;
              font-size: 16px;
            }

            .empty-state p {
              margin: 0 0 20px;
              color: #64748b;
              font-size: 14px;
            }

            .create-btn {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 20px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            }

            .create-btn:hover {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }

            /* ========== TABLE STYLES ========== */
            .enquiries-table-container {
              padding: 8px;
            }

            .table-responsive {
              overflow-x: auto;
              border-radius: 10px;
              border: 1px solid #f1f5f9;
            }

            .enquiries-table {
              width: 100%;
              border-collapse: collapse;
              min-width: 700px;
            }

            .enquiries-table thead {
              background: #f8fafc;
            }

            .enquiries-table th {
              padding: 12px 14px;
              text-align: left;
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #e2e8f0;
            }

            .enquiries-table td {
              padding: 12px 14px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 13px;
              color: #334155;
            }

            .enquiries-table tbody tr:hover {
              background: #f8fafc;
            }

            .ref-number {
              background: #f1f5f9;
              color: #475569;
              padding: 4px 10px;
              border-radius: 16px;
              font-weight: 600;
              font-size: 11px;
              display: inline-block;
            }

            .company-cell {
              color: #64748b;
              font-size: 12px;
            }

            .function-badge {
              background: #f0f9ff;
              color: #0369a1;
              padding: 4px 10px;
              border-radius: 16px;
              font-size: 11px;
              font-weight: 500;
              white-space: nowrap;
            }

            .date-range-cell {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              color: #64748b;
            }

            .date-separator {
              color: #94a3b8;
            }

            .actions-column {
              width: 150px;
            }

            .action-buttons-group {
              display: flex;
              gap: 6px;
            }

            .table-action-btn {
              width: 32px;
              height: 32px;
              border-radius: 8px;
              border: none;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              font-size: 14px;
              color: white;
            }

            .table-action-btn:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            .table-action-btn:not(:disabled):hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .edit-btn {
              background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            }

            .quote-btn {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            }

            .delete-btn {
              background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
            }

            /* ========== MOBILE CARD STYLES ========== */
            .mobile-cards-container {
              padding: 12px;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .enquiry-card {
              background: #fff;
              border-radius: 12px;
              padding: 14px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }

            .card-top-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }

            .card-main-info {
              margin-bottom: 10px;
            }

            .card-main-info .party-name {
              margin: 0 0 4px;
              font-size: 15px;
              font-weight: 600;
              color: #1e293b;
            }

            .card-main-info .company-name {
              margin: 0;
              font-size: 13px;
              color: #64748b;
            }

            .card-date-info {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 12px;
              background: #f8fafc;
              border-radius: 8px;
              margin-bottom: 12px;
              font-size: 13px;
              color: #475569;
            }

            .card-date-info .date-icon {
              color: #6366f1;
              font-size: 14px;
            }

            .card-actions {
              display: flex;
              gap: 8px;
            }

            .card-action-btn {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              padding: 10px 8px;
              border-radius: 8px;
              border: none;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              color: white;
              transition: all 0.2s ease;
            }

            .card-action-btn:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            .card-action-btn:not(:disabled):active {
              transform: scale(0.98);
            }

            .card-action-btn.edit-btn {
              background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            }

            .card-action-btn.quote-btn {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            }

            .card-action-btn.delete-btn {
              background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
            }

            /* ========== VISIBILITY HELPERS ========== */
            .desktop-only {
              display: block;
            }

            .mobile-only {
              display: none;
            }

            .mobile-filter-toggle {
              display: none;
            }

            /* ========== RESPONSIVE BREAKPOINTS ========== */
            
            /* Tablet */
            @media (max-width: 1024px) {
              .dashboard-grid {
                grid-template-columns: 280px 1fr;
              }

              .header-title-section h1 {
                font-size: 18px;
              }

              .action-btn {
                padding: 8px 10px;
                font-size: 12px;
              }
            }

            /* Small Tablet / Large Mobile */
            @media (max-width: 900px) {
              .dashboard-grid {
                grid-template-columns: 1fr;
              }

              .left-column {
                order: 2;
              }

              .right-column {
                order: 1;
              }

              .left-column.hide-mobile {
                display: none;
              }

              .left-column.show-mobile {
                display: flex;
              }

              .mobile-filter-toggle {
                display: flex;
              }

              .collapse-btn {
                display: block;
              }

              .filter-card .card-header {
                cursor: pointer;
              }
            }

            /* Mobile */
            @media (max-width: 768px) {
              .body-enquiry {
                padding: 8px;
              }

              .enquiry-dashboard-header {
                margin: 0 0 12px 0;
                padding: 12px;
                border-radius: 12px;
              }

              .header-container {
                flex-direction: row;
                align-items: center;
              }

              .header-title-section h1 {
                font-size: 16px;
              }

              .header-title-section p {
                display: none;
              }

              .stat-item {
                padding: 6px 10px;
                min-width: 50px;
              }

              .stat-number {
                font-size: 16px;
              }

              .stat-label {
                font-size: 9px;
              }

              .dashboard-header-bar {
                padding: 10px 12px;
                gap: 10px;
              }

              .header-left {
                width: 100%;
                min-width: unset;
              }

              .header-actions {
                width: 100%;
                justify-content: space-between;
              }

              .action-btn {
                flex: 1;
                justify-content: center;
                padding: 10px 8px;
              }

              .btn-text {
                display: none;
              }

              .action-btn svg {
                font-size: 18px;
              }

              .desktop-only {
                display: none !important;
              }

              .mobile-only {
                display: block !important;
              }

              .enquiries-list-card .card-header {
                flex-wrap: wrap;
                gap: 8px;
              }

              .enquiries-list-card .card-header h3 {
                font-size: 14px;
              }

              .list-info {
                width: 100%;
              }

              .date-pickers {
                flex-direction: row;
                gap: 8px;
              }

              .date-field {
                flex: 1;
              }

              .date-field label {
                font-size: 12px;
              }
            }

            /* Small Mobile */
            @media (max-width: 480px) {
              .header-top-row {
                gap: 8px;
              }

              .header-title-section h1 {
                font-size: 14px;
              }

              .search-box {
                padding: 0 8px;
              }

              .search-box input {
                padding: 8px;
                font-size: 13px;
              }

              .action-btn {
                padding: 8px 6px;
              }

              .enquiry-card {
                padding: 12px;
              }

              .card-action-btn {
                padding: 8px 6px;
                font-size: 11px;
              }

              .card-action-btn span {
                display: none;
              }

              .card-action-btn {
                flex: unset;
                width: 40px;
                height: 40px;
                border-radius: 10px;
              }

              .card-actions {
                justify-content: flex-end;
              }

              .delete-popup {
                margin: 8px;
                max-width: calc(100% - 16px);
              }

              .popup-header {
                padding: 12px 16px;
              }

              .popup-content {
                padding: 16px;
              }

              .popup-actions {
                padding: 12px 16px;
                flex-direction: column;
              }

              .popup-actions button {
                width: 100%;
              }

              .date-pickers {
                flex-direction: column;
              }
            }

            /* Extra Small Mobile */
            @media (max-width: 360px) {
              .header-stats {
                display: none;
              }

              .enquiry-dashboard-header {
                padding: 10px;
              }

              .filter-content {
                padding: 12px;
              }

              .date-range-display {
                padding: 10px 12px;
              }
            }

            /* Landscape Phone */
            @media (max-height: 500px) and (orientation: landscape) {
              .delete-popup {
                max-height: 95vh;
              }

              .popup-content {
                padding: 12px;
              }

              .reason-textarea {
                rows: 2;
              }

              .loading-state, .empty-state {
                padding: 30px 20px;
              }
            }

            /* Touch Device Optimizations */
            @media (hover: none) and (pointer: coarse) {
              .table-action-btn,
              .card-action-btn,
              .action-btn,
              .load-btn,
              .create-btn {
                min-height: 44px;
              }

              .search-box input {
                min-height: 44px;
              }
            }
          `}</style>
        </LocalizationProvider>
      </div>
    </>
  );
}

export default EnquiryDashBoard;