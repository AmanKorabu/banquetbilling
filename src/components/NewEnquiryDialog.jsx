// NewEnquiryDialog.jsx - UPDATED WITH INLINE ERROR MESSAGES
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { FaSave, FaSyncAlt, FaTimes, FaExclamationCircle } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";

import { initialDataApi } from "../services/initialDataApi";
import bookingApi from "../services/bookingApi";

const parseToDayjs = (value) => {
  if (!value) return dayjs();
  if (dayjs.isDayjs(value)) return value;

  const str = String(value).trim();
  const parts = str.split("-");

  // DD-MM-YYYY -> YYYY-MM-DD
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    const [dd, mm, yyyy] = parts;
    return dayjs(`${yyyy}-${mm}-${dd}`);
  }

  return dayjs(str);
};

const pick = (obj, keys) =>
  keys.map((k) => obj?.[k]).find((v) => v !== undefined && v !== null && v !== "");

const normalizeList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.result)) return res.result;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.result)) return res.data.result;

  if (res && typeof res === "object") {
    const arr = Object.values(res).find((v) => Array.isArray(v));
    if (arr) return arr;
  }
  return [];
};

const normalizeOne = (res) => {
  const list = normalizeList(res);
  if (list.length) return list[0];

  // sometimes details api returns object directly
  if (res && typeof res === "object" && !Array.isArray(res)) {
    if (res.result && typeof res.result === "object" && !Array.isArray(res.result)) return res.result;
  }
  return null;
};

const pickNameAndId = (type, row) => {
  if (type === "party") {
    return {
      id:
        pick(row, [
          "PartyId",
          "party_id",
          "LedgerId",
          "LedgerID",
          "CustId",
          "CustomerId",
          "id",
          "ID",
        ]) || "",
      name:
        pick(row, [
          "PartyName",
          "party_name",
          "LedgerName",
          "Ledger",
          "CustName",
          "CustomerName",
          "Name",
          "Party",
        ]) || "",
    };
  }

  if (type === "company") {
    return {
      id:
        pick(row, [
          "CompId",
          "CompID",
          "CompanyId",
          "CompanyID",
          "comp_id",
          "LedgerId",
          "LedgerID",
          "id",
          "ID",
        ]) || "",
      name:
        pick(row, [
          "CompanyName",
          "CompName",
          "company_name",
          "LedgerName",
          "Ledger",
          "Name",
          "Company",
        ]) || "",
    };
  }

  // function
  return {
    id:
      pick(row, [
        "FunctionId",
        "FuncId",
        "function_id",
        "LedgerId",
        "LedgerID",
        "id",
        "ID",
      ]) || "",
    name:
      pick(row, [
        "FunctionName",
        "FuncName",
        "function_name",
        "LedgerName",
        "Ledger",
        "Name",
        "Function",
        "Occasion",
      ]) || "",
  };
};

