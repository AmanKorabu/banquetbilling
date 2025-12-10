import React, { useState, useEffect } from "react";
import { TiArrowBackOutline } from "react-icons/ti";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { bookingApi } from "../services/bookingApi";


function EnqPartySearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [parties, setParties] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Get current party name from location state
  const currentPartyName = location.state?.currentPartyName || "";

  // 🔹 Fetch parties using centralized bookingApi
  useEffect(() => {
    const fetchParties = async () => {
      try {
        setLoading(true);
        setError("");

        const hotelId = localStorage.getItem("hotel_id");
        if (!hotelId) {
          setError("No hotel_id found, please login again");
          setLoading(false);
          return;
        }

        console.log("🔍 Searching parties with term:", search);
        
        const response = await bookingApi.searchParties(search);
        console.log("📦 API Response:", response);
        
        // Handle different response structures
        if (Array.isArray(response)) {
          setParties(response);
        } else if (response && Array.isArray(response.result)) {
          setParties(response.result);
        } else if (response && response.data) {
          setParties(response.data);
        } else if (response && typeof response === 'object') {
          const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            setParties(possibleArrays[0]);
          } else {
            setParties([]);
            setError("No parties data found in response");
          }
        } else {
          setParties([]);
          setError("No results found or invalid response format");
        }
      } catch (err) {
        console.error("❌ Error fetching parties:", err);
        setError(`Failed to fetch parties: ${err.message}`);
        setParties([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        fetchParties();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Set initial search value from current party name
  useEffect(() => {
    if (currentPartyName) {
      setSearch(currentPartyName);
    }
  }, [currentPartyName]);

  // Back button handlers
  const handleBackClick = () => setOpenConfirm(true);
  const handleConfirm = () => {
    setOpenConfirm(false);
    navigate("/new-enquiry");
  };
  const handleCancel = () => setOpenConfirm(false);

  // Handle party selection
  const handleSelect = (party) => {
    console.log("✅ Selected party:", party);
    
    const selectedParty = {
      LedgerName: party.LedgerName || party.Name || party.partyName || party.CustName || "",
      Name: party.Name || party.LedgerName || party.partyName || party.CustName || "",
      partyName: party.partyName || party.LedgerName || party.Name || party.CustName || "",
      CustName: party.CustName || party.LedgerName || party.Name || party.partyName || "",
      original: party
    };

    console.log("📤 Sending party data to NewEnquiry:", selectedParty);

    navigate("/new-enquiry", {
      state: {
        selectedParty: selectedParty
      }
    });
  };


  // Helper function to get party display name
  const getPartyDisplayName = (party) => {
    return party.LedgerName || party.Name || party.partyName || party.CustName || "N/A";
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
          Search Party
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
          {"Go Back?"}
        </DialogTitle>
        <DialogContent className="search-dialog-content">
          <DialogContentText className="search-dialog-text">
            Are you sure you want to go back? Unsaved changes will be lost.
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
              placeholder="Search Party..."
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
            Searching parties...
          </div>
        )}

        {/* Error State */}
        {loading && <p style={{ textAlign: "center", color: "#666" }}>🔍 Searching parties...</p>}
        {error && <p style={{ color: "red", textAlign: "center" }}>❌ {error}</p>}
       
        {/* Results Table */}
        <div className="search-table-container">
          <table className="search-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Party Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {parties.map((party, index) => (
                <tr key={party.LedgerId || party.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="item-name">
                      {getPartyDisplayName(party)}
                    </div>
                    
                  </td>
                  <td>
                    <button
                      onClick={() => handleSelect(party)}
                      className="search-select-btn"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {parties.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan="3" className="search-empty-state">
                    <div className="search-empty-icon">🔍</div>
                    {search ? "No parties found" : "Start typing to search parties"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Results Count */}
        {parties.length > 0 && !loading && (
          <div className="search-results-count">
            Showing {parties.length} party{parties.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  );
}

export default EnqPartySearch;