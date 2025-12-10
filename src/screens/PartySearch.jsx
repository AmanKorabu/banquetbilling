import React, { useState, useEffect, useRef, useCallback } from "react";
import { TiArrowBackOutline } from "react-icons/ti";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { bookingApi } from "../services/bookingApi";

function PartySearch() {
  const navigate = useNavigate();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [parties, setParties] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Ref for state to avoid stale closures in keyboard events
  const stateRefs = useRef({
    openConfirm: false,
    parties: [],
    search: "",
    loading: false
  });

  // Update refs when state changes
  useEffect(() => {
    stateRefs.current = {
      openConfirm,
      parties,
      search,
      loading
    };
  }, [openConfirm, parties, search, loading]);

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

        // Use the centralized API function
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
          // If response is an object, try to find array in it
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

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        fetchParties();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Back button handlers
  const handleBackClick = useCallback(() => setOpenConfirm(true), []);
  
  const handleConfirm = useCallback(() => {
    setOpenConfirm(false);
    navigate("/new-booking");
  }, [navigate]);

  const handleCancel = useCallback(() => setOpenConfirm(false), []);

  // Handle party selection
  const handleSelect = useCallback((party) => {
    console.log("✅ Selected party:", party);

    // Extract fields from API response
    const partyId = party?.LedgerId || "";
    const partyName = party?.LedgerName || "";
    const phone = party?.MobileNo || "";
    const email = party?.EmailId || "";
    const address1 = party?.Address_line1 || "";
    const address2 = party?.Address_line2 || "";
    const city = party?.City || "";
    const state = party?.State || "";
    const country = party?.Country || "";
    const zipcode = party?.Zipcode || "";

    // ✅ Store in sessionStorage for NewBooking.jsx
    sessionStorage.setItem("partyId", partyId);
    sessionStorage.setItem("partyName", partyName);
    sessionStorage.setItem("partyPhone", phone);
    sessionStorage.setItem("partyEmail", email);
    sessionStorage.setItem("partyAddress1", address1);
    sessionStorage.setItem("partyAddress2", address2);
    sessionStorage.setItem("partyCity", city);
    sessionStorage.setItem("partyState", state);
    sessionStorage.setItem("partyCountry", country);
    sessionStorage.setItem("partyZipcode", zipcode);
    sessionStorage.setItem("selectedParty", JSON.stringify(party));

    // ✅ Navigate back to NewBooking
    navigate("/new-booking", {
      state: {
        selectedParty: party,
        partyId,
        partyName,
      },
    });
  }, [navigate]);

  const handleAddNew = useCallback(() => {
    navigate("/new-party", {
      state: { fromSearch: true }
    });
  }, [navigate]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event) => {
    const currentState = stateRefs.current;
    
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      if (currentState.openConfirm) {
        // If dialog is open, close it
        setOpenConfirm(false);
      } else {
        // If no dialog open, show confirmation
        setOpenConfirm(true);
      }
    } 
    else if (event.key === 'Enter') {
      event.preventDefault();
      
      if (currentState.openConfirm) {
        // If confirmation dialog is open, confirm the action
        handleConfirm();
      } 
      else if (currentState.parties.length > 0 && !currentState.loading) {
        // If there are parties and Enter is pressed, select the first party
        const firstParty = currentState.parties[0];
        if (firstParty) {
          handleSelect(firstParty);
        }
      }
      // If search is focused and Enter is pressed, it will trigger the search via useEffect
    }
    else if (event.key === 'F2' && currentState.parties.length > 0 && !currentState.loading) {
      // F2 to select first party
      event.preventDefault();
      const firstParty = currentState.parties[0];
      if (firstParty) {
        handleSelect(firstParty);
      }
    }
    else if (event.key === 'F3') {
      // F3 to add new party
      event.preventDefault();
      handleAddNew();
    }
  }, [handleConfirm, handleSelect, handleAddNew]);

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyPress = (event) => {
      handleKeyDown(event);
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyDown]);

  // Focus management - focus search input on mount
  useEffect(() => {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  return (
    <>
      <div className="search-header">
        <button
          type="button"
          onClick={handleBackClick}
          className="search-back-btn"
          title="Go Back (Esc)"
        >
          <TiArrowBackOutline size={24} color="white" />
        </button>
        <h1 className="search-title">Search Party</h1>
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
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Press <kbd>Enter</kbd> to confirm, <kbd>Esc</kbd> to cancel
          </div>
        </DialogContent>
        <DialogActions className="search-dialog-actions">
          <Button
            onClick={handleCancel}
            className="search-dialog-btn"
          >
            Cancel (Esc)
          </Button>
          <Button
            onClick={handleConfirm}
            color="error"
            autoFocus
            className="search-dialog-btn"
          >
            Yes, Go Back (Enter)
          </Button>
        </DialogActions>
      </Dialog>

      <div className="search-container">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="search-form">
            <input
              type="text"
              placeholder="Search Party..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="search-input"
              onKeyDown={(e) => {
                // Allow Enter to work for form submission prevention
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
            <span
              onClick={handleAddNew}
              style={{ cursor: "pointer", color: "blue" }}
              title="Add New Party (F3)"
            >
              +Add New
            </span>
          </div>
        </form>

        {loading && <p style={{ textAlign: "center", color: "#666" }}>🔍 Searching parties...</p>}
        {error && <p style={{ color: "red", textAlign: "center" }}>❌ {error}</p>}

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
                <tr 
                  key={party.LedgerId || party.id || index}
                  className={index === 0 ? "first-party-row" : ""}
                >
                  <td>{index + 1}</td>
                  <td>
                    <div className="item-name">
                      {party.LedgerName || party.Name || party.partyName}
                    </div>
                  </td>
                  <td>
                    <button
                      className='search-select-btn'
                      onClick={() => handleSelect(party)}
                      style={{ cursor: 'pointer', color: 'blue' }}
                      title={index === 0 ? "Select (Enter or F2)" : "Select"}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
              {parties.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>No parties found</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Keyboard shortcuts help */}
          {parties.length > 0 && (
            <div style={{ 
              marginTop: '10px', 
              fontSize: '12px', 
              color: '#666',
              textAlign: 'center',
              padding: '5px',
              border: '1px dashed #ccc',
              borderRadius: '4px'
            }}>
              💡 <strong>Keyboard Shortcuts:</strong> 
              <kbd>Esc</kbd> Back • 
              <kbd>Enter</kbd> Select First • 
              <kbd>F2</kbd> Select First • 
              <kbd>F3</kbd> Add New
            </div>
          )}
        </div>
      </div>

      <style>{`
        .first-party-row {
          background-color: #f0f8ff !important;
          border-left: 3px solid #007bff;
        }
        
        kbd {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 3px;
          padding: 2px 5px;
          font-size: 11px;
          margin: 0 2px;
          box-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }
        
        .search-select-btn:focus {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }
        
        .search-input:focus {
          outline: 2px solid #007bff;
        }
      `}</style>
    </>
  );
}

export default PartySearch;