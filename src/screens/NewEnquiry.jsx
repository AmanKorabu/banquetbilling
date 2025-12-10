import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { FaSave, FaSyncAlt } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";

// Import components
import ConfirmBackButton from "../components/ConfirmBackButton";
import ConfirmationDialog from "../components/ConfirmationDilog"; // <- check this file name

// Import your existing API
import { initialDataApi } from "../services/initialDataApi";
import useEscapeNavigate from "../hooks/EscapeNavigate";
import bookingApi from "../services/bookingApi";

// 🔹 helper: convert "DD-MM-YYYY" or "YYYY-MM-DD" to dayjs()
const parseToDayjs = (value) => {
  if (!value) return dayjs();
  if (dayjs.isDayjs(value)) return value;

  const str = String(value);
  const parts = str.split("-");

  // If looks like DD-MM-YYYY
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    const [dd, mm, yyyy] = parts;
    return dayjs(`${yyyy}-${mm}-${dd}`);
  }

  // Fallback – let dayjs try
  return dayjs(str);
};

function NewEnquiry() {
  const navigate = useNavigate();
  const location = useLocation();
  useEscapeNavigate("/enquiry-dashboard");

  // 🔹 detect edit mode + current enquiry
  const isEditMode = location.state?.mode === "edit";
  const editingEnquiry = location.state?.enquiry || null;
  const editingEnquiryId =
    location.state?.enquiryId || editingEnquiry?.QuotationId || null;

  // State declarations
  const [attendees, setAttendees] = useState([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openSaveConfirm, setOpenSaveConfirm] = useState(false);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Form data state with sessionStorage persistence
  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem("newEnquiryFormData");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          attendedBy: parsed.attendedBy || "",
          bookingFromDate: parsed.bookingFromDate
            ? dayjs(parsed.bookingFromDate)
            : dayjs(),
          bookingToDate: parsed.bookingToDate
            ? dayjs(parsed.bookingToDate)
            : dayjs(),
          partyName: parsed.partyName || "",
          companyName: parsed.companyName || "",
          functionName: parsed.functionName || "",
        };
      }
    } catch (error) {
      console.error("Error loading saved form data:", error);
    }

    return {
      attendedBy: "",
      bookingFromDate: dayjs(),
      bookingToDate: dayjs(),
      partyName: "",
      companyName: "",
      functionName: "",
    };
  });

  // 🔹 when opened in EDIT mode, override formData with enquiry values
  useEffect(() => {
    if (!isEditMode || !editingEnquiry) return;

    setFormData((prev) => ({
      ...prev,
      // attendedBy is not in enquiry list API, so we keep existing / blank
      bookingFromDate: editingEnquiry.FunctionFrom
        ? parseToDayjs(editingEnquiry.FunctionFrom)
        : prev.bookingFromDate,
      bookingToDate: editingEnquiry.FunctionTo
        ? parseToDayjs(editingEnquiry.FunctionTo)
        : prev.bookingToDate,
      partyName: editingEnquiry.PartyName || "",
      companyName: editingEnquiry.Company || "",
      functionName: editingEnquiry.Function || "",
    }));

    // ignore any previous "new enquiry" unsaved data
    sessionStorage.removeItem("newEnquiryFormData");
  }, [isEditMode, editingEnquiry]);

  // Attended By functionality
  const [showOtherAttendedBy, setShowOtherAttendedBy] = useState(false);
  const [otherAttendedByValue, setOtherAttendedByValue] = useState("");

  // Refs for focus management
  const attendedByRef = useRef(null);
  const partyNameRef = useRef(null);
  const companyNameRef = useRef(null);
  const functionNameRef = useRef(null);

  // Persist form data to sessionStorage
  useEffect(() => {
    try {
      const dataToSave = {
        ...formData,
        bookingFromDate: formData.bookingFromDate?.toISOString(),
        bookingToDate: formData.bookingToDate?.toISOString(),
      };
      sessionStorage.setItem(
        "newEnquiryFormData",
        JSON.stringify(dataToSave)
      );
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  }, [formData]);

  // Load initial data (attendees from server data)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingAttendees(true);
        console.log("🔄 Fetching initial data for enquiry...");

        const initialData = await initialDataApi.getInitialData();
        console.log("📦 Raw initial data:", initialData);

        let attendeesData = [];

        if (Array.isArray(initialData?.attendees)) {
          attendeesData = initialData.attendees;
        } else if (Array.isArray(initialData?.data?.attendees)) {
          attendeesData = initialData.data.attendees;
        } else if (Array.isArray(initialData)) {
          attendeesData = initialData;
        }

        console.log("👥 Extracted attendees:", attendeesData);
        setAttendees(attendeesData);

        if (formData.attendedBy && attendeesData.length > 0) {
          const isInAttendees = attendeesData.some(
            (attendee) => attendee.Name === formData.attendedBy
          );
          if (!isInAttendees) {
            setShowOtherAttendedBy(true);
            setOtherAttendedByValue(formData.attendedBy);
          }
        }

        if (attendeesData.length === 0) {
          console.warn("⚠️ No attendees found in initial data");
          const fallbackAttendees = [
            { Userid: 1, Name: "Manager" },
            { Userid: 2, Name: "Sales Executive" },
            { Userid: 3, Name: "Reception" },
          ];
          setAttendees(fallbackAttendees);
          console.log("🔄 Using fallback attendees:", fallbackAttendees);
        }
      } catch (err) {
        console.error("❌ Error fetching initial data:", err);
        toast.error("Failed to load attendees. Please try again.", {
          toastId: "load-data-error",
        });

        const fallbackAttendees = [
          { Userid: 1, Name: "Manager" },
          { Userid: 2, Name: "Sales Executive" },
        ];
        setAttendees(fallbackAttendees);
      } finally {
        setLoadingAttendees(false);
      }
    };

    // Load once on mount
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle updates from location state (search party / company / function)
  useEffect(() => {
    if (!location.state) return;

    setFormData((prev) => {
      let hasUpdates = false;
      const updates = { ...prev };

      if (location.state.selectedParty) {
        const party = location.state.selectedParty;
        updates.partyName =
          party.LedgerName ||
          party.Name ||
          party.partyName ||
          party.CustName ||
          "";
        hasUpdates = true;
      }

      if (location.state.selectedCompany) {
        const company = location.state.selectedCompany;
        updates.companyName =
          company.CompanyName ||
          company.Name ||
          company.companyName ||
          company.CompName ||
          "";
        hasUpdates = true;
      }

      if (location.state.selectedFunction) {
        const func = location.state.selectedFunction;
        updates.functionName =
          func.FunctionName ||
          func.Name ||
          func.functionName ||
          func.FuncName ||
          "";
        hasUpdates = true;
      }

      return hasUpdates ? updates : prev;
    });

    // clear state so it doesn't re-apply on refresh
    window.history.replaceState({}, document.title);
  }, [location.state]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handle date changes
  const handleDateChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handle keydown event for form navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.target.form;
      const index = Array.prototype.indexOf.call(form, e.target);
      const next = form.elements[index + 1];
      next?.focus();
    }
  }, []);

  // Toggle for "Other Attended By"
  const handleOtherAttendedByChange = useCallback((e) => {
    const value = e.target.value;
    setOtherAttendedByValue(value);
    setFormData((prev) => ({ ...prev, attendedBy: value }));
  }, []);

  const handleToggleAttendedBy = useCallback(() => {
    setShowOtherAttendedBy((prev) => !prev);
    setFormData((prev) => ({
      ...prev,
      attendedBy: showOtherAttendedBy ? "" : prev.attendedBy,
    }));
    if (showOtherAttendedBy) {
      setOtherAttendedByValue("");
    }
  }, [showOtherAttendedBy]);

  // Search functions
  const handleSearch = useCallback(
    (type) => {
      sessionStorage.setItem(
        "newEnquiryFormData",
        JSON.stringify({
          ...formData,
          bookingFromDate: formData.bookingFromDate?.toISOString(),
          bookingToDate: formData.bookingToDate?.toISOString(),
        })
      );

      navigate(`/search-${type}-enquiry`, {
        state: { currentName: formData[`${type}Name`] },
      });
    },
    [formData, navigate]
  );

  // Form validation
  const validateForm = useCallback(() => {
    if (!formData.attendedBy || formData.attendedBy.trim() === "") {
      toast.error("⚠️ Please select Attended By");
      attendedByRef.current?.focus();
      return false;
    }
    if (!formData.partyName || formData.partyName.trim() === "") {
      toast.error("⚠️ Please select Party Name");
      return false;
    }
    if (!formData.companyName || formData.companyName.trim() === "") {
      toast.error("⚠️ Please select Company Name");
      return false;
    }
    if (!formData.functionName || formData.functionName.trim() === "") {
      toast.error("⚠️ Please select Function Name");
      return false;
    }

    return true;
  }, [formData]);

  // Handle form submission – uses same requestBody + API as NewBooking
  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();

      if (!validateForm()) return;

      const safeFormat = (date) =>
        date && dayjs(date).isValid() ? dayjs(date).format("DD-MM-YYYY") : "";
      const safeTimeFormat = (date) =>
        date && dayjs(date).isValid() ? dayjs(date).format("HH:mm:ss") : "";

      const userId = localStorage.getItem("user_id") || "";
      const hotelId = localStorage.getItem("hotel_id") || "";

      if (!hotelId) {
        toast.error("No hotel selected. Please login again.");
        return;
      }

      const isEdit = !!editingEnquiryId;

      // For enquiry we don't have items yet → all amounts are 0
      const subTotal = 0;
      const totalDiscount = 0;
      const taxable = 0;
      const totalTax = 0;
      const otherCharges = 0;
      const settlementDiscount = 0;
    //   const gross = 0;
      const roundoff = 0;
      const billTotal = 0;

      // Build request body SAME SHAPE as NewBooking (minimal enquiry version)
      const requestBody = {
        user_id: userId,
        hotel_id: hotelId,

        // Dates
        booking_date: safeFormat(formData.bookingFromDate),
        booking_date_to: safeFormat(formData.bookingToDate),

        // Company / Function
        comp_id: "",
        comp_name: formData.companyName || "",
        quot_status_id: "",
        function_id: "",
        function_name: formData.functionName || "",

        // Party details
        party_details: {
          party_id: "",
          party_name: formData.partyName || "",
          contact1: "",
          contact2: "",
          whatsapp1: "",
          whatsapp2: "",
          email1: "",
          email2: "",
          addressline1: "",
          addressline2: "",
          zipcode: "",
          country: "",
          state: "",
          city: "",
        },

        // Function details – minimal
        function_details: {
          occasion: formData.functionName || "",
          function_time: "",
          guest_name: formData.partyName || "",
          designation: "Host",
          arrival_time: "",
          instruction: "",
        },

        // Minimal events array – required by API, but with blanks / zeros
        events: [
          {
            sel_event_id: "",
            event_name: formData.functionName || "",
            event_date: safeFormat(formData.bookingFromDate),
            from_time: "",
            to_time: "",
            serving_id: "",
            serving_name: "",
            venue_id: "",
            venue_name: "",
            pax: "",
            veg_pax: "",
            non_veg_pax: "",
            rate_per_pax: "",
            instructions: "",
            status_id: "",
            status_name: "Enquiry",
            venue_address: "",

            // Amounts (all zero for enquiry)
            subtotal: subTotal,
            package_igst_per: 0,
            package_igst_amt: 0,
            package_cgst_per: 0,
            package_cgst_amt: 0,
            package_sgst_per: 0,
            package_sgst_amt: 0,
            package_roundoff: 0,
            package_total: billTotal,

            venue_charges: 0,
            venue_igst_per: 0,
            venue_igst_amt: 0,
            venue_cgst_per: 0,
            venue_cgst_amt: 0,
            venue_sgst_per: 0,
            venue_sgst_amt: 0,
            venue_roundoff: 0,
            venue_total: 0,

            other_charges: otherCharges,
            other_igst_per: 0,
            other_igst_amt: 0,
            other_cgst_per: 0,
            other_cgst_amt: 0,
            other_sgst_per: 0,
            other_sgst_amt: 0,
            other_roundoff: 0,
            other_total: 0,

            total_amt: billTotal,
            package_id: "",
            eventquot_id: isEdit ? editingEnquiryId : "",
            tax_per_id: "0",
            min_pax: "",
            max_pax: "",

            // No menus / items in enquiry
            event_menus: [],
            event_package_menus: [],
            menu_itms_arr: [],
          },
        ],

        // Quotation / enquiry IDs
        quot_id: isEdit ? editingEnquiryId : "0",

        // Totals (same as NewBooking, but all zero)
        package_amount: subTotal.toFixed(2),
        venue_amount: "0.00",
        other_amount: otherCharges.toFixed(2),
        subtotal_all: subTotal.toFixed(2),
        discount: totalDiscount.toFixed(2),
        fright: "0.00",
        taxable: taxable.toFixed(2),
        tax: totalTax.toFixed(2),
        charges: "0.00",
        roundoff: roundoff.toFixed(2),
        bill_amount: billTotal.toFixed(2),
        bill_comp_id: "",

        single_event: "1",
        invoice_flag: "0",
        bill_id: "0",

        attended_by: formData.attendedBy || "",
        from_list: 1,

        // Entry date/time
        entry_date: safeFormat(dayjs()),
        entry_time: safeTimeFormat(dayjs()),

        // Other / settlement
        other_ch_bill: otherCharges.toFixed(2),
        settl_disc_bill: settlementDiscount.toFixed(2),

        // Flags
        enquiry: 1,
        AddedFrom: "E",
      };

      console.log("📦 Submitting enquiry payload to bookingApi:", requestBody);

      try {
        const response = await bookingApi.submitEnquiry(requestBody);
        console.log("✅ Enquiry API response:", response);

        if (
          response?.success ||
          response?.status === "success" ||
          response?.status === "ok"
        ) {
          toast.success(
            isEdit
              ? "Enquiry updated successfully! ✅"
              : "Enquiry saved successfully! ✅"
          );

          // Clear form
          setFormData({
            attendedBy: "",
            bookingFromDate: dayjs(),
            bookingToDate: dayjs(),
            partyName: "",
            companyName: "",
            functionName: "",
          });
          sessionStorage.removeItem("newEnquiryFormData");

          // Go back to enquiry list
          navigate("/enquiry-dashboard", { replace: true });
        } else {
          const msg =
            response?.message ||
            response?.error ||
            "Failed to save enquiry. Please try again.";
          toast.error(msg);
        }
      } catch (error) {
        console.error("❌ Error saving enquiry:", error);
        toast.error("Failed to save enquiry. Please try again.");
      }
    },
    [formData, validateForm, navigate, editingEnquiryId]
  );

  const handleSaveClick = useCallback(() => {
    if (!validateForm()) return;
    setOpenSaveConfirm(true);
  }, [validateForm]);

  const handleSaveConfirm = useCallback(() => {
    setOpenSaveConfirm(false);
    handleSubmit();
  }, [handleSubmit]);

  const handleSaveCancel = useCallback(() => setOpenSaveConfirm(false), []);

  const handleResetForm = useCallback(() => {
    setFormData({
      attendedBy: "",
      bookingFromDate: dayjs(),
      bookingToDate: dayjs(),
      partyName: "",
      companyName: "",
      functionName: "",
    });
    sessionStorage.removeItem("newEnquiryFormData");
    toast.info("Form has been reset 🔄");
  }, []);

  // DatePicker props
  const datePickerProps = {
    format: "DD-MM-YYYY",
    slotProps: {
      textField: {
        onKeyDown: handleKeyDown,
        size: "small",
        style: { width: "100%" },
      },
    },
  };

  useEffect(() => {
    const handleFunctionKeys = (e) => {
      if (e.key.startsWith("F")) {
        e.preventDefault();

        switch (e.key) {
          case "F2":
            handleSaveClick();
            break;
          case "F1":
            handleResetForm();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener("keydown", handleFunctionKeys);
    return () => {
      document.removeEventListener("keydown", handleFunctionKeys);
    };
  }, [handleResetForm, handleSaveClick]);

  return (
    <>
      <ConfirmBackButton
        title={
          isEditMode
            ? `Edit Enquiry${
                editingEnquiry?.QuotationNo
                  ? ` #${editingEnquiry.QuotationNo}`
                  : ""
              }`
            : "Add Enquiry"
        }
        onClick={(e) => {
          e.preventDefault();
          setOpenConfirm(true);
        }}
      />

      <ConfirmationDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={() => {
          setOpenConfirm(false);
          sessionStorage.removeItem("newEnquiryFormData");
          navigate("/enquiry-dashboard");
        }}
        title="Go Back?"
        message="Are you sure you want to go back? Unsaved changes will be lost."
        confirmText="Yes, Go Back"
        confirmColor="error"
      />

      <ConfirmationDialog
        open={openSaveConfirm}
        onClose={handleSaveCancel}
        onConfirm={handleSaveConfirm}
        title={isEditMode ? "Update Enquiry?" : "Save Enquiry?"}
        message={
          isEditMode
            ? "Are you sure you want to update this enquiry?"
            : "Are you sure you want to save this enquiry?"
        }
        confirmText="Yes"
        confirmColor="success"
      />

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="new-enquiry-container">
          <div className="enquiry-form-wrapper">
            <form onSubmit={handleSubmit} className="enquiry-form">
              {/* First Row - 3 Columns on Desktop */}
              <div className="form-row">
                {/* Attended By Section */}
                <div className="input-group enquiry-input-group">
                  <label className="enquiry-label">Attended By</label>
                  <div className="attended-by-container">
                    {!showOtherAttendedBy ? (
                      <select
                        name="attendedBy"
                        value={formData.attendedBy}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        ref={attendedByRef}
                        required
                        disabled={loadingAttendees}
                        className="enquiry-select"
                      >
                        <option value="" hidden>
                          {loadingAttendees
                            ? "Loading attendees..."
                            : "Select Attended By"}
                        </option>
                        {attendees.map((attendee) => (
                          <option
                            key={
                              attendee.Userid ||
                              attendee.id ||
                              attendee.Name
                            }
                            value={attendee.Name}
                          >
                            {attendee.Name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="other-attended-by-input"
                        type="text"
                        value={otherAttendedByValue}
                        onChange={handleOtherAttendedByChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter attended by name"
                        required
                        className="enquiry-input"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleToggleAttendedBy}
                      disabled={loadingAttendees}
                      className={`toggle-attended-by-btn ${
                        loadingAttendees ? "disabled" : ""
                      }`}
                    >
                      {loadingAttendees
                        ? "..."
                        : showOtherAttendedBy
                        ? "LIST"
                        : "OTHER"}
                    </button>
                  </div>
                  {loadingAttendees && (
                    <p className="loading-text">Loading attendees...</p>
                  )}
                </div>

                {/* Booking From Section */}
                <div className="input-group enquiry-input-group">
                  <label className="enquiry-label">Booking From</label>
                  <DatePicker
                    label="Select Date"
                    value={formData.bookingFromDate}
                    onChange={(v) => handleDateChange("bookingFromDate", v)}
                    {...datePickerProps}
                  />
                </div>

                {/* Booking To Section */}
                <div className="input-group enquiry-input-group">
                  <label className="enquiry-label">Booking To</label>
                  <DatePicker
                    label="Select Date"
                    value={formData.bookingToDate}
                    onChange={(v) => handleDateChange("bookingToDate", v)}
                    {...datePickerProps}
                  />
                </div>
              </div>

              {/* Second Row - 3 Columns on Desktop */}
              <div className="form-row">
                {/* Party Name */}
                <div className="input-group enquiry-input-group">
                  <label className="enquiry-label">Party Name</label>
                  <div
                    onClick={() => handleSearch("party")}
                    ref={partyNameRef}
                    className="selection-div party-selection"
                  >
                    {formData.partyName ? (
                      <span className="selected-value">
                        {formData.partyName}
                      </span>
                    ) : (
                      <span className="placeholder-text">
                        Select Party Name
                      </span>
                    )}
                    <IoSearch className="search-icon" />
                  </div>
                </div>

                {/* Company Name */}
                <div className="input-group enquiry-input-group">
                  <label className="enquiry-label">Company Name</label>
                  <div
                    onClick={() => handleSearch("company")}
                    ref={companyNameRef}
                    className="selection-div company-selection"
                  >
                    {formData.companyName ? (
                      <span className="selected-value">
                        {formData.companyName}
                      </span>
                    ) : (
                      <span className="placeholder-text">
                        Select Company Name
                      </span>
                    )}
                    <IoSearch className="search-icon" />
                  </div>
                </div>

                {/* Function Name */}
                <div className="input-group enquiry-input-group">
                  <label className="enquiry-label">Function Name</label>
                  <div
                    onClick={() => handleSearch("function")}
                    ref={functionNameRef}
                    className="selection-div function-selection"
                  >
                    {formData.functionName ? (
                      <span className="selected-value">
                        {formData.functionName}
                      </span>
                    ) : (
                      <span className="placeholder-text">
                        Select Function Name
                      </span>
                    )}
                    <IoSearch className="search-icon" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="enquiry-action-buttons">
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className="save-enquiry-btn"
                >
                  <FaSave className="save-icon" />
                  SAVE ENQUIRY
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="reset-enquiry-btn"
                >
                  <FaSyncAlt className="reset-icon" />
                  RESET FORM
                </button>
              </div>
            </form>
          </div>
        </div>
      </LocalizationProvider>

      <style>{`
        .new-enquiry-container {
          padding: 20px 16px;
          background: #f8fafc;
          min-height: calc(100vh - 140px);
          max-width: 1400px;
          margin: 0 auto;
        }

        .enquiry-form-wrapper {
          background: #fff;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }

        .enquiry-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: start;
        }

        .input-group.enquiry-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .enquiry-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }

        /* Attended By Styles */
        .attended-by-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .enquiry-select, .enquiry-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: #fff;
        }

        .enquiry-select:focus, .enquiry-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .toggle-attended-by-btn {
          padding: 12px 16px;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .toggle-attended-by-btn:hover:not(.disabled) {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .toggle-attended-by-btn.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Selection Div Styles */
        .selection-div {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 48px;
        }

        .selection-div:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .selected-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }

        .placeholder-text {
          font-size: 14px;
          color: #9ca3af;
          font-style: italic;
        }

        .search-icon {
          color: #6b7280;
          font-size: 16px;
          transition: color 0.3s ease;
        }

        .selection-div:hover .search-icon {
          color: #3b82f6;
        }

        /* Date Picker Styles */
        .input-group :global(.MuiOutlinedInput-root) {
          border-radius: 12px;
        }

        .input-group :global(.MuiOutlinedInput-input) {
          padding: 12px 14px;
          font-size: 14px;
        }

        /* Action Buttons */
        .enquiry-action-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
        }

        .save-enquiry-btn, .reset-enquiry-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 160px;
          justify-content: center;
        }

        .save-enquiry-btn {
          background: linear-gradient(135deg, #0d4781 0%, #287c77 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(13, 71, 129, 0.2);
        }

        .save-enquiry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 71, 129, 0.3);
          background: linear-gradient(135deg, #0c3d6d 0%, #216a65 100%);
        }

        .reset-enquiry-btn {
          background: #f8fafc;
          color: #475569;
          border: 2px solid #e2e8f0;
        }

        .reset-enquiry-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .save-icon, .reset-icon {
          font-size: 16px;
        }

        .loading-text {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        /* Tablet Styles (768px - 1024px) */
        @media (max-width: 1024px) {
          .new-enquiry-container {
            padding: 16px 12px;
          }

          .enquiry-form-wrapper {
            padding: 24px;
            border-radius: 16px;
          }

          .form-row {
            gap: 20px;
          }

          .enquiry-action-buttons {
            gap: 12px;
          }

          .save-enquiry-btn, .reset-enquiry-btn {
            padding: 12px 24px;
            min-width: 140px;
            font-size: 13px;
          }
        }

        /* Mobile Styles (Below 768px) */
        @media (max-width: 768px) {
          .new-enquiry-container {
            padding: 12px;
          }

          .enquiry-form-wrapper {
            padding: 20px;
            border-radius: 12px;
          }

          .enquiry-form {
            gap: 20px;
            flex-direction: column;
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .input-group.enquiry-input-group {
            width: 100%;
          }

          .attended-by-container {
            flex-direction: column;
            gap: 8px;
          }

          .toggle-attended-by-btn {
            width: 100%;
            padding: 10px 16px;
          }

          .enquiry-action-buttons {
            flex-direction: column;
            gap: 12px;
            margin-top: 20px;
            padding-top: 20px;
          }

          .save-enquiry-btn, .reset-enquiry-btn {
            width: 100%;
            padding: 14px 20px;
            min-width: auto;
          }

          .selection-div {
            min-height: 44px;
            padding: 10px 14px;
          }
        }

        /* Small Mobile Styles (Below 480px) */
        @media (max-width: 480px) {
          .new-enquiry-container {
            padding: 8px;
          }

          .enquiry-form-wrapper {
            padding: 16px;
            border-radius: 10px;
          }

          .enquiry-form {
            gap: 16px;
          }

          .form-row {
            gap: 12px;
          }

          .enquiry-label {
            font-size: 13px;
          }

          .enquiry-select, .enquiry-input, .selection-div {
            padding: 10px 12px;
            font-size: 13px;
          }

          .save-enquiry-btn, .reset-enquiry-btn {
            padding: 12px 16px;
            font-size: 12px;
          }

          .save-icon, .reset-icon {
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
}

export default NewEnquiry;
