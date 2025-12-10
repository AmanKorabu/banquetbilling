import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TiArrowBackOutline } from "react-icons/ti";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { bookingApi } from "../services/bookingApi";

function NewCompany() {
  const navigate = useNavigate();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref for state to avoid stale closures in keyboard events
  const stateRefs = useRef({
    openConfirm: false,
    companies: [],
    search: "",
    loading: false
  });

  // Update refs when state changes
  useEffect(() => {
    stateRefs.current = {
      openConfirm,
      companies,
      search,
      loading
    };
  }, [openConfirm, companies, search, loading]);

  // 🔹 Fetch companies using centralized bookingApi
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError("");

        const hotelId = localStorage.getItem("hotel_id");
        if (!hotelId) {
          setError("No hotel_id found, please login again");
          setLoading(false);
          return;
        }

        console.log("🔍 Searching companies with term:", search);

        // Use the centralized API function
        const response = await bookingApi.searchCompanies(search);
        console.log("📦 API Response:", response);

        // Handle different response structures
        if (Array.isArray(response)) {
          setCompanies(response);
        } else if (response && Array.isArray(response.result)) {
          setCompanies(response.result);
        } else if (response && response.data) {
          setCompanies(response.data);
        } else if (response && typeof response === 'object') {
          // If response is an object, try to find array in it
          const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            setCompanies(possibleArrays[0]);
          } else {
            setCompanies([]);
            setError("No companies data found in response");
          }
        } else {
          setCompanies([]);
          setError("No results found or invalid response format");
        }
      } catch (err) {
        console.error("❌ Error fetching companies:", err);
        setError(`Failed to fetch companies: ${err.message}`);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        fetchCompanies();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Back button handlers
  const handleBackClick = useCallback(() => setOpenConfirm(true), []);
  
  const handleConfirm = useCallback(() => {
    setOpenConfirm(false);
    navigate('/new-booking');
  }, [navigate]);

  const handleCancel = useCallback(() => setOpenConfirm(false), []);

  // Handle company selection
  const handleSelect = useCallback((company) => {
    console.log("✅ Selected company:", company);

    // Save selected company details to sessionStorage
    sessionStorage.setItem("selectedCompany", JSON.stringify(company));
    sessionStorage.setItem("companyId", company.LedgerId);  // Store the companyId (LedgerId)
    sessionStorage.setItem("companyName", company.LedgerName || company.Name || company.companyName);  // Store the companyName

    // Navigate back to new-booking with the selected company
    navigate('/new-booking', {
      state: {
        selectedCompany: company,
        companyId: company.LedgerId,  // Pass companyId
        companyName: company.LedgerName || company.Name || company.companyName  // Pass companyName
      }
    });
  }, [navigate]);

  // Handle adding new company
  const handleAddNew = useCallback(() => {
    navigate("/new-company-form", {
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
      else if (currentState.companies.length > 0 && !currentState.loading) {
        // If there are companies and Enter is pressed, select the first company
        const firstCompany = currentState.companies[0];
        if (firstCompany) {
          handleSelect(firstCompany);
        }
      }
      // If search is focused and Enter is pressed, it will trigger the search via useEffect
    }
    else if (event.key === 'F2' && currentState.companies.length > 0 && !currentState.loading) {
      // F2 to select first company
      event.preventDefault();
      const firstCompany = currentState.companies[0];
      if (firstCompany) {
        handleSelect(firstCompany);
      }
    }
    else if (event.key === 'F3') {
      // F3 to add new company
      event.preventDefault();
      handleAddNew();
    }
    else if (event.key === 'F6') {
      // F6 to focus search input
      event.preventDefault();
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
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
      {/* Header Section */}
      <div className="search-header">
        <button
          type="button"
          onClick={handleBackClick}
          className="search-back-btn"
          title="Go Back (Esc)"
        >
          <TiArrowBackOutline size={24} color="white" />
        </button>
        <h1 className="search-title">
          Search Company
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

      {/* Main Content */}
      <div className='search-container'>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="search-form">
            <input
              type="text"
              placeholder='Search Company...'
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
              title="Search companies (F6 to focus)"
            />
            <span
              onClick={handleAddNew}
              style={{ cursor: "pointer", color: "blue" }}
              title="Add New Company (F3)"
            >
              +Add New
            </span>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="search-loading">
            <div className="search-loading-icon">🔍</div>
            Searching companies...
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
                <th>Company Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, index) => (
                <tr 
                  key={company.LedgerId || company.id || index}
                  className={index === 0 ? "first-company-row" : ""}
                >
                  <td>{index + 1}</td>
                  <td>
                    <div className="item-name"> 
                      {company.LedgerName || company.Name || company.companyName}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleSelect(company)}
                      className="search-select-btn"
                      title={index === 0 ? "Select (Enter or F2)" : "Select"}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>No companies found</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Keyboard shortcuts help */}
          {companies.length > 0 && (
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
              <kbd>F3</kbd> Add New •
              <kbd>F6</kbd> Focus Search
            </div>
          )}
        </div>
      </div>

      <style>{`
        .first-company-row {
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
        
        .search-loading {
          text-align: center;
          color: #666;
          padding: 20px;
        }
        
        .search-loading-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .search-error {
          color: red;
          text-align: center;
          padding: 10px;
          background-color: #ffe6e6;
          border-radius: 4px;
          margin: 10px 0;
        }
      `}</style>
    </>
  );
}

export default NewCompany;