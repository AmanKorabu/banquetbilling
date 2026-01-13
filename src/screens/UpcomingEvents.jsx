import React, { useState, useEffect, useCallback } from "react";
import Header from './Header';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/en-in";
import {
  MdSync,
  MdOutlineClose,
} from "react-icons/md";
import {
  FaCalendarAlt,
  FaHistory,
  FaRupeeSign,
  FaCheckCircle,
  FaQuestionCircle,
  FaBuilding,
  FaUserFriends,
  FaFilter
} from "react-icons/fa";
import { VscArrowLeft } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import useEscapeNavigate from "../hooks/EscapeNavigate";
import { toast } from "react-toastify";

function UpcomingEvents() {
  // STATE
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  useEscapeNavigate('/dashboard');

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    waitlisted: 0,
    tentative: 0,
    revenue: 0,
    guests: 0
  });

  // Function-wise statistics
  const [functionStats, setFunctionStats] = useState({
    marriage: { count: 0, revenue: 0 },
    birthday: { count: 0, revenue: 0 },
    corporate: { count: 0, revenue: 0 },
    conference: { count: 0, revenue: 0 },
    private: { count: 0, revenue: 0 },
    other: { count: 0, revenue: 0 }
  });

  // Indian Currency Formatter
  const formatIndianCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };


  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    return dayjs(dateString, "DD-MM-YYYY").format("DD MMM");
  };

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const hotelId = localStorage.getItem("hotel_id") || "290";
      const apiUrl = `/banquetapi/get_quot_list15_days.php?hotel_id=${hotelId}`;

     

      const response = await fetch(apiUrl);
      const data = await response.json();



      if (data && data.result && Array.isArray(data.result)) {
        const transformedEvents = data.result.map((event, index) => {
          const eventDate = event.QuotationDate;
          const functionName = event.FunctionName?.toUpperCase() || "";

          // Map API function names to your categories
          let eventType = "other";
          if (functionName.includes("MARRIAGE")) eventType = "marriage";
          else if (functionName.includes("BIRTHDAY")) eventType = "birthday";
          else if (functionName.includes("ENGAGEMENT")) eventType = "engagement";
          else if (functionName.includes("ANNIVERSARY")) eventType = "anniversary";
          else if (functionName.includes("CORPORATE") || functionName.includes("MEET")) eventType = "corporate";
          else if (functionName.includes("PARTY")) eventType = "party";
          else if (functionName === "") eventType = "other";

          return {
            id: event.QuotationId || index + 1,
            quotationId: event.QuotationId || "",
            eventNumber: event.QuotationNo || "",
            eventName: event.FunctionName || "Event",
            originalFunctionName: functionName, // Keep original for display
            client: event.PartyName || "N/A",
            contactPerson: event.PartyName || "N/A",
            company: event.BillingCompany || "N/A",
            eventDate: eventDate,
            startTime: "19:00",
            endTime: "23:00",
            venue: "Banquet Hall",
            eventType: eventType,
            status: event.Status?.toLowerCase() || "confirmed",
            guests: parseInt(event.GuestCount) || 100,
            expectedRevenue: parseFloat(event.BillAmount) || 0,
            depositPaid: parseFloat(event.ReceivedAmount) || 0,
            discount: parseFloat(event.Discount) || 0,
            tds: parseFloat(event.TDS) || 0,
            planner: "Admin",
            notes: ""
          };
        });

        setEvents(transformedEvents);
       

        // Calculate stats
        const total = transformedEvents.length;
        const confirmed = transformedEvents.filter(e => e.status === "confirmed").length;
        const waitlisted = transformedEvents.filter(e => e.status === "waitlisted").length;
        const revenue = transformedEvents.reduce((sum, e) => sum + e.expectedRevenue, 0);
        const guests = transformedEvents.reduce((sum, e) => sum + e.guests, 0);

        // Initialize function stats with all possible categories
        const functionStatsCalc = {
          marriage: { count: 0, revenue: 0, originalName: "MARRIAGE" },
          birthday: { count: 0, revenue: 0, originalName: "BIRTHDAY" },
          engagement: { count: 0, revenue: 0, originalName: "ENGAGEMENT" },
          anniversary: { count: 0, revenue: 0, originalName: "ANNIVERSARY" },
          corporate: { count: 0, revenue: 0, originalName: "CORPORATE MEET" },
          party: { count: 0, revenue: 0, originalName: "MINI PARTY" },
          other: { count: 0, revenue: 0, originalName: "OTHER" }
        };

        // Calculate function-wise statistics
        transformedEvents.forEach(event => {
          const type = event.eventType;
          if (functionStatsCalc[type]) {
            functionStatsCalc[type].count++;
            functionStatsCalc[type].revenue += event.expectedRevenue;
          }
        });

        setStats({
          total,
          confirmed,
          waitlisted,
          tentative: 0,
          revenue,
          guests
        });

        setFunctionStats(functionStatsCalc);

        toast.success(`Loaded ${total} upcoming events`, { toastId: "events-loaded" });
      } else {
        console.warn("⚠️ Unexpected API response format:", data);
        setEvents([]);
        toast.info("No upcoming events found", { toastId: "info-events" });
      }
    } catch (error) {
      console.error("❌ Error fetching events:", error);
      toast.error("Failed to load events", { toastId: "failed-events" });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...events];

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(event => event.status === selectedFilter);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.eventName.toLowerCase().includes(term) ||
        event.client.toLowerCase().includes(term) ||
        event.eventNumber.toLowerCase().includes(term) ||
        event.company.toLowerCase().includes(term)
      );
    }

    setFilteredEvents(filtered);
  }, [events, selectedFilter, searchTerm]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Event handlers

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return "#10b981";
      case "waitlisted": return "#f59e0b";
      case "tentative": return "#8b5cf6";
      default: return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return <FaCheckCircle />;
      case "waitlisted": return <FaQuestionCircle />;
      default: return null;
    }
  };

  const getFunctionIcon = (functionType) => {
    switch (functionType) {
      case "marriage": return "💍";
      case "birthday": return "🎂";
      case "engagement": return "💍";
      case "anniversary": return "🥂";
      case "corporate": return "🏢";
      case "party": return "🎉";
      default: return "📅";
    }
  };

