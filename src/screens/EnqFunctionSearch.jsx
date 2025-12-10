import React, { useState, useEffect } from 'react';
import { TiArrowBackOutline } from "react-icons/ti";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingApi } from "../services/bookingApi";

function EnqFunctionSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [functionsList, setFunctionsList] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Get current function name from location state
  const currentFunctionName = location.state?.currentFunctionName || "";

  // 🔹 Fetch functions using centralized bookingApi
  useEffect(() => {
    const fetchFunctions = async () => {
      try {
        setLoading(true);
        setError("");

        const hotelId = localStorage.getItem("hotel_id");
        if (!hotelId) {
          setError("No hotel_id found, please login again");
          setLoading(false);
          return;
        }

        console.log("🔍 Searching functions with term:", search);

        const response = await bookingApi.searchFunctions(search);
        console.log("📦 API Response:", response);

        // Handle different response structures
        if (Array.isArray(response)) {
          setFunctionsList(response);
        } else if (response && Array.isArray(response.result)) {
          setFunctionsList(response.result);
        } else if (response && response.data) {
          setFunctionsList(response.data);
        } else if (response && typeof response === 'object') {
          const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            setFunctionsList(possibleArrays[0]);
          } else {
            setFunctionsList([]);
            setError("No functions data found in response");
          }
        } else {
          setFunctionsList([]);
          setError("No results found or invalid response format");
        }
      } catch (err) {
        console.error("❌ Error fetching functions:", err);
        setError(`Failed to fetch functions: ${err.message}`);
        setFunctionsList([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        fetchFunctions();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Set initial search value from current function name
  useEffect(() => {
    if (currentFunctionName) {
      setSearch(currentFunctionName);
    }
  }, [currentFunctionName]);

  // Back button handlers
  const handleBackClick = () => setOpenConfirm(true);
  const handleConfirm = () => {
    setOpenConfirm(false);
    navigate('/new-enquiry');
  };
  const handleCancel = () => setOpenConfirm(false);

  // Handle function selection for enquiry
  const handleSelect = (func) => {
    console.log("✅ Selected function for enquiry:", func);

    const selectedFunction = {
      LedgerName: func.LedgerName || func.Name || func.functionName || "",
      Name: func.Name || func.LedgerName || func.functionName || "",
      functionName: func.functionName || func.LedgerName || func.Name || "",
      original: func
    };

    console.log("📤 Sending function data to Enquiry:", selectedFunction);

    // Save selected function to sessionStorage
    sessionStorage.setItem("selectedEnquiryFunction", JSON.stringify(selectedFunction));

    // Navigate back to enquiry page with the selected function
    navigate('/new-enquiry', {
      state: {
        selectedFunction: selectedFunction
      }
    });
  };



  // Helper function to get function display name
  const getFunctionDisplayName = (func) => {
    return func.LedgerName || func.Name || func.functionName || "N/A";
  };

  return (
    <>
      {/* Header Section */}
      <div className="search-header">
        <button
          type="button"
          onClick={handleBackClick}
          className="search-back-btn"
        >
          <TiArrowBackOutline size={24} color="white" />
        </button>
        <h1 className="search-title">
          Search Function
        </h1>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirm}
        onClose={handleCancel}
        PaperProps={{
          className: "search-dialog"
        }}
      >
        <DialogTitle className="search-dialog-title">
          {"Go Back to Enquiry?"}
        </DialogTitle>
        <DialogContent className="search-dialog-content">
          <DialogContentText className="search-dialog-text">
            Are you sure you want to go back to enquiry? Unsaved changes will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="search-dialog-actions">
          <Button
            onClick={handleCancel}
            className="search-dialog-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            color="error"
            autoFocus
            className="search-dialog-btn"
          >
            Yes, Go Back
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content */}
      <div className="search-container">
        {/* Search Section */}
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="search-form">
            <input
              type="text"
              placeholder="Search Function..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="search-input"
            />
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="search-loading">
            <div className="search-loading-icon">🔍</div>
            Searching functions...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="search-error">
            ❌ {error}
          </div>
        )}

        {/* Results Table */}
        <div className="search-table-container">
          <table className="search-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Function Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {functionsList.map((func, index) => (
                <tr key={func.LedgerId || func.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="item-name">
                      {getFunctionDisplayName(func)}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleSelect(func)}
                      className="search-select-btn"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {functionsList.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan="3" className="search-empty-state">
                    <div className="search-empty-icon">🔍</div>
                    {search ? "No functions found" : "Start typing to search functions"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Results Count */}
        {functionsList.length > 0 && !loading && (
          <div className="search-results-count">
            Showing {functionsList.length} function{functionsList.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  );
}

export default EnqFunctionSearch;