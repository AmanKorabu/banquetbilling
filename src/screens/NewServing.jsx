import React, { useState, useEffect, useRef, useCallback } from "react";
import { TiArrowBackOutline } from "react-icons/ti";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { bookingApi } from "../services/bookingApi";
import { FaSearch, FaPlus, FaSpinner, FaKeyboard } from "react-icons/fa";

function NewServing() {
  const navigate = useNavigate();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [servingList, setServingList] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const stateRefs = useRef({
    openConfirm: false,
    servingList: [],
    search: "",
    loading: false
  });

  useEffect(() => {
    stateRefs.current = {
      openConfirm,
      servingList,
      search,
      loading
    };
  }, [openConfirm, servingList, search, loading]);

  useEffect(() => {
    const fetchServings = async () => {
      try {
        setLoading(true);
        setError("");

        const hotelId = localStorage.getItem("hotel_id");
        if (!hotelId) {
          setError("No hotel_id found, please login again");
          setLoading(false);
          return;
        }

        console.log("🔍 Searching servings with term:", search);
        const response = await bookingApi.searchServingNames(search);
        console.log("📦 API Response:", response);

        if (Array.isArray(response)) {
          setServingList(response);
        } else if (response && Array.isArray(response.result)) {
          setServingList(response.result);
        } else if (response && response.data) {
          setServingList(response.data);
        } else if (response && typeof response === "object") {
          const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            setServingList(possibleArrays[0]);
          } else {
            setServingList([]);
            setError("No servings data found in response");
          }
        } else {
          setServingList([]);
          setError("No results found or invalid response format");
        }
      } catch (err) {
        console.error("❌ Error fetching servings:", err);
        setError(`Failed to fetch servings: ${err.message}`);
        setServingList([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (search !== undefined) fetchServings();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleBackClick = useCallback(() => setOpenConfirm(true), []);

  const handleConfirm = useCallback(() => {
    setOpenConfirm(false);
    navigate("/new-booking");
  }, [navigate]);

  const handleCancel = useCallback(() => setOpenConfirm(false), []);

  const handleSelect = useCallback((serving) => {
    console.log("✅ Selected serving:", serving);

    const servingId = serving?.LedgerId || serving?.ServingId || serving?.id || "";
    const servingName = serving?.LedgerName || serving?.ServingName || serving?.Name || "";

    sessionStorage.setItem("servingId", servingId);
    sessionStorage.setItem("servingName", servingName);
    sessionStorage.setItem("selectedServing", JSON.stringify(serving));

    console.log("💾 Stored serving in session:", { servingId, servingName });

    navigate("/new-booking", {
      state: {
        selectedServing: serving,
        servingData: {
          servingId,
          servingName,
        },
      },
    });
  }, [navigate]);

  const handleAddNew = useCallback(() => {
    navigate("/new-serving-form", { state: { fromSearch: true } });
  }, [navigate]);

  const handleKeyDown = useCallback((event) => {
    const currentState = stateRefs.current;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      if (currentState.openConfirm) {
        setOpenConfirm(false);
      } else {
        setOpenConfirm(true);
      }
    }
    else if (event.key === 'Enter') {
      event.preventDefault();

      if (currentState.openConfirm) {
        handleConfirm();
      }
      else if (currentState.servingList.length > 0 && !currentState.loading) {
        const firstServing = currentState.servingList[0];
        if (firstServing) {
          handleSelect(firstServing);
        }
      }
    }
    else if (event.key === 'F2' && currentState.servingList.length > 0 && !currentState.loading) {
      event.preventDefault();
      const firstServing = currentState.servingList[0];
      if (firstServing) {
        handleSelect(firstServing);
      }
    }
    else if (event.key === 'F3') {
      event.preventDefault();
      handleAddNew();
    }
  }, [handleConfirm, handleSelect, handleAddNew]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      handleKeyDown(event);
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const searchInput = document.querySelector('.new-serving-search-input');
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  return (
    <>
      <div className="new-serving-container">
        {/* Header */}
        <div className="new-serving-header-section">
          <div className="new-serving-header-content">
            <button
              className="new-serving-back-button"
              onClick={handleBackClick}
              aria-label="Go back (Esc)"
              title="Go Back (Esc)"
            >
              <TiArrowBackOutline size={24} />
              <span>Back</span>
            </button>
            <div className="new-serving-header-title">
              <h1>Search Serving</h1>
              <p className="new-serving-subtitle">Select a serving from the list or add a new one</p>
            </div>
            <div className="new-serving-keyboard-hint">
              <FaKeyboard />
              <span>Esc: Back • Enter/F2: Select • F3: Add New</span>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog
          open={openConfirm}
          onClose={handleCancel}
          PaperProps={{
            sx: { borderRadius: '12px', padding: '4px' }
          }}
        >
          <DialogTitle sx={{
            fontWeight: 600,
            color: '#1f2937',
            borderBottom: '1px solid #e5e7eb',
            padding: '20px 24px'
          }}>
            Confirm Navigation
          </DialogTitle>
          <DialogContent sx={{ padding: '24px' }}>
            <DialogContentText sx={{ color: '#6b7280', fontSize: '15px' }}>
              Are you sure you want to go back? Unsaved changes will be lost.
            </DialogContentText>
            <div style={{
              marginTop: '16px',
              fontSize: '13px',
              color: '#6b7280',
              padding: '8px 12px',
              background: '#f3f4f6',
              borderRadius: '6px'
            }}>
              <strong>Keyboard Shortcuts:</strong>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <kbd>Enter</kbd>
                <span>to confirm</span>
                <kbd style={{ marginLeft: '12px' }}>Esc</kbd>
                <span>to cancel</span>
              </div>
            </div>
          </DialogContent>
          <DialogActions sx={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            gap: '12px'
          }}>
            <Button
              onClick={handleCancel}
              variant="outlined"
              sx={{
                borderColor: '#d1d5db',
                color: '#6b7280',
                borderRadius: '8px',
                textTransform: 'none',
                padding: '8px 20px',
                fontWeight: 500,
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: '#f9fafb'
                }
              }}
            >
              Cancel (Esc)
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              sx={{
                backgroundColor: '#dc2626',
                borderRadius: '8px',
                textTransform: 'none',
                padding: '8px 24px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#b91c1c'
                }
              }}
            >
              Go Back (Enter)
            </Button>
          </DialogActions>
        </Dialog>

        {/* Main Content */}
        <div className="new-serving-content-wrapper">
          {/* Search Section */}
          <div className="new-serving-search-section">
            <div className="new-serving-search-container">
              <div className="new-serving-input-wrapper">

                <input
                  type="text"
                  placeholder="Search by serving name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="new-serving-search-input"
                  autoFocus
                />
                {loading && <FaSpinner className="new-serving-spinner" />}
              </div>
              <button
                onClick={handleAddNew}
                className="new-serving-add-button"
                title="Add New Serving (F3)"
              >
                <FaPlus />
                <span>Add New Serving</span>
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {loading && (
            <div className="new-serving-status new-serving-loading">
              <FaSpinner className="new-serving-spinner" />
              <span>Searching servings...</span>
            </div>
          )}

          {error && (
            <div className="new-serving-status new-serving-error">
              <span className="new-serving-error-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Results Table */}
          <div className="new-serving-table-section">
            <div className="new-serving-table-header">
              <h3>Serving List</h3>
              <span className="new-serving-result-count">
                {servingList.length} {servingList.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            <div className="new-serving-table-container">
              <table className="new-serving-table">
                <thead>
                  <tr>
                    <th className="new-serving-column-index">No.</th>
                    <th className="new-serving-column-name">Serving Name</th>
                    <th className="new-serving-column-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {servingList.map((serving, index) => (
                    <tr
                      key={serving.LedgerId || serving.id || index}
                      className={`new-serving-table-row ${index === 0 ? 'new-serving-first-row' : ''}`}
                    >
                      <td className="new-serving-cell-index">{index + 1}</td>
                      <td className="new-serving-cell-name">
                        <div className="new-serving-item-name">
                          {serving.LedgerName || serving.ServingName || serving.Name}
                        </div>
                      </td>
                      <td className="new-serving-cell-action">
                        <button
                          onClick={() => handleSelect(serving)}
                          className="new-serving-select-button"
                          title={index === 0 ? "Select (Enter or F2)" : "Select"}
                        >
                          Select
                          {index === 0 && <span className="new-serving-shortcut-hint">(Enter/F2)</span>}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {servingList.length === 0 && !loading && !error && (
                    <tr className="new-serving-empty-row">
                      <td colSpan="3">
                        <div className="new-serving-empty-state">
                          <FaSearch size={48} />
                          <h4>No servings found</h4>
                          <p>Try searching with different terms or add a new serving</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .new-serving-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 10px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Header Styles */
        .new-serving-header-section {
          background: white;
          border-radius: 16px;
          padding: 12px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        .new-serving-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .new-serving-header-content {
            flex-wrap: wrap;
          }
        }

        .new-serving-back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 16px;
          color: #475569;
          font-weight: 500;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .new-serving-back-button:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateX(-2px);
        }

        .new-serving-back-button:active {
          transform: translateX(0);
        }

        .new-serving-header-title {
          flex: 1;
        }

        .new-serving-header-title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          background: linear-gradient(135deg, #847239 0%, #a8925c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .new-serving-subtitle {
          margin: 4px 0 0 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 400;
        }

        .new-serving-keyboard-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #e7e9ebff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #475569;
          font-size: 13px;
          white-space: nowrap;
        }

        .new-serving-keyboard-hint svg {
          color: #847239;
        }

        /* Content Wrapper */
        .new-serving-content-wrapper {
          background: white;
          border-radius: 16px;
          padding: 10px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        /* Search Section */
        .new-serving-search-section {
          margin-bottom: 32px;
        }

        .new-serving-search-container {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        @media (max-width: 768px) {
          .new-serving-search-container {
            flex-direction: column;
          }
        }

        .new-serving-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .new-serving-search-icon {
          position: absolute;
          left: 16px;
          color: #94a3b8;
          font-size: 18px;
          z-index: 2;
        }

        .new-serving-search-input {
          width: 100%;
          padding: 14px 20px 14px 48px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          color: #1e293b;
          background: white;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .new-serving-search-input:focus {
          outline: none;
          border-color: #847239;
          box-shadow: 0 0 0 4px rgba(132, 114, 57, 0.15);
        }

        .new-serving-search-input::placeholder {
          color: #94a3b8;
        }

        .new-serving-spinner {
          position: absolute;
          right: 16px;
          animation: new-serving-spin 1s linear infinite;
          color: #847239;
        }

        @keyframes new-serving-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .new-serving-add-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #847239 0%, #a8925c 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 4px 6px rgba(132, 114, 57, 0.2);
        }

        .new-serving-add-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(132, 114, 57, 0.3);
        }

        .new-serving-add-button:active {
          transform: translateY(0);
        }

        /* Status Messages */
        .new-serving-status {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 15px;
          font-weight: 500;
        }

        .new-serving-loading {
          background: #f0f9ff;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }

        .new-serving-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .new-serving-error-icon {
          width: 24px;
          height: 24px;
          background: #dc2626;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        /* Table Section */
        .new-serving-table-section {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .new-serving-table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .new-serving-table-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #4c7eceff;
        }

        .new-serving-result-count {
          background: #e2e8f0;
          color: #ea3e3eff;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .new-serving-table-container {
          overflow-x: auto;
        }

        .new-serving-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        .new-serving-table thead {
          background: #f1f5f9;
        }

        .new-serving-table th {
          padding: 5px 24px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
        }

        .new-serving-column-index {
          width: 80px;
        }

        .new-serving-column-action {
          width: 140px;
        }

        .new-serving-table-row {
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .new-serving-table-row:hover {
          background: #f8fafc;
        }

        .new-serving-first-row {
          position: relative;
        }

     
        .new-serving-table td {
          padding: 20px 24px;
          font-size: 15px;
          color: #334155;
        }

        .new-serving-cell-index {
          font-weight: 500;
          color: #64748b;
          padding-left: 32px !important;
        }

        .new-serving-cell-name {
          font-weight: 500;
          color: #1e293b;
        }

        .new-serving-item-name {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .new-serving-select-button {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: none;
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          justify-content: center;
        }

        .new-serving-select-button:hover {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(14, 165, 233, 0.2);
        }

        .new-serving-select-button:active {
          transform: translateY(0);
        }

        .new-serving-shortcut-hint {
          font-size: 11px;
          opacity: 0.9;
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* Empty State */
        .new-serving-empty-row {
          background: white;
        }

        .new-serving-empty-row td {
          padding: 45px 20px;
        }

        .new-serving-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
          color: #94a3b8;
        }

        .new-serving-empty-state h4 {
          margin: 0;
          color: #64748b;
          font-size: 18px;
          font-weight: 600;
        }

        .new-serving-empty-state p {
          margin: 0;
          font-size: 14px;
          max-width: 400px;
          line-height: 1.5;
        }

        /* Keyboard Styling */
        kbd {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          font-family: monospace;
          color: #374151;
          box-shadow: 0 1px 1px rgba(0,0,0,0.1);
          font-weight: 600;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .new-serving-container {
            padding: 20px;
          }

          .new-serving-header-section {
            padding: 18px;
          }

          .new-serving-keyboard-hint span {
            display: none;
          }

          .new-serving-keyboard-hint {
            padding: 8px;
          }
        }

        @media (max-width: 768px) {
          .new-serving-header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .new-serving-back-button {
            align-self: flex-start;
          }

          .new-serving-keyboard-hint {
            align-self: stretch;
            justify-content: center;
          }

          .new-serving-content-wrapper {
            padding: 18px;
          }

          .new-serving-table-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .new-serving-table th,
          .new-serving-table td {
            padding: 12px 16px;
          }

          .new-serving-first-row::before {
            left: 4px;
          }

          .new-serving-cell-index {
            padding-left: 24px !important;
          }
        }

        @media (max-width: 480px) {
          .new-serving-header-title h1 {
            font-size: 24px;
          }

          .new-serving-add-button span {
            display: none;
          }

          .new-serving-add-button {
            padding: 14px;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            justify-content: center;
          }

          .new-serving-search-input {
            font-size: 14px;
          }

          .new-serving-select-button {
            padding: 8px 12px;
            font-size: 13px;
          }

          .new-serving-shortcut-hint {
            display: none;
          }
        }

        /* Animation */
        @keyframes new-serving-fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .new-serving-table-row {
          animation: new-serving-fadeIn 0.3s ease-out forwards;
        }

        /* Scrollbar Styling */
        .new-serving-table-container::-webkit-scrollbar {
          height: 8px;
        }

        .new-serving-table-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .new-serving-table-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .new-serving-table-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Focus States */
        .new-serving-search-input:focus,
        .new-serving-select-button:focus,
        .new-serving-add-button:focus,
        .new-serving-back-button:focus {
          outline: 2px solid #847239;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}

export default NewServing;