const getFunctionColor = (functionType) => {
  switch (functionType) {
    case "marriage": return "rgba(195, 4, 100, 0.85)"; // Darker pink with transparency
    case "birthday": return "rgba(241, 249, 19, 0.85)"; // Amber with transparency
    case "engagement": return "rgba(182, 155, 245, 0.85)"; // Violet with transparency
    case "anniversary": return "rgba(0, 75, 195, 0.85)"; // Blue with transparency
    case "corporate": return "rgba(15, 255, 175, 0.85)"; // Emerald with transparency
    case "party": return "rgba(169, 45, 10, 0.85)"; // Red with transparency
    default: return "rgba(107, 114, 128, 0.85)"; // Gray with transparency
  }
};

  // Helper function to format function name for display
  const formatFunctionName = (functionType) => {
    switch (functionType) {
      case "marriage": return "MARRIAGE";
      case "birthday": return "BIRTHDAY";
      case "engagement": return "ENGAGEMENT";
      case "anniversary": return "ANNIVERSARY";
      case "corporate": return "CORPORATE";
      case "party": return "PARTY";
      default: return "OTHER";
    }
  };



  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <>
      <Header />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-in">
        <div className="upcoming-events-page">

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
              <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-menu-header">
                  <h3>Filters</h3>
                  <button className="close-menu" onClick={() => setMobileMenuOpen(false)}>
                    <MdOutlineClose />
                  </button>
                </div>
                <div className="mobile-menu-body">
                  <div className="mobile-filter-section">
                    <h4>Status</h4>
                    <div className="status-filters-mobile">
                      <button
                        className={`status-filter-btn ${selectedFilter === "all" ? "active" : ""}`}
                        onClick={() => setSelectedFilter("all")}
                      >
                        All ({stats.total})
                      </button>
                      <button
                        className={`status-filter-btn confirmed ${selectedFilter === "confirmed" ? "active" : ""}`}
                        onClick={() => setSelectedFilter("confirmed")}
                      >
                        Confirmed ({stats.confirmed})
                      </button>
                      <button
                        className={`status-filter-btn waitlisted ${selectedFilter === "waitlisted" ? "active" : ""}`}
                        onClick={() => setSelectedFilter("waitlisted")}
                      >
                        Waitlisted ({stats.waitlisted})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="container">

            {/* Page Header */}
            <div className="page-header">
              <div className="header-content">
                <div className="header-main">
                  <div className="header-title">
                    <button className="btn btn-back" onClick={handleBackToDashboard}>
                      <VscArrowLeft size={24} />
                    </button>

                  </div>
                  {/* Function-wise Statistics Cards */}
                </div>
              </div>
              <div className="function-stats-grid">
                {Object.entries(functionStats).map(([functionType, data]) => (
                  data.count > 0 && (
                    <div
                      key={functionType}
                      className="function-stat-card"
                      style={{
                        borderLeftColor: getFunctionColor(functionType),
                        borderLeftWidth: '4px'
                      }}
                    >
                      <div className="function-stat-header">
                        <span className="function-icon">{getFunctionIcon(functionType)}</span>
                        <span className="function-name">{formatFunctionName(functionType)}</span>
                      </div>
                      <div className="function-stat-body">
                        <div className="function-stat-count">
                          <span className="count">{data.count}</span>
                          <span className="label">Events</span>
                        </div>
                        {/* <div className="function-stat-revenue">
                        <span className="revenue">{formatIndianCurrency(data.revenue)}</span>
                        <span className="label">Revenue</span>
                      </div> */}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>



            {/* Financial Overview Bar */}
            {/* <div className="financial-overview-bar">
              <div className="financial-overview-content">
                <div className="financial-item">
                  <span className="financial-label">Total Revenue:</span>
                  <span className="financial-value">
                    {formatIndianCurrency(stats.revenue)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Total Events:</span>
                  <span className="financial-value">
                    {formatNumber(stats.total)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Confirmed:</span>
                  <span className="financial-value confirmed">
                    {formatNumber(stats.confirmed)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Waitlisted:</span>
                  <span className="financial-value waitlisted">
                    {formatNumber(stats.waitlisted)}
                  </span>
                </div>
              </div>
            </div> */}

            {/* Search and Filter Bar */}
            <div className="search-filter-bar">
              <div className="filter-container">
                <div className="filter-main">
                  <div className="search-filters">
                    <div className="search-box">
                      {/* <MdSearch className="search-icon2" /> */}
                      <input
                        type="text"
                        placeholder="Search events by party name, event name, quotation no..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                      {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm("")}>
                          <MdOutlineClose />
                        </button>
                      )}
                    </div>

                    <div className="filter-buttons">


                      <button
                        className="btn btn-secondary "
                        onClick={() => setMobileMenuOpen(true)}
                      >
                        <FaFilter />
                      </button>

                      <button
                        className="btn btn-refresh desktop"
                        onClick={fetchEvents}
                        disabled={loading}
                      >
                        <MdSync className={loading ? "spinning" : ""} />
                        <span className="btn-text">Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop Filters */}
                  {showFilters && (
                    <div className="desktop-filters">
                      <div className="filters-grid">
                        <div className="filter-group">
                          <label>Status</label>
                          <div className="status-filters">
                            <button
                              className={`status-btn ${selectedFilter === "all" ? "active" : ""}`}
                              onClick={() => setSelectedFilter("all")}
                            >
                              All ({stats.total})
                            </button>
                            <button
                              className={`status-btn confirmed ${selectedFilter === "confirmed" ? "active" : ""}`}
                              onClick={() => setSelectedFilter("confirmed")}
                            >
                              Confirmed ({stats.confirmed})
                            </button>
                            <button
                              className={`status-btn waitlisted ${selectedFilter === "waitlisted" ? "active" : ""}`}
                              onClick={() => setSelectedFilter("waitlisted")}
                            >
                              Waitlisted ({stats.waitlisted})
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className="events-list">
              <div className="list-header">
                <h3>
                  Upcoming Events (Next 15 Days)
                  <span className="event-count"> ({filteredEvents.length})</span>
                </h3>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading events...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FaHistory />
                  </div>
                  <h4>No Events Found</h4>
                  <p>Try adjusting your search or filters</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="btn btn-primary"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile View - Cards */}
                  <div className="events-cards-mobile">
                    {filteredEvents.map(event => (
                      <div key={event.id} className="event-card-mobile">
                        <div className="card-header-mobile">
                          <div className="event-date">
                            <FaCalendarAlt />
                            <span>{formatDate(event.eventDate)}</span>
                          </div>
                          <div className="event-status" style={{ color: getStatusColor(event.status) }}>
                            {getStatusIcon(event.status)}
                            <span>{event.status || "Confirmed"}</span>
                          </div>
                        </div>

                        <div className="card-body-mobile">
                          <h4 className="event-title">{event.eventName}</h4>
                          <div className="event-meta">
                            <div className="meta-item">
                              <FaUserFriends />
                              <span>{event.client}</span>
                            </div>
                            <div className="meta-item">
                              <FaBuilding />
                              <span>{event.company}</span>
                            </div>
                          </div>

                          <div className="event-details-mobile">
                            <div className="detail-item">
                              <span className="detail-label">Quotation:</span>
                              <span className="detail-value">#{event.eventNumber}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Event Type:</span>
                              <span className="detail-value" style={{ color: getFunctionColor(event.eventType) }}>
                                {formatFunctionName(event.eventType)}
                              </span>
                            </div>
                          </div>

                          <div className="financial-info-mobile">
                            <div className="financial-item">
                              <span className="financial-label">Bill Amount:</span>
                              <span className="financial-value amount">
                                {formatIndianCurrency(event.expectedRevenue)}
                              </span>
                            </div>
                            <div className="financial-item">
                              <span className="financial-label">Received:</span>
                              <span className="financial-value received">
                                {formatIndianCurrency(event.depositPaid)}
                              </span>
                            </div>
                            <div className="financial-item">
                              <span className="financial-label">Balance:</span>
                              <span className={`financial-value ${(event.expectedRevenue - event.depositPaid) > 0 ? "balance-pending" : "balance-paid"}`}>
                                {formatIndianCurrency(event.expectedRevenue - event.depositPaid)}
                              </span>
                            </div>
                          </div>
                        </div>


                      </div>
                    ))}
                  </div>

                  {/* Tablet/Desktop View - Table */}
                  <div className="events-table-container">
                    <table className="events-table">
                      <thead>
                        <tr>
                          <th className="date">Date</th>
                          <th className="event">Event</th>
                          <th className="client">Client</th>
                          <th className="company">Company</th>
                          <th className="type">Type</th>
                          <th className="bill-amount">Bill Amount</th>
                          <th className="received">Received</th>
                          <th className="balance">Balance</th>
                          <th className="status">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvents.map(event => (
                          <tr key={event.id} className="event-row">
                            <td className="date">
                              <div className="date-cell">
                                <FaCalendarAlt />
                                <span>{formatDate(event.eventDate)}</span>
                              </div>
                            </td>
                            <td className="event">
                              <div className="event-cell">
                                <strong>{event.eventName}</strong>
                                <small>Quotation: {event.eventNumber}</small>
                              </div>
                            </td>
                            <td className="client">
                              <div className="client-cell">
                                <FaUserFriends />
                                <span>{event.client}</span>
                              </div>
                            </td>
                            <td className="company">
                              <div className="company-cell">
                                <FaBuilding />
                                <span>{event.company}</span>
                              </div>
                            </td>
                            <td className="type">
                              <span
                                className="type-badge"
                                style={{
                                  backgroundColor: getFunctionColor(event.eventType) + '20',
                                  color: getFunctionColor(event.eventType)
                                }}
                              >
                                {getFunctionIcon(event.eventType)} {formatFunctionName(event.eventType)}
                              </span>
                            </td>
                            <td className="bill-amount">
                              <div className="amount-cell">
                                <FaRupeeSign size={10} />
                                <strong>{formatIndianCurrency(event.expectedRevenue)}</strong>
                              </div>
                            </td>
                            <td className="received">
                              <div className="received-cell">
                                <FaRupeeSign size={10} />
                                <span className="received-amount">
                                  {formatIndianCurrency(event.depositPaid)}
                                </span>
                              </div>
                            </td>
                            <td className="balance">
                              <div className={`balance-cell ${(event.expectedRevenue - event.depositPaid) > 0 ? "pending" : "paid"}`}>
                                <FaRupeeSign size={10} />
                                <span>{formatIndianCurrency(event.expectedRevenue - event.depositPaid)}</span>
                              </div>
                            </td>
                            <td className="status">
                              <span
                                className="status-badge"
                                style={{
                                  backgroundColor: getStatusColor(event.status) + '20',
                                  color: getStatusColor(event.status)
                                }}
                              >
                                {getStatusIcon(event.status)}
                                <span>{event.status || "Confirmed"}</span>
                              </span>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Summary Section */}
            <div className="list-summary">
              <p>
                Showing <strong>{filteredEvents.length}</strong> of{" "}
                <strong>{events.length}</strong> events
                {selectedFilter !== "all" && ` • Filtered by: ${selectedFilter}`}
                {searchTerm && ` • Search: "${searchTerm}"`}
                <span className="financial-totals">
                  • Total Revenue: {formatIndianCurrency(stats.revenue)}
                  • Total Events: {stats.total}
                </span>
              </p>
            </div>

            {/* CSS Styles */}
            <style jsx>{`
              .upcoming-events-page {
                min-height: 100vh;
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              }

              .container {
                padding: 1px;
                max-width: 1400px;
                margin: 0 auto;
              }

              /* Page Header */
              .page-header {
                background: white;
                border-radius: 12px;
                padding: 5px;
                margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
              }

              .header-content {
                display: flex;
                flex-direction: column;
                gap: 16px;
              }

              .header-main {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 16px;
              }

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

              .header-title h1 {
                font-size: 24px;
                font-weight: 700;
                color: #1e293b;
                margin: 0 0 4px 0;
              }

              .header-title p {
                font-size: 14px;
                color: #64748b;
                margin: 0;
              }

              .header-stats {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
              }

              .stat-card {
                background: #f8fafc;
                border-radius: 8px;
                padding: 16px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                border-left: 4px solid #d1d5db;
              }

              .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              }

              .stat-card.active {
                background: white;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
              }

              .stat-card.total {
                border-left-color: #6366f1;
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

              .stat-card.revenue {
                border-left-color: #8b5cf6;
              }
              .stat-card.revenue.active {
                background: #27006aff;
                color: white;
              }

              .stat-number {
                font-size: 20px;
                font-weight: 700;
                display: block;
                margin-bottom: 4px;
              }

              .stat-label {
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #6b7280;
              }

              .stat-card.active .stat-label {
                color: rgba(255, 255, 255, 0.9);
              }

              /* Function-wise Statistics */
              .function-stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-bottom: 2px;
                
              }

              .function-stat-card {
                background: white;
                border-radius: 8px;
                padding: 5px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
                border-left-width: 4px;
              }

              .function-stat-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
              }

              .function-icon {
                font-size: 20px;
              }

              .function-name {
                font-size: 12px;
                font-weight: 600;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .function-stat-body {
                // display: flex;
                justify-content: space-between;
                align-items: center;
              }

              .function-stat-count,
              .function-stat-revenue {
                display: flex;
                flex-direction: column;
                align-items: center;
              }

              .count,
              .revenue {
                font-size: 18px;
                font-weight: 700;
                color: #1f2937;
              }

              .function-stat-body .label {
                font-size: 11px;
                color: #6b7280;
                margin-top: 2px;
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

              .financial-value.confirmed { color: #10b981; }
              .financial-value.waitlisted { color: #f59e0b; }

              /* Search and Filter Bar */
              .search-filter-bar {
                background: white;
                border-radius: 12px;
                padding: 10px;
                margin-bottom: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                border: 1px solid #e2e8f0;
              }

              .filter-main {
                display: flex;
                flex-direction: column;
                gap: 16px;
              }

              .search-filters {
                display: flex;
                gap: 12px;
                align-items: center;
                flex-wrap: wrap;
              }

              .search-box {
                flex: 1;
                min-width: 100%;
                position: relative;
              }

           

              .search-input {
                width: auto;
                padding: 10px 40px 10px 40px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-size: 14px;
                background: white;
                color: #334155;
              }

              .search-input:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
              }

              .clear-search {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
              }

              .filter-buttons {
                display: flex;
                gap: 8px;
              }

              .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                white-space: nowrap;
              }

              .btn-primary {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
              }

              .btn-primary:hover {
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
              }

              .btn-secondary {
                background: #f1f5f9;
                color: #475569;
                border: 1px solid #e2e8f0;
              }

              .btn-secondary:hover {
                background: #e2e8f0;
              }

              .btn-refresh {
                background: #847239;
                color: white;
              }

              .btn-refresh:hover:not(:disabled) {
                background: #756035;
              }

              .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
              }

              .mobile-menu-btn {
                display: none;
              }

              .btn-text {
                display: inline;
              }

              .desktop-filters {
                padding-top: 16px;
                border-top: 1px solid #e2e8f0;
              }

              .filters-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
              }

              .filter-group label {
                display: block;
                font-size: 12px;
                font-weight: 500;
                color: #374151;
                margin-bottom: 8px;
              }

              .status-filters {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
              }

              .status-btn {
                padding: 8px 12px;
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                font-size: 12px;
                color: #475569;
                cursor: pointer;
                transition: all 0.2s ease;
              }

              .status-btn.active {
                background: #e0e7ff;
                color: #4f46e5;
                border-color: #c7d2fe;
              }

              .status-btn.confirmed.active {
                background: #d1fae5;
                color: #065f46;
                border-color: #a7f3d0;
              }

              .status-btn.waitlisted.active {
                background: #fef3c7;
                color: #92400e;
                border-color: #fde68a;
              }

              /* Events List */
              .events-list {
                background: white;
                border-radius: 12px;
                padding: 20px;
                border: 1px solid #e2e8f0;
                margin-bottom: 16px;
              }

              .list-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
              }

              .list-header h3 {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0;
              }

              .event-count {
                color: #64748b;
                font-weight: 500;
              }

              /* Mobile Cards View */
              .events-cards-mobile {
                display: grid;
                grid-template-columns: 2fr;
                gap: 12px;
              }

              .event-card-mobile {
                background: #f8fafc;
                border-radius: 12px;
                padding: 16px;
                border: 1px solid #e2e8f0;
              }

              .card-header-mobile {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
              }

              .event-date {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 600;
                color: #475569;
              }

              .event-status {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                font-weight: 600;
              }

              .card-body-mobile .event-title {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 8px 0;
              }

              .event-meta {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-bottom: 12px;
              }

              .meta-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: #475569;
              }

              .event-details-mobile {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                margin-bottom: 12px;
                background:  linear-gradient(135deg, 
                rgba(178, 175, 220, 0.95) 0%, 
                rgba(147, 123, 166, 0.95) 50%, 
                rgba(235, 129, 182, 0.9) 100%);
                border-radius:5px;        
      }

              .detail-item {
                display: flex;
                flex-direction: column;
                gap: 2px;
              }

              .detail-label {
                font-size: 11px;
                color: #ffffffff;
              }

              .detail-value {
                font-size: 13px;
                font-weight: 600;
                color: #f6f6f6ff;
              }

              .financial-info-mobile {
                background: white;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 12px;
              }

              .financial-info-mobile .financial-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
              }

              .financial-info-mobile .financial-label {
                font-size: 12px;
                color: #64748b;
              }

              .financial-info-mobile .financial-value {
                font-size: 13px;
                font-weight: 600;
              }

              .financial-info-mobile .amount {
                color: #059669;
              }

              .financial-info-mobile .received {
                color: #3b82f6;
              }

              .financial-info-mobile .balance-pending {
                color: #ef4444;
              }

              .financial-info-mobile .balance-paid {
                color: #10b981;
              }

              .card-footer-mobile {
                display: flex;
                gap: 8px;
              }

              .card-footer-mobile .action-btn {
                flex: 1;
                padding: 8px;
                border-radius: 8px;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
              }

              .action-btn.view {
                background: #dbeafe;
                color: #1d4ed8;
              }

              .action-btn.edit {
                background: #fef3c7;
                color: #92400e;
              }

              .action-btn.invoice {
                background: #d1fae5;
                color: #065f46;
              }

              /* Tablet/Desktop Table View */
              .events-table-container {
                display: none;
                overflow-x: auto;
              }

              .events-table {
                width: 100%;
                border-collapse: collapse;
                min-width: 1000px;
              }

              .events-table th {
                background: #f8fafc;
                padding: 12px 16px;
                text-align: left;
                font-weight: 600;
                color: #374151;
                border-bottom: 1px solid #e2e8f0;
                font-size: 12px;
                white-space: nowrap;
              }

              .events-table td {
                padding: 12px 16px;
                border-bottom: 1px solid #f1f5f9;
                vertical-align: middle;
                font-size: 14px;
              }

              .events-table tr:hover {
                background: #f8fafc;
              }

              .date-cell {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #475569;
                font-weight: 500;
              }

              .event-cell {
                display: flex;
                flex-direction: column;
                gap: 4px;
              }

              .event-cell strong {
                color: #1f2937;
              }

              .event-cell small {
                color: #6b7280;
                font-size: 12px;
              }

              .client-cell,
              .company-cell {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #374151;
              }

              .type-badge {
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

              .amount-cell,
              .received-cell,
              .balance-cell {
                display: flex;
                align-items: center;
                gap: 4px;
                white-space: nowrap;
              }

              .amount-cell {
                color: #059669;
                font-weight: 600;
              }

              .received-amount {
                color: #3b82f6;
              }

              .balance-cell.pending {
                color: #ef4444;
                font-weight: 500;
              }

              .balance-cell.paid {
                color: #10b981;
                font-weight: 500;
              }

              .status-badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                white-space: nowrap;
              }
              /* Mobile Menu Overlay */
              .mobile-menu-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                display: flex;
                align-items: flex-end;
              }

              .mobile-menu-content {
                background: white;
                width: 100%;
                max-height: 60vh;
                border-radius: 20px 20px 0 0;
                padding: 20px;
                overflow-y: auto;
              }

              .mobile-menu-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid #e2e8f0;
              }

              .mobile-menu-header h3 {
                margin: 0;
                font-size: 18px;
                color: #1e293b;
              }

              .close-menu {
                background: none;
                border: none;
                font-size: 24px;
                color: #64748b;
                cursor: pointer;
                padding: 0;
              }

              .mobile-filter-section {
                margin-bottom: 24px;
              }

              .mobile-filter-section h4 {
                margin: 0 0 12px 0;
                font-size: 16px;
                color: #334155;
              }

              .status-filters-mobile {
                display: flex;
                gap: 8px;
                overflow-x: auto;
                padding-bottom: 8px;
              }

              .status-filter-btn {
                padding: 10px 16px;
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                font-size: 14px;
                color: #475569;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s ease;
              }

              .status-filter-btn.active {
                background: #e0e7ff;
                color: #4f46e5;
                border-color: #c7d2fe;
              }

              .status-filter-btn.confirmed.active {
                background: #d1fae5;
                color: #065f46;
                border-color: #a7f3d0;
              }

              .status-filter-btn.waitlisted.active {
                background: #fef3c7;
                color: #92400e;
                border-color: #fde68a;
              }

              /* Loading & Empty States */
              .loading-state,
              .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                text-align: center;
              }

              .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f1f5f9;
                border-top-color: #6366f1;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
              }

              .empty-icon {
                width: 60px;
                height: 60px;
                background: #f1f5f9;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
                color: #94a3b8;
                font-size: 24px;
              }

              .empty-state h4 {
                margin: 0 0 8px;
                font-size: 16px;
                color: #334155;
              }

              .empty-state p {
                margin: 0;
                font-size: 14px;
                color: #64748b;
              }

              /* Summary Section */
              .list-summary {
                padding: 16px;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                background: white;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
              }

              .financial-totals {
                margin-left: 16px;
                font-size: 13px;
              }

              /* Spinning Animation */
              .spinning {
                animation: spin 1s linear infinite;
              }

              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }

              /* Responsive Breakpoints */

              /* Tablet (768px and up) */
              @media (min-width: 768px) {
                .container {
                  padding: 20px;
                }

                .page-header {
                  padding: 1px;
                }

                .header-stats {
                  grid-template-columns: repeat(4, 1fr);
                  gap: 16px;
                }

                .function-stats-grid {
                  grid-template-columns: repeat(3, 1fr);
                  gap: 16px;
                }

                .events-cards-mobile {
                  display: none;
                }

                .events-table-container {
                  display: block;
                }

                .mobile-menu-btn {
                  display: none;
                }

                .btn-refresh.desktop {
                  display: flex;
                }
              }

              /* Desktop (1024px and up) */
              @media (min-width: 1024px) {
                .function-stats-grid {
                  grid-template-columns: repeat(6, 1fr);
                }

                .search-filters {
                  flex-wrap: nowrap;
                }

                .filter-main {
                  flex-direction: row;
                  align-items: center;
                }

                .desktop-filters {
                  padding-top: 0;
                  border-top: none;
                  margin-left: auto;
                }

                .filters-grid {
                  display: flex;
                  gap: 16px;
                }
              }

              /* Small Mobile (below 640px) */
              @media (max-width: 640px) {
                .btn-text {
                  display: none;
                }

                .mobile-menu-btn {
                  display: inline-flex;
                }

                .btn-refresh.desktop {
                  display: none;
                }

                .function-stats-grid {
                  grid-template-columns: 1fr 1fr;
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

              /* Medium Mobile (641px - 767px) */
              @media (min-width: 641px) and (max-width: 767px) {
                .function-stats-grid {
                  grid-template-columns: repeat(2, 1fr);
                }
              }
                .function-stat-body {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 8px;
              }

.function-stat-count,
.function-stat-revenue {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.function-stat-count {
  border-right: 1px solid #e5e7eb;
  padding-right: 12px;
}

.function-stat-revenue {
  padding-left: 12px;
}

.count,
.revenue {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.function-stat-body .label {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}
            `}</style>
          </div>
        </div>
      </LocalizationProvider>
    </>
  );
}

export default UpcomingEvents;