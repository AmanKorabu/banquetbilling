import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoSearch } from "react-icons/io5";
import { TiArrowBackOutline } from "react-icons/ti";
import { FiRefreshCw, FiSave } from "react-icons/fi";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import { useNavigate } from 'react-router-dom';

function NewParty() {
  const navigate = useNavigate();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [generatedPartyId, setGeneratedPartyId] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    partyName: "",
    contactPerson1: "",
    contactPerson2: "",
    email: "",
    address: "",
    zipcode: "",
    country: "",
    city: "",
    state: "",
    alternateContact1: "",
    alternateContact2: "",
    alternateEmail: ""
  });

  // Form validation state - Only partyName is required
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const stateRefs = useRef({ openConfirm: false, formData: {} });

  // Update refs when state changes
  useEffect(() => {
    stateRefs.current = { openConfirm, formData };
  }, [openConfirm, formData]);

  // Prefill from SearchParty selection
  useEffect(() => {
    const storedParty = sessionStorage.getItem("selectedParty");
    if (storedParty) {
      const p = JSON.parse(storedParty);
      const updatedData = {
        partyName: p.LedgerName || "",
        contactPerson1: p.MobileNo || "",
        contactPerson2: "",
        email: p.EmailId || "",
        address: [p.Address_line1, p.Address_line2].filter(Boolean).join(", "),
        zipcode: p.Zipcode || "",
        country: p.Country || "",
        city: p.City || "",
        state: p.State || "",
        alternateContact1: "",
        alternateContact2: "",
        alternateEmail: ""
      };
      setFormData(updatedData);
      generatePartyId(updatedData.partyName);
    } else {
      generatePartyId("");
    }
  }, []);

  // Generate party ID
  const generatePartyId = useCallback((partyName = "") => {
    const name = partyName || "NEW";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const partyId = `PID-${name.substring(0, 4).toUpperCase()}-${timestamp}${random}`;
    setGeneratedPartyId(partyId);
    return partyId;
  }, []);

  // Update party ID when party name changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.partyName) {
        generatePartyId(formData.partyName);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.partyName, generatePartyId]);

  // Validation - Only partyName is required
  const validateForm = () => {
    const newErrors = {};
    
    // Party Name is REQUIRED
    if (!formData.partyName.trim()) {
      newErrors.partyName = "Party name is required";
    } else if (formData.partyName.trim().length < 2) {
      newErrors.partyName = "Party name should be at least 2 characters";
    }
    
    // Contact Person 1 - Optional but if filled, validate format
    if (formData.contactPerson1 && !/^\d{10}$/.test(formData.contactPerson1)) {
      newErrors.contactPerson1 = "Enter a valid 10-digit mobile number";
    }
    
    // Contact Person 2 - Optional but if filled, validate format
    if (formData.contactPerson2 && !/^\d{10}$/.test(formData.contactPerson2)) {
      newErrors.contactPerson2 = "Enter a valid 10-digit mobile number";
    }
    
    // Email - Optional but if filled, validate format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }
    
    // Alternate Contact 1 - Optional but if filled, validate format
    if (formData.alternateContact1 && !/^\d{10}$/.test(formData.alternateContact1)) {
      newErrors.alternateContact1 = "Enter a valid 10-digit mobile number";
    }
    
    // Alternate Contact 2 - Optional but if filled, validate format
    if (formData.alternateContact2 && !/^\d{10}$/.test(formData.alternateContact2)) {
      newErrors.alternateContact2 = "Enter a valid 10-digit mobile number";
    }
    
    // Alternate Email - Optional but if filled, validate format
    if (formData.alternateEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.alternateEmail)) {
      newErrors.alternateEmail = "Enter a valid email address";
    }
    
    // Zipcode - Optional but if filled, validate format
    if (formData.zipcode && !/^\d{6}$/.test(formData.zipcode)) {
      newErrors.zipcode = "Enter a valid 6-digit zip code";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format phone numbers (allow only digits)
    if (name.includes('Contact') || name.includes('Mobile')) {
      const digitsOnly = value.replace(/\D/g, '');
      // Limit to 10 digits for Indian numbers
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: digitsOnly }));
      }
    }
    // Format zipcode (allow only digits, limit to 6)
    else if (name === 'zipcode') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 6) {
        setFormData(prev => ({ ...prev, [name]: digitsOnly }));
      }
    }
    // Format email (allow normal input)
    else if (name.includes('email') || name.includes('Email')) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // For all other fields
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Save party
  const handleSaveParty = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const hotelId = localStorage.getItem("hotel_id");
      if (!hotelId) {
        throw new Error("No hotel_id found, please login again");
      }

      // Prepare data for API - ALL fields (even empty ones)
      const partyData = {
        LedgerName: formData.partyName.trim(),
        MobileNo: formData.contactPerson1 || "", // Store even if empty
        MobileNo2: formData.contactPerson2 || "",
        EmailId: formData.email || "",
        Address_line1: formData.address || "",
        Zipcode: formData.zipcode || "",
        Country: formData.country || "",
        City: formData.city || "",
        State: formData.state || "",
        AltMobileNo1: formData.alternateContact1 || "",
        AltMobileNo2: formData.alternateContact2 || "",
        AltEmailId: formData.alternateEmail || "",
        PartyId: generatedPartyId,
        hotel_id: hotelId,
        CreatedDate: new Date().toISOString(),
        // Add status flags for empty fields
        HasAddress: !!formData.address.trim(),
        HasContacts: !!(formData.contactPerson1 || formData.email),
        HasAlternateContacts: !!(formData.alternateContact1 || formData.alternateEmail)
      };

      // For demo - simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResponse = {
        success: true,
        data: {
          LedgerId: `L${Date.now().toString().slice(-8)}`,
          ...partyData
        }
      };

      if (mockResponse.success) {
        const savedParty = mockResponse.data;
        
        // Store in sessionStorage - COMPLETE DATA with all fields
        sessionStorage.setItem("selectedParty", JSON.stringify(savedParty));
        sessionStorage.setItem("partyId", savedParty.PartyId || generatedPartyId);
        sessionStorage.setItem("partyName", savedParty.LedgerName);
        sessionStorage.setItem("partyPhone", savedParty.MobileNo || "");
        sessionStorage.setItem("partyEmail", savedParty.EmailId || "");
        sessionStorage.setItem("partyAddress", savedParty.Address_line1 || "");
        sessionStorage.setItem("partyCity", savedParty.City || "");
        sessionStorage.setItem("partyState", savedParty.State || "");
        sessionStorage.setItem("partyCountry", savedParty.Country || "");
        sessionStorage.setItem("partyZipcode", savedParty.Zipcode || "");
        
        showSnackbar('✅ Party saved successfully!', 'success');
        
        // Log all stored data for debugging
        console.log('📦 Party data saved:', {
          required: { partyName: savedParty.LedgerName },
          optional: {
            phone: savedParty.MobileNo,
            email: savedParty.EmailId,
            address: savedParty.Address_line1,
            city: savedParty.City,
            state: savedParty.State,
            country: savedParty.Country,
            zipcode: savedParty.Zipcode,
            alternateContacts: {
              phone1: savedParty.AltMobileNo1,
              phone2: savedParty.AltMobileNo2,
              email: savedParty.AltEmailId
            }
          }
        });
        
        setTimeout(() => {
          navigate("/new-booking", {
            state: {
              selectedParty: savedParty,
              partyId: savedParty.PartyId || generatedPartyId,
              partyName: savedParty.LedgerName,
              // Pass ALL data to booking
              partyData: savedParty
            }
          });
        }, 1500);
      }
    } catch (err) {
      console.error("❌ Error saving party:", err);
      showSnackbar(`Failed to save party: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Back button handlers
  const handleBackClick = useCallback(() => setOpenConfirm(true), []);
  const handleConfirm = useCallback(() => {
    setOpenConfirm(false);
    navigate('/new-booking');
  }, [navigate]);
  const handleCancel = useCallback(() => setOpenConfirm(false), []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event) => {
    const currentState = stateRefs.current;
    
    if (event.key === 'Escape') {
      event.preventDefault();
      if (currentState.openConfirm) {
        setOpenConfirm(false);
      } else {
        setOpenConfirm(true);
      }
    } 
    else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      if (!currentState.openConfirm && formRef.current) {
        formRef.current.requestSubmit();
      }
    }
    else if (event.key === 'F2' && !currentState.openConfirm) {
      event.preventDefault();
      navigate("/search-party");
    }
    else if (event.key === 'F3' && !currentState.openConfirm) {
      event.preventDefault();
      generatePartyId(formData.partyName);
      showSnackbar('New Party ID generated', 'info');
    }
  }, [navigate, generatePartyId, formData.partyName]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Focus first input on mount
  useEffect(() => {
    const firstInput = document.querySelector('input[name="partyName"]');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }, []);

  return (
    <>
      {/* Header */}
      <div className="np-header">
        <button
          type="button"
          onClick={handleBackClick}
          className="np-back-btn"
          title="Go Back (Esc)"
        >
          <TiArrowBackOutline size={24} />
        </button>
        <div className="np-header-content">
          <h1 className="np-title">New Party Registration</h1>
          {generatedPartyId && (
            <div className="np-id-container">
              <span className="np-id-label">Party ID:</span>
              <span className="np-id-value">{generatedPartyId}</span>
              <button 
                onClick={() => {
                  generatePartyId(formData.partyName);
                  showSnackbar('New Party ID generated', 'info');
                }}
                className="np-id-refresh"
                title="Generate New ID (F3)"
              >
                <FiRefreshCw size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="np-header-actions">
          <span className="np-shortcut-hint">Ctrl+S to Save</span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirm}
        onClose={handleCancel}
        PaperProps={{ className: "np-dialog" }}
      >
        <DialogTitle className="np-dialog-title">Discard Changes?</DialogTitle>
        <DialogContent className="np-dialog-content">
          <DialogContentText className="np-dialog-text">
            Are you sure you want to go back? All unsaved changes will be lost.
          </DialogContentText>
          <div className="np-dialog-hint">
            Press <kbd>Enter</kbd> to confirm, <kbd>Esc</kbd> to cancel
          </div>
        </DialogContent>
        <DialogActions className="np-dialog-actions">
          <Button onClick={handleCancel} className="np-dialog-btn cancel">
            Cancel (Esc)
          </Button>
          <Button onClick={handleConfirm} className="np-dialog-btn confirm" autoFocus>
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Main Form */}
      <div className="np-container">
        <form ref={formRef} onSubmit={handleSaveParty} className="np-form">
          {/* Party Info Card */}
          <div className="np-card">
            <div className="np-card-header">
              <h3 className="np-card-title">Basic Information</h3>
              <div className="np-card-subtitle">
                Party Name is required. All other fields are optional but will be saved if provided.
              </div>
            </div>
            
            <div className="np-card-body">
              <div className="np-form-group">
                <div className="np-input-group">
                  <label className="np-label required">Party Name</label>
                  <div className="np-input-with-action">
                    <input
                      type="text"
                      name="partyName"
                      value={formData.partyName}
                      onChange={handleInputChange}
                      placeholder="Enter party name *"
                      className={`np-input ${errors.partyName ? 'error' : ''}`}
                      autoComplete="off"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => navigate("/search-party")}
                      className="np-search-btn"
                      title="Search Existing Party (F2)"
                    >
                      <IoSearch size={18} />
                      <span>Search</span>
                    </button>
                  </div>
                  {errors.partyName && <div className="np-error">{errors.partyName}</div>}
                  <div className="np-field-info">Required field</div>
                </div>

                <div className="np-form-grid">
                  <div className="np-input-group">
                    <label className="np-label">Primary Mobile</label>
                    <div className="np-phone-input">
                      <span className="np-phone-prefix">+91</span>
                      <input
                        type="tel"
                        name="contactPerson1"
                        value={formData.contactPerson1}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile (optional)"
                        className={`np-input ${errors.contactPerson1 ? 'error' : ''}`}
                        maxLength={10}
                        pattern="[0-9]{10}"
                      />
                    </div>
                    {errors.contactPerson1 && <div className="np-error">{errors.contactPerson1}</div>}
                    <div className="np-field-info">Optional</div>
                  </div>

                  <div className="np-input-group">
                    <label className="np-label">Secondary Mobile</label>
                    <div className="np-phone-input">
                      <span className="np-phone-prefix">+91</span>
                      <input
                        type="tel"
                        name="contactPerson2"
                        value={formData.contactPerson2}
                        onChange={handleInputChange}
                        placeholder="Optional secondary number"
                        className={`np-input ${errors.contactPerson2 ? 'error' : ''}`}
                        maxLength={10}
                      />
                    </div>
                    {errors.contactPerson2 && <div className="np-error">{errors.contactPerson2}</div>}
                    <div className="np-field-info">Optional</div>
                  </div>
                </div>

                <div className="np-input-group">
                  <label className="np-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="party@email.com (optional)"
                    className={`np-input ${errors.email ? 'error' : ''}`}
                  />
                  {errors.email && <div className="np-error">{errors.email}</div>}
                  <div className="np-field-info">Optional</div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="np-card">
            <div className="np-card-header">
              <h3 className="np-card-title">Address Details</h3>
              <div className="np-card-subtitle">All address fields are optional but will be saved if provided</div>
            </div>
            
            <div className="np-card-body">
              <div className="np-form-group">
                <div className="np-input-group">
                  <label className="np-label">Complete Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full street address (optional)"
                    className="np-textarea"
                    rows={3}
                  />
                  <div className="np-field-info">Optional</div>
                </div>

                <div className="np-form-grid-3">
                  <div className="np-input-group">
                    <label className="np-label">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City (optional)"
                      className="np-input"
                    />
                    <div className="np-field-info">Optional</div>
                  </div>

                  <div className="np-input-group">
                    <label className="np-label">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State (optional)"
                      className="np-input"
                    />
                    <div className="np-field-info">Optional</div>
                  </div>

                  <div className="np-input-group">
                    <label className="np-label">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Country (optional)"
                      className="np-input"
                    />
                    <div className="np-field-info">Optional</div>
                  </div>
                </div>

                <div className="np-input-group np-zip-group">
                  <label className="np-label">Zip/Postal Code</label>
                  <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleInputChange}
                    placeholder="6-digit zip code (optional)"
                    className={`np-input ${errors.zipcode ? 'error' : ''}`}
                    maxLength={6}
                  />
                  {errors.zipcode && <div className="np-error">{errors.zipcode}</div>}
                  <div className="np-field-info">Optional</div>
                </div>
              </div>
            </div>
          </div>

          {/* Alternate Contacts Card */}
          <div className="np-card">
            <div className="np-card-header">
              <h3 className="np-card-title">Alternate Contacts (Optional)</h3>
              <div className="np-card-subtitle">All fields in this section are optional</div>
            </div>
            
            <div className="np-card-body">
              <div className="np-form-group">
                <div className="np-form-grid">
                  <div className="np-input-group">
                    <label className="np-label">Alternate Mobile 1</label>
                    <div className="np-phone-input">
                      <span className="np-phone-prefix">+91</span>
                      <input
                        type="tel"
                        name="alternateContact1"
                        value={formData.alternateContact1}
                        onChange={handleInputChange}
                        placeholder="Optional alternate number"
                        className={`np-input ${errors.alternateContact1 ? 'error' : ''}`}
                        maxLength={10}
                      />
                    </div>
                    {errors.alternateContact1 && <div className="np-error">{errors.alternateContact1}</div>}
                    <div className="np-field-info">Optional</div>
                  </div>

                  <div className="np-input-group">
                    <label className="np-label">Alternate Mobile 2</label>
                    <div className="np-phone-input">
                      <span className="np-phone-prefix">+91</span>
                      <input
                        type="tel"
                        name="alternateContact2"
                        value={formData.alternateContact2}
                        onChange={handleInputChange}
                        placeholder="Optional alternate number"
                        className={`np-input ${errors.alternateContact2 ? 'error' : ''}`}
                        maxLength={10}
                      />
                    </div>
                    {errors.alternateContact2 && <div className="np-error">{errors.alternateContact2}</div>}
                    <div className="np-field-info">Optional</div>
                  </div>
                </div>

                <div className="np-input-group">
                  <label className="np-label">Alternate Email</label>
                  <input
                    type="email"
                    name="alternateEmail"
                    value={formData.alternateEmail}
                    onChange={handleInputChange}
                    placeholder="alternate@email.com (optional)"
                    className={`np-input ${errors.alternateEmail ? 'error' : ''}`}
                  />
                  {errors.alternateEmail && <div className="np-error">{errors.alternateEmail}</div>}
                  <div className="np-field-info">Optional</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="np-actions">
            <button
              type="button"
              onClick={handleBackClick}
              className="np-btn secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="np-btn primary"
              disabled={loading || !formData.partyName.trim()}
              title={!formData.partyName.trim() ? "Party name is required" : "Save party"}
            >
              {loading ? (
                <>
                  <CircularProgress size={16} color="inherit" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave size={18} />
                  <span>Save Party</span>
                </>
              )}
            </button>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="np-shortcuts">
            <div className="np-shortcuts-title">Keyboard Shortcuts</div>
            <div className="np-shortcuts-grid">
              <div className="np-shortcut-item">
                <kbd>Esc</kbd>
                <span>Back / Cancel</span>
              </div>
              <div className="np-shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>S</kbd>
                <span>Save Party</span>
              </div>
              <div className="np-shortcut-item">
                <kbd>F2</kbd>
                <span>Search Party</span>
              </div>
              <div className="np-shortcut-item">
                <kbd>F3</kbd>
                <span>New Party ID</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        /* Add this new style for field info */
        .np-field-info {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          font-style: italic;
        }

        /* Update input placeholders for optional fields */
        .np-input::placeholder,
        .np-textarea::placeholder {
          color: #94a3b8;
          font-size: 13px;
        }

        /* Update required field indicator */
        .np-label.required {
          position: relative;
        }

        .np-label.required:after {
          content: "*";
          color: #ef4444;
          margin-left: 4px;
        }

        /* Disable button styling when party name is empty */
        .np-btn.primary:disabled {
          background: #94a3b8 !important;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        /* Rest of your existing styles remain the same... */
        :global(.np-dialog) {
          border-radius: 12px;
          padding: 0;
        }

        /* Header */
        .np-header {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          padding: 0 24px;
          height: 64px;
          color: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .np-back-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s ease;
        }

        .np-back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(-2px);
        }

        .np-header-content {
          flex: 1;
          margin-left: 20px;
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .np-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: white;
        }

        .np-id-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          backdrop-filter: blur(10px);
        }

        .np-id-label {
          opacity: 0.9;
        }

        .np-id-value {
          font-weight: 600;
          font-family: 'SF Mono', 'Roboto Mono', monospace;
          letter-spacing: 0.5px;
        }

        .np-id-refresh {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s ease;
        }

        .np-id-refresh:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: rotate(90deg);
        }

        .np-header-actions {
          margin-left: auto;
        }

        .np-shortcut-hint {
          font-size: 12px;
          opacity: 0.8;
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }

        /* Main Container */
        .np-container {
          max-width: 1200px;
          margin: 24px auto;
          padding: 0 20px;
        }

        .np-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Cards */
        .np-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e1e5e9;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .np-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .np-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e1e5e9;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .np-card-title {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .np-card-subtitle {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        .np-card-body {
          padding: 24px;
        }

        /* Form Elements */
        .np-form-group {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .np-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .np-label {
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .np-input, .np-textarea {
          padding: 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          color: #1e293b;
          background: white;
          transition: all 0.2s ease;
          outline: none;
        }

        .np-input:hover, .np-textarea:hover {
          border-color: #94a3b8;
        }

        .np-input:focus, .np-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .np-input.error, .np-textarea.error {
          border-color: #ef4444;
        }

        .np-input.error:focus, .np-textarea.error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .np-error {
          font-size: 12px;
          color: #ef4444;
          margin-top: 4px;
        }

        .np-textarea {
          resize: vertical;
          min-height: 80px;
        }

        /* Input with Action */
        .np-input-with-action {
          display: flex;
          gap: 8px;
        }

        .np-input-with-action .np-input {
          flex: 1;
        }

        .np-search-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .np-search-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .np-search-btn:active {
          transform: translateY(0);
        }

        /* Phone Input */
        .np-phone-input {
          display: flex;
          align-items: center;
        }

        .np-phone-prefix {
          padding: 12px 12px 12px 16px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-right: none;
          border-radius: 8px 0 0 8px;
          font-size: 14px;
          color: #475569;
        }

        .np-phone-input .np-input {
          border-radius: 0 8px 8px 0;
          flex: 1;
        }

        /* Grid Layouts */
        .np-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .np-form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .np-form-grid,
          .np-form-grid-3 {
            grid-template-columns: 1fr;
          }
        }

        .np-zip-group {
          max-width: 200px;
        }

        /* Actions */
        .np-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 0;
          border-top: 1px solid #e1e5e9;
        }

        .np-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 32px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 120px;
        }

        .np-btn.secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .np-btn.secondary:hover {
          background: #e2e8f0;
          color: #334155;
        }

        .np-btn.primary {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
        }

        .np-btn.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #1a3364 0%, #24468a 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.2);
        }

        .np-btn.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Shortcuts */
        .np-shortcuts {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          border: 1px dashed #cbd5e1;
        }

        .np-shortcuts-title {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 12px;
        }

        .np-shortcuts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .np-shortcut-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .np-shortcut-item kbd {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 12px;
          font-family: 'SF Mono', 'Roboto Mono', monospace;
          color: #475569;
          box-shadow: 0 1px 1px rgba(0,0,0,0.05);
          min-width: 20px;
          text-align: center;
        }

        .np-shortcut-item span {
          font-size: 13px;
          color: #64748b;
        }

        /* Dialog */
        .np-dialog-title {
          font-weight: 600;
          color: #1e293b;
          font-size: 18px;
        }

        .np-dialog-content {
          padding: 20px 24px !important;
        }

        .np-dialog-text {
          color: #64748b;
          font-size: 14px;
        }

        .np-dialog-hint {
          margin-top: 12px;
          font-size: 12px;
          color: #94a3b8;
        }

        .np-dialog-actions {
          padding: 16px 24px !important;
          border-top: 1px solid #e1e5e9;
        }

        .np-dialog-btn {
          text-transform: none;
          font-weight: 500;
          border-radius: 6px;
          padding: 8px 20px;
          font-size: 14px;
        }

        .np-dialog-btn.cancel {
          color: #64748b;
        }

        .np-dialog-btn.confirm {
          background: #ef4444;
          color: white;
        }

        .np-dialog-btn.confirm:hover {
          background: #dc2626;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .np-header {
            padding: 0 16px;
            height: 56px;
          }

          .np-title {
            font-size: 18px;
          }

          .np-header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            margin-left: 12px;
          }

          .np-id-container {
            padding: 4px 8px;
            font-size: 12px;
          }

          .np-container {
            padding: 0 16px;
            margin: 16px auto;
          }

          .np-card-header,
          .np-card-body {
            padding: 16px;
          }

          .np-actions {
            flex-direction: column;
          }

          .np-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

export default NewParty;