function NewEnquiryDialog({ open, onClose, onSuccess, editData = null }) {
  const isEditMode = !!editData;

  const [formData, setFormData] = useState({
    attendedById: "",
    attendedByName: "",
    bookingFromDate: dayjs(),
    bookingToDate: dayjs(),
    partyName: "",
    partyId: "",
    companyName: "",
    companyId: "",
    functionName: "",
    functionId: "",
  });

  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [showOtherAttendedBy, setShowOtherAttendedBy] = useState(false);
  const [otherAttendedByValue, setOtherAttendedByValue] = useState("");
  const [dateValidation, setDateValidation] = useState({ isValid: true, error: null });
  
  // search popup
  const [searchType, setSearchType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // details loading
  const [loadingDetails, setLoadingDetails] = useState(false);

  // NEW: Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    attendedBy: "",
    partyName: "",
    companyName: "",
    functionName: "",
    dateRange: ""
  });

  const attendedByRef = useRef(null);
  // const partyRef = useRef(null);
  // const companyRef = useRef(null);
  // const functionRef = useRef(null);

  const validateDateRange = useCallback((from, to) => {
    if (!from || !to) return { isValid: true, error: null };
    const fromDate = dayjs(from);
    const toDate = dayjs(to);
    const isValid = toDate.isAfter(fromDate) || toDate.isSame(fromDate, "day");
    return {
      isValid,
      error: isValid ? null : "Booking To date cannot be earlier than Booking From date",
    };
  }, []);

  // Clear validation errors when form changes
  useEffect(() => {
    setValidationErrors({
      attendedBy: "",
      partyName: "",
      companyName: "",
      functionName: "",
      dateRange: ""
    });
  }, [formData]);

  // Load attendees and initialize form
  useEffect(() => {
    if (!open) return;

    const loadAttendees = async () => {
      try {
        setLoadingAttendees(true);
        const initialData = await initialDataApi.getInitialData();
        
        let attendeesData = [];
        if (Array.isArray(initialData?.attendees)) attendeesData = initialData.attendees;
        else if (Array.isArray(initialData?.data?.attendees)) attendeesData = initialData.data.attendees;
        else if (Array.isArray(initialData)) attendeesData = initialData;

        if (attendeesData.length === 0) {
          attendeesData = [
            { Userid: 1, Name: "Manager" },
            { Userid: 2, Name: "Sales Executive" },
            { Userid: 3, Name: "Reception" },
          ];
        }

        setAttendees(attendeesData);
        return attendeesData;
      } catch (err) {
        console.error("❌ Error fetching attendees:", err);
        toast.error("Failed to load attendees.", { toastId: "load-attendees-error" });
        return [
          { Userid: 1, Name: "Manager" },
          { Userid: 2, Name: "Sales Executive" },
        ];
      } finally {
        setLoadingAttendees(false);
      }
    };

    const initializeForm = async () => {
      const attendeesList = await loadAttendees();
      
      if (editData) {
        const p = pickNameAndId("party", editData);
        const c = pickNameAndId("company", editData);
        const f = pickNameAndId("function", editData);

        const attendedName = String(
          pick(editData, [
            "AttendedBy", 
            "attended_by", 
            "AttendedByName", 
            "attended_by_name",
            "AttendedBy_Name",
            "Attended_By"
          ]) || ""
        ).trim();

        const attendedId = String(
          pick(editData, [
            "AttendedById", 
            "AttendedByID", 
            "attended_by_id", 
            "Userid", 
            "UserId",
            "UserID",
            "AttendedBy_Id"
          ]) || ""
        ).trim();

        let isInAttendees = false;
        let actualAttendedId = attendedId;
        let actualAttendedName = attendedName;
        
        if (attendedName && attendeesList.length > 0) {
          const found = attendeesList.find((a) => 
            String(a.Name || "").trim().toLowerCase() === attendedName.toLowerCase()
          );
          
          if (found) {
            isInAttendees = true;
            actualAttendedId = String(found.Userid || found.id || "");
            actualAttendedName = String(found.Name || "").trim();
          }
        }

        setFormData({
          attendedById: actualAttendedId,
          attendedByName: actualAttendedName,
          bookingFromDate: editData.FunctionFrom ? parseToDayjs(editData.FunctionFrom) : dayjs(),
          bookingToDate: editData.FunctionTo ? parseToDayjs(editData.FunctionTo) : dayjs(),
          partyName: String(p.name || "").trim(),
          partyId: String(p.id || "").trim(),
          companyName: String(c.name || "").trim(),
          companyId: String(c.id || "").trim(),
          functionName: String(f.name || "").trim(),
          functionId: String(f.id || "").trim(),
        });

        setShowOtherAttendedBy(!isInAttendees);
        setOtherAttendedByValue(isInAttendees ? "" : attendedName);
      } else {
        setFormData({
          attendedById: "",
          attendedByName: "",
          bookingFromDate: dayjs(),
          bookingToDate: dayjs(),
          partyName: "",
          partyId: "",
          companyName: "",
          companyId: "",
          functionName: "",
          functionId: "",
        });
        setShowOtherAttendedBy(false);
        setOtherAttendedByValue("");
      }
      
      // Clear validation errors when opening
      setValidationErrors({
        attendedBy: "",
        partyName: "",
        companyName: "",
        functionName: "",
        dateRange: ""
      });
    };

    initializeForm();
    
    setSearchType(null);
    setSearchQuery("");
    setSearchResults([]);
    setSearchLoading(false);
  }, [open, editData]);

  // Edit mode details loading
  useEffect(() => {
    if (!open) return;
    if (!isEditMode) return;

    const quotationId = editData?.QuotationId || editData?.quot_id || editData?.enq_id;
    if (!quotationId) return;

    let alive = true;

    (async () => {
      try {
        setLoadingDetails(true);
        const hotelId = localStorage.getItem("hotel_id") || "";
        if (!hotelId) return;

        const detailsRes = await bookingApi.getQuotationDetails(hotelId, quotationId);
        const row = normalizeOne(detailsRes);
        if (!row || !alive) return;

        const p = pickNameAndId("party", row);
        const c = pickNameAndId("company", row);
        const f = pickNameAndId("function", row);

        const attendedName = String(
          pick(row, [
            "AttendedBy", 
            "attended_by", 
            "AttendedByName", 
            "attended_by_name", 
            "Name",
            "AttendedBy_Name"
          ]) || ""
        ).trim();

        const attendedId = String(
          pick(row, [
            "AttendedById", 
            "AttendedByID", 
            "attended_by_id", 
            "Userid", 
            "UserId",
            "UserID"
          ]) || ""
        ).trim();

        const fromD = pick(row, ["FunctionFrom", "function_from", "from_date", "booking_date"]);
        const toD = pick(row, ["FunctionTo", "function_to", "to_date", "booking_date_to"]);

        setFormData((prev) => ({
          ...prev,
          partyName: prev.partyName || String(p.name || "").trim(),
          partyId: prev.partyId || String(p.id || "").trim(),
          companyName: prev.companyName || String(c.name || "").trim(),
          companyId: prev.companyId || String(c.id || "").trim(),
          functionName: prev.functionName || String(f.name || "").trim(),
          functionId: prev.functionId || String(f.id || "").trim(),
          bookingFromDate: prev.bookingFromDate || (fromD ? parseToDayjs(fromD) : dayjs()),
          bookingToDate: prev.bookingToDate || (toD ? parseToDayjs(toD) : dayjs()),
        }));

        if (attendedName || attendedId) {
          const found = attendees.find((a) => 
            String(a.Name || "").trim().toLowerCase() === attendedName.toLowerCase()
          );
          
          if (found) {
            setShowOtherAttendedBy(false);
            setFormData((prev) => ({
              ...prev,
              attendedByName: String(found.Name || "").trim(),
              attendedById: String(found.Userid || found.id || ""),
            }));
          } else if (attendedName) {
            setShowOtherAttendedBy(true);
            setOtherAttendedByValue(attendedName);
            setFormData((prev) => ({
              ...prev,
              attendedByName: attendedName,
              attendedById: "",
            }));
          }
        }
      } catch (e) {
        console.warn("Details load failed:", e?.message || e);
      } finally {
        if (alive) setLoadingDetails(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, isEditMode, editData, attendees]);

  // Validate dates
  useEffect(() => {
    const v = validateDateRange(formData.bookingFromDate, formData.bookingToDate);
    setDateValidation(v);
  }, [formData.bookingFromDate, formData.bookingToDate, validateDateRange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.target.form;
      const index = Array.prototype.indexOf.call(form, e.target);
      const next = form.elements[index + 1];
      next?.focus();
    }
  }, []);

  // Attended by dropdown change
  const handleAttendedBySelect = useCallback(
    (e) => {
      const selectedId = e.target.value;
      const found = attendees.find((a) => String(a.Userid) === String(selectedId));
      const name = found?.Name ? String(found.Name).trim() : "";

      setShowOtherAttendedBy(false);
      setOtherAttendedByValue("");

      setFormData((prev) => ({
        ...prev,
        attendedById: String(selectedId || ""),
        attendedByName: name,
      }));

      // Clear validation error
      setValidationErrors(prev => ({ ...prev, attendedBy: "" }));
    },
    [attendees]
  );

  // Other attended by change
  const handleOtherAttendedByChange = useCallback((e) => {
    const value = e.target.value;
    setOtherAttendedByValue(value);
    setFormData((prev) => ({ 
      ...prev, 
      attendedByName: value, 
      attendedById: "" 
    }));
    
    // Clear validation error
    if (value.trim()) {
      setValidationErrors(prev => ({ ...prev, attendedBy: "" }));
    }
  }, []);

  // Toggle between dropdown and "Other"
  const handleToggleAttendedBy = useCallback(() => {
    const nextMode = !showOtherAttendedBy;
    setShowOtherAttendedBy(nextMode);

    if (nextMode) {
      setOtherAttendedByValue(formData.attendedByName || "");
      setFormData((prev) => ({ ...prev, attendedById: "" }));
      
      setTimeout(() => {
        const input = document.querySelector(".other-attended-by-input");
        input?.focus();
      }, 50);
    } else {
      setOtherAttendedByValue("");
    }
  }, [showOtherAttendedBy, formData.attendedByName]);

  // Get current attended by display value
  const getAttendedByDisplayValue = useCallback(() => {
    if (showOtherAttendedBy) {
      return otherAttendedByValue;
    } else {
      const found = attendees.find(a => String(a.Userid) === String(formData.attendedById));
      return found?.Name || formData.attendedByName || "";
    }
  }, [showOtherAttendedBy, otherAttendedByValue, attendees, formData.attendedById, formData.attendedByName]);

  // Search popup functions
  const closeSearch = useCallback(() => {
    setSearchType(null);
    setSearchQuery("");
    setSearchResults([]);
    setSearchLoading(false);
  }, []);

  const openSearch = useCallback((type) => {
    setSearchType(type);
    setSearchQuery("");
    setSearchResults([]);
    setSearchLoading(false);
  }, []);

  // Search API call
  useEffect(() => {
    if (!searchType) return;

    const t = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const apiQ = searchQuery?.trim() ? searchQuery.trim() : "a";

        let res;
        if (searchType === "party") res = await bookingApi.searchParties(apiQ);
        if (searchType === "company") res = await bookingApi.searchCompanies(apiQ);
        if (searchType === "function") res = await bookingApi.searchFunctions(apiQ);

        setSearchResults(normalizeList(res));
      } catch (e) {
        console.error("❌ Search popup API error:", e);
        setSearchResults([]);
        toast.error("Failed to load list");
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [searchType, searchQuery]);

  const visibleResults = useMemo(() => {
    if (!searchType) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchResults;

    return searchResults.filter((row) => {
      const { name } = pickNameAndId(searchType, row);
      return String(name || "").toLowerCase().includes(q);
    });
  }, [searchResults, searchQuery, searchType]);

  const applySelection = useCallback(
    (row) => {
      if (!searchType) return;

      const { name, id } = pickNameAndId(searchType, row);

      if (!name) {
        toast.error("Name not found from API row");
        return;
      }

      setFormData((prev) => {
        if (searchType === "party") return { ...prev, partyName: name, partyId: id };
        if (searchType === "company") return { ...prev, companyName: name, companyId: id };
        return { ...prev, functionName: name, functionId: id };
      });

      // Clear validation error for the selected field
      const fieldName = searchType === "party" ? "partyName" : 
                       searchType === "company" ? "companyName" : "functionName";
      setValidationErrors(prev => ({ ...prev, [fieldName]: "" }));

      closeSearch();
    },
    [searchType, closeSearch]
  );

  // ESC handler
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key !== "Escape") return;
      if (!open) return;
      if (searchType) closeSearch();
      else onClose();
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keyup", onEsc);
  }, [open, searchType, closeSearch, onClose]);

  // NEW: Validation function with inline errors
  const validateForm = useCallback(() => {
    const errors = {
      attendedBy: "",
      partyName: "",
      companyName: "",
      functionName: "",
      dateRange: ""
    };

    let isValid = true;

    // Validate Attended By
    if (!String(formData.attendedByName || "").trim()) {
      errors.attendedBy = "Please select or enter Attended By";
      isValid = false;
      attendedByRef.current?.focus();
    }

    // Validate Party Name
    if (!String(formData.partyName || "").trim()) {
      errors.partyName = "Please select Party Name";
      isValid = false;
    }

    // Validate Company Name (optional - comment out if not required)
    // if (!String(formData.companyName || "").trim()) {
    //   errors.companyName = "Please select Company Name";
    //   isValid = false;
    // }

    // Validate Function Name
    if (!String(formData.functionName || "").trim()) {
      errors.functionName = "Please select Function Name";
      isValid = false;
    }

    // Validate Date Range
    if (!dateValidation.isValid) {
      errors.dateRange = dateValidation.error;
      isValid = false;
    }

    setValidationErrors(errors);
    
    // Scroll to first error
    if (!isValid) {
      const firstErrorField = Object.keys(errors).find(key => errors[key]);
      if (firstErrorField) {
        const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }

    return isValid;
  }, [formData, dateValidation]);

  // Resolve IDs by name
  const resolveIdByName = useCallback(async (type, name) => {
    const q = String(name || "").trim();
    if (!q) return "";

    try {
      let res;
      if (type === "company") res = await bookingApi.searchCompanies(q);
      if (type === "function") res = await bookingApi.searchFunctions(q);
      if (type === "party") res = await bookingApi.searchParties(q);

      const list = normalizeList(res);
      if (!list.length) return "";

      const exact = list.find((r) => {
        const { name: n } = pickNameAndId(type, r);
        return String(n || "").trim().toLowerCase() === q.toLowerCase();
      });

      const best = exact || list[0];
      return String(pickNameAndId(type, best).id || "");
    } catch {
      return "";
    }
  }, []);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    const safeFormat = (date) =>
      date && dayjs(date).isValid() ? dayjs(date).format("DD-MM-YYYY") : "";
    const safeTimeFormat = (date) =>
      date && dayjs(date).isValid() ? dayjs(date).format("HH:mm:ss") : "00:00:00";

    const userId = localStorage.getItem("user_id") || "";
    const hotelId = localStorage.getItem("hotel_id") || "";
    if (!hotelId) {
      toast.error("No hotel selected. Please login again.");
      return;
    }

    const enquiryId = isEditMode ? String(editData?.QuotationId || editData?.quot_id || "") : "0";

    // Resolve missing IDs
    let companyId = String(formData.companyId || "").trim();
    let functionId = String(formData.functionId || "").trim();
    let partyId = String(formData.partyId || "").trim();

    if (!companyId && formData.companyName) {
      companyId = await resolveIdByName("company", formData.companyName);
    }
    if (!functionId && formData.functionName) {
      functionId = await resolveIdByName("function", formData.functionName);
    }
    if (!partyId && formData.partyName) {
      partyId = await resolveIdByName("party", formData.partyName);
    }

    let attendedByIdToSend = "";
    let attendedByNameToSend = String(formData.attendedByName || "").trim();
    
    if (!showOtherAttendedBy && formData.attendedById) {
      attendedByIdToSend = String(formData.attendedById);
    }

    const requestBody = {
      user_id: userId,
      hotel_id: hotelId,
      booking_date: safeFormat(formData.bookingFromDate),
      booking_date_to: safeFormat(formData.bookingToDate),
      comp_id: companyId || "0",
      comp_name: formData.companyName || "",
      function_id: functionId || "0",
      function_name: formData.functionName || "",
      party_details: {
        party_id: partyId || "0",
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
      function_details: {
        occasion: formData.functionName || "",
        function_time: "00:00:00",
        guest_name: formData.partyName || "",
        designation: "Host",
        arrival_time: "00:00:00",
        instruction: "",
      },
      events: [
        {
          sel_event_id: "",
          event_name: formData.functionName || "",
          event_date: safeFormat(formData.bookingFromDate),
          from_time: "00:00:00",
          to_time: "00:00:00",
          status_name: "Enquiry",
          event_menus: [],
          event_package_menus: [],
          menu_itms_arr: [],
        },
      ],
      quot_id: isEditMode ? enquiryId : "0",
      attended_by: attendedByNameToSend,
      attended_by_id: attendedByIdToSend,
      from_list: 1,
      entry_date: safeFormat(dayjs()),
      entry_time: safeTimeFormat(dayjs()),
      enquiry: 1,
      AddedFrom: "E",
    };


    try {
      const response = await bookingApi.submitBooking(requestBody);

      if (response?.success || response?.status === "success" || response?.status === "ok") {
        toast.success(isEditMode ? "Enquiry updated successfully! ✅" : "Enquiry saved successfully! ✅");
        onSuccess?.();
        onClose();
      } else {
        toast.error(response?.message || response?.error || "Failed to save enquiry.");
      }
    } catch (error) {
      console.error("❌ Error saving enquiry:", error);
      toast.error("Failed to save enquiry. Please try again.");
    }
  }, [validateForm, formData, isEditMode, editData, showOtherAttendedBy, onSuccess, onClose, resolveIdByName]);

  const handleResetForm = useCallback(() => {
    setFormData({
      attendedById: "",
      attendedByName: "",
      bookingFromDate: dayjs(),
      bookingToDate: dayjs(),
      partyName: "",
      partyId: "",
      companyName: "",
      companyId: "",
      functionName: "",
      functionId: "",
    });
    setShowOtherAttendedBy(false);
    setOtherAttendedByValue("");
    setValidationErrors({
      attendedBy: "",
      partyName: "",
      companyName: "",
      functionName: "",
      dateRange: ""
    });
    toast.info("Form has been reset 🔄");
  }, []);

  const datePickerProps = {
    format: "DD-MM-YYYY",
    slotProps: {
      textField: {
        onKeyDown: handleKeyDown,
        size: "small",
        style: { width: "100%" },
        error: !dateValidation.isValid,
      },
    },
  };

  if (!open) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="new-enquiry-dialog-overlay">
        <div className="new-enquiry-dialog">
          <div className="dialog-header">
            <h2>
              {isEditMode
                ? `Edit Enquiry${editData?.QuotationNo ? ` #${editData.QuotationNo}` : ""}`
                : "Add New Enquiry"}
              {loadingDetails ? " (Loading details...)" : ""}
            </h2>
            <button className="close-dialog-btn" onClick={onClose} type="button">
              <FaTimes />
            </button>
          </div>

          <div className="dialog-content">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="enquiry-form"
            >
              <div className="form-row">
                {/* Attended By Field */}
                <div className="input-group enquiry-input-group" data-field="attendedBy">
                  <label className="enquiry-label">
                    Attended By
                    {validationErrors.attendedBy && (
                      <span className="required-asterisk"> *</span>
                    )}
                  </label>

                  <div className="attended-by-container">
                    {!showOtherAttendedBy ? (
                      <select
                        value={formData.attendedById}
                        onChange={handleAttendedBySelect}
                        onKeyDown={handleKeyDown}
                        ref={attendedByRef}
                        disabled={loadingAttendees}
                        className={`enquiry-select ${validationErrors.attendedBy ? 'error-border' : ''}`}
                      >
                        <option value="" hidden>
                          {loadingAttendees ? "Loading attendees..." : "Select Attended By"}
                        </option>
                        {attendees.map((a) => (
                          <option key={a.Userid || a.id || a.Name} value={String(a.Userid || a.id || "")}>
                            {a.Name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className={`other-attended-by-input enquiry-input ${validationErrors.attendedBy ? 'error-border' : ''}`}
                        value={otherAttendedByValue}
                        onChange={handleOtherAttendedByChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter attended by name"
                        ref={attendedByRef}
                      />
                    )}

                    <button
                      type="button"
                      onClick={handleToggleAttendedBy}
                      disabled={loadingAttendees}
                      className={`toggle-attended-by-btn ${loadingAttendees ? "disabled" : ""}`}
                    >
                      {loadingAttendees ? "..." : showOtherAttendedBy ? "LIST" : "OTHER"}
                    </button>
                  </div>

                  {validationErrors.attendedBy && (
                    <div className="validation-error">
                      <FaExclamationCircle className="error-icon" />
                      <span className="error-text">{validationErrors.attendedBy}</span>
                    </div>
                  )}

                  <div className="attended-by-display">
                    <small>Current: {getAttendedByDisplayValue() || "(Not set)"}</small>
                  </div>

                  {loadingAttendees && <p className="loading-text">Loading attendees...</p>}
                </div>

                {/* Booking From Date */}
                <div className="input-group enquiry-input-group">
                  <label className="enquiry-label">Booking From</label>
                  <DatePicker
                    label="Select Date"
                    value={formData.bookingFromDate}
                    onChange={(d) =>
                      setFormData((prev) => {
                        const next = { ...prev, bookingFromDate: d };
                        const v = validateDateRange(d, prev.bookingToDate);
                        setDateValidation(v);
                        if (!v.isValid) next.bookingToDate = d;
                        return next;
                      })
                    }
                    {...datePickerProps}
                  />
                </div>

                {/* Booking To Date */}
                <div className="input-group enquiry-input-group" data-field="dateRange">
                  <label className="enquiry-label">
                    Booking To
                    {validationErrors.dateRange && (
                      <span className="required-asterisk"> *</span>
                    )}
                  </label>
                  <DatePicker
                    label="Select Date"
                    value={formData.bookingToDate}
                    onChange={(d) => {
                      setFormData((prev) => ({ ...prev, bookingToDate: d }));
                      const v = validateDateRange(formData.bookingFromDate, d);
                      setDateValidation(v);
                    }}
                    minDate={formData.bookingFromDate}
                    {...datePickerProps}
                  />

                  {!dateValidation.isValid && (
                    <div className="date-validation-error">
                      <FaExclamationCircle className="error-icon" />
                      <span className="error-message">{dateValidation.error}</span>
                    </div>
                  )}

                  {validationErrors.dateRange && !dateValidation.isValid && (
                    <div className="validation-error">
                      <FaExclamationCircle className="error-icon" />
                      <span className="error-text">{validationErrors.dateRange}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                {/* Party Name Field */}
                <div className="input-group enquiry-input-group" data-field="partyName">
                  <label className="enquiry-label">
                    Party Name
                    {validationErrors.partyName && (
                      <span className="required-asterisk"> *</span>
                    )}
                  </label>
                  <div 
                    onClick={() => openSearch("party")} 
                    className={`selection-div ${validationErrors.partyName ? 'error-border' : ''}`} 
                    role="button" 
                    tabIndex={0}
                  >
                    {formData.partyName ? (
                      <span className="selected-value">{formData.partyName}</span>
                    ) : (
                      <span className="placeholder-text">Select Party Name</span>
                    )}
                    <IoSearch className="search-icon" />
                  </div>
                  {validationErrors.partyName && (
                    <div className="validation-error">
                      <FaExclamationCircle className="error-icon" />
                      <span className="error-text">{validationErrors.partyName}</span>
                    </div>
                  )}
                </div>

                {/* Company Name Field */}
                <div className="input-group enquiry-input-group" data-field="companyName">
                  <label className="enquiry-label">
                    Company Name
                    {validationErrors.companyName && (
                      <span className="required-asterisk"> *</span>
                    )}
                  </label>
                  <div 
                    onClick={() => openSearch("company")} 
                    className={`selection-div ${validationErrors.companyName ? 'error-border' : ''}`} 
                    role="button" 
                    tabIndex={0}
                  >
                    {formData.companyName ? (
                      <span className="selected-value">{formData.companyName}</span>
                    ) : (
                      <span className="placeholder-text">Select Company Name</span>
                    )}
                    <IoSearch className="search-icon" />
                  </div>
                  {validationErrors.companyName && (
                    <div className="validation-error">
                      <FaExclamationCircle className="error-icon" />
                      <span className="error-text">{validationErrors.companyName}</span>
                    </div>
                  )}
                </div>

                {/* Function Name Field */}
                <div className="input-group enquiry-input-group" data-field="functionName">
                  <label className="enquiry-label">
                    Function Name
                    {validationErrors.functionName && (
                      <span className="required-asterisk"> *</span>
                    )}
                  </label>
                  <div 
                    onClick={() => openSearch("function")} 
                    className={`selection-div ${validationErrors.functionName ? 'error-border' : ''}`} 
                    role="button" 
                    tabIndex={0}
                  >
                    {formData.functionName ? (
                      <span className="selected-value">{formData.functionName}</span>
                    ) : (
                      <span className="placeholder-text">Select Function Name</span>
                    )}
                    <IoSearch className="search-icon" />
                  </div>
                  {validationErrors.functionName && (
                    <div className="validation-error">
                      <FaExclamationCircle className="error-icon" />
                      <span className="error-text">{validationErrors.functionName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Summary - Shows all errors at once */}
              {Object.values(validationErrors).some(error => error) && (
                <div className="validation-summary">
                  <h4>
                    <FaExclamationCircle />
                    Please fix the following errors:
                  </h4>
                  <ul>
                    {validationErrors.attendedBy && <li>{validationErrors.attendedBy}</li>}
                    {validationErrors.partyName && <li>{validationErrors.partyName}</li>}
                    {validationErrors.companyName && <li>{validationErrors.companyName}</li>}
                    {validationErrors.functionName && <li>{validationErrors.functionName}</li>}
                    {validationErrors.dateRange && <li>{validationErrors.dateRange}</li>}
                  </ul>
                </div>
              )}

              <div className="enquiry-action-buttons">
                <button type="button" onClick={handleSubmit} className="save-enquiry-btn">
                  <FaSave />
                  {isEditMode ? "UPDATE ENQUIRY" : "SAVE ENQUIRY"}
                </button>

                <button type="button" onClick={handleResetForm} className="reset-enquiry-btn">
                  <FaSyncAlt />
                  RESET FORM
                </button>

                <button type="button" onClick={onClose} className="cancel-enquiry-btn">
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SEARCH POPUP */}
      {searchType && (
        <div className="lookup-overlay" onMouseDown={closeSearch}>
          <div className="lookup-box" onMouseDown={(e) => e.stopPropagation()}>
            <div className="lookup-header">
              <h3>
                Select {searchType === "party" ? "Party" : searchType === "company" ? "Company" : "Function"}
              </h3>
              <button className="lookup-close" onClick={closeSearch} type="button">
                <FaTimes />
              </button>
            </div>

            <div className="lookup-searchbar">
              <input
                className="lookup-input"
                placeholder={`Search ${searchType}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <div className="lookup-hint">{searchLoading ? "Loading..." : `${visibleResults.length} result(s)`}</div>
            </div>

            <div className="lookup-list">
              {searchLoading ? (
                <div className="lookup-loading">Loading...</div>
              ) : visibleResults.length === 0 ? (
                <div className="lookup-empty">No results</div>
              ) : (
                visibleResults.map((row, idx) => {
                  const { name, id } = pickNameAndId(searchType, row);
                  return (
                    <div
                      key={`${id || "x"}-${idx}`}
                      className="lookup-item"
                      onClick={() => applySelection(row)}
                      title={name}
                    >
                      {name || "(No Name)"}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .new-enquiry-dialog-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .new-enquiry-dialog {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          background: linear-gradient(135deg, #0d4781 0%, #287c77 100%);
          color: white;
        }

        .dialog-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .close-dialog-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.25s ease;
        }

        .close-dialog-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .dialog-content {
          padding: 30px;
          overflow-y: auto;
          flex: 1;
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
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .required-asterisk {
          color: #dc2626;
          font-weight: bold;
        }

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
          transition: all 0.2s ease;
          background: #fff;
        }

        .enquiry-select:focus, .enquiry-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }

        .error-border {
          border-color: #dc2626 !important;
          background-color: #fef2f2 !important;
        }

        .error-border:focus {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
        }

        .toggle-attended-by-btn {
          padding: 12px 16px;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
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

        .attended-by-display {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          min-height: 20px;
        }

        .attended-by-display small {
          color: #4b5563;
          font-weight: 500;
        }

        .loading-text {
          font-size: 12px;
          color: #6b7280;
          margin: 2px 0 0;
        }

        .selection-div {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 48px;
          user-select: none;
        }

        .selection-div:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .selected-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 600;
        }

        .placeholder-text {
          font-size: 14px;
          color: #9ca3af;
          font-style: italic;
        }

        .search-icon {
          color: #6b7280;
          font-size: 16px;
          transition: color 0.2s ease;
        }

        .selection-div:hover .search-icon {
          color: #3b82f6;
        }

        /* Validation Error Styles */
        .validation-error {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #fef2f2;
          border-radius: 8px;
          border-left: 3px solid #dc2626;
          margin-top: 4px;
          animation: fadeIn 0.3s ease;
        }

        .error-icon {
          color: #dc2626;
          font-size: 14px;
          flex-shrink: 0;
        }

        .error-text {
          color: #dc2626;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
        }

        .date-validation-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 13px;
          margin-top: 8px;
        }

        /* Validation Summary */
        .validation-summary {
          padding: 16px;
          background: #fef2f2;
          border-radius: 12px;
          border-left: 4px solid #dc2626;
          animation: fadeIn 0.3s ease;
        }

        .validation-summary h4 {
          margin: 0 0 10px 0;
          color: #dc2626;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .validation-summary ul {
          margin: 0;
          padding-left: 20px;
        }

        .validation-summary li {
          color: #b91c1c;
          font-size: 13px;
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .validation-summary li:last-child {
          margin-bottom: 0;
        }

        .enquiry-action-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
        }

        .save-enquiry-btn, .reset-enquiry-btn, .cancel-enquiry-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 160px;
          justify-content: center;
        }

        .save-enquiry-btn {
          background: linear-gradient(135deg, #0d4781 0%, #287c77 100%);
          color: white;
          box-shadow: 0 6px 16px rgba(13, 71, 129, 0.18);
        }

        .save-enquiry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 71, 129, 0.25);
        }

        .reset-enquiry-btn {
          background: #f8fafc;
          color: #475569;
          border: 2px solid #e2e8f0;
        }

        .reset-enquiry-btn:hover {
          background: #e2e8f0;
          transform: translateY(-2px);
        }

        .cancel-enquiry-btn {
          background: #fef2f2;
          color: #dc2626;
          border: 2px solid #fecaca;
        }

        .cancel-enquiry-btn:hover {
          background: #fee2e2;
          transform: translateY(-2px);
        }

        .lookup-overlay{
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 11000;
          padding: 16px;
        }

        .lookup-box{
          width: 100%;
          max-width: 560px;
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,.30);
        }

        .lookup-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 14px 16px;
          background: #0f172a;
          color: #fff;
        }

        .lookup-header h3{
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }

        .lookup-close{
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          background: rgba(255,255,255,.15);
          color: #fff;
          cursor: pointer;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .lookup-searchbar{
          display:flex;
          align-items:center;
          gap: 10px;
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .lookup-input{
          flex: 1;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          outline: none;
          padding: 10px 12px;
          font-size: 14px;
        }

        .lookup-hint{
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
        }

        .lookup-list{
          max-height: 55vh;
          overflow: auto;
        }

        .lookup-item{
          padding: 12px 14px;
          cursor: pointer;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }

        .lookup-item:hover{
          background: #f8fafc;
        }

        .lookup-loading,
        .lookup-empty{
          padding: 14px;
          color: #64748b;
          font-size: 14px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .form-row { 
            grid-template-columns: 1fr; 
            gap: 16px; 
          }
          .attended-by-container { 
            flex-direction: column; 
          }
          .toggle-attended-by-btn { 
            width: 100%; 
          }
          .enquiry-action-buttons { 
            flex-direction: column; 
          }
          .save-enquiry-btn, .reset-enquiry-btn, .cancel-enquiry-btn {
            width: 100%;
            min-width: auto;
          }
          .validation-summary {
            padding: 12px;
          }
        }

        @media (max-width: 480px) {
          .dialog-content {
            padding: 20px;
          }
          .dialog-header {
            padding: 16px 20px;
          }
          .dialog-header h2 {
            font-size: 16px;
          }
        }
      `}</style>
    </LocalizationProvider>
  );
}

export default NewEnquiryDialog;