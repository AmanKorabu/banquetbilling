import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Calendar,
    DollarSign,
    Filter,
    Eye,
    AlertCircle,
    Search,
    FileText,
    RefreshCw,
    X,
    Building,
    CalendarOff,
    AlertTriangle,
    Trash,
    Edit,
    SlidersHorizontal,
    ChevronRight,
    CheckCircle,
    Clock,
    Users,
    Percent,
    Hotel,
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isValid, isBefore, isAfter, addDays, startOfDay, endOfDay } from 'date-fns';
import Header from './Header';
import useEscapeNavigate from '../hooks/EscapeNavigate';
import { toast } from 'react-toastify';

const UnsettledBill = () => {
    const [bills, setBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEscapeNavigate('/dashboard')

    // Dynamic hotel_id - can be from props, context, or localStorage
    const [hotelId, setHotelId] = useState(() => {
        // Try to get from localStorage, URL params, or context
        return localStorage.getItem('hotel_id'); // Default fallback
    });

    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        status: 'all',
        searchTerm: '',
        sortBy: 'date',
        sortOrder: 'desc',
        loadAll: false,
        venueId: '0',
        compId: '0',
        partyId: '0'
    });

    const [searchInput, setSearchInput] = useState('');
    const [dateError, setDateError] = useState('');
    const [selectedBill, setSelectedBill] = useState(null);
    const [showBillModal, setShowBillModal] = useState(false);
    const [showFilters, setShowFilters] = useState(window.innerWidth >= 1024);
    const [isMobile, setIsMobile] = useState(false);
    const [hotels, setHotels] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState(null);

    // Delete popup state
    const [deletePopup, setDeletePopup] = useState({
        isOpen: false,
        bill: null,
        reason: "",
        loading: false
    });

    // Construct dynamic API URL
    const getApiUrl = useCallback(() => {
        const baseUrl = '/banquetapi/get_unsettled_bill_list_all.php';
        const params = new URLSearchParams({
            hotel_id: hotelId,
            venue_id: filters.venueId,
            comp_id: filters.compId,
            party_id: filters.partyId
        });
        return `${baseUrl}?${params.toString()}`;
    }, [hotelId, filters.venueId, filters.compId, filters.partyId]);

    // Check mobile view on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Auto-show filters on desktop, hide on mobile
            setShowFilters(!mobile);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch available hotels (optional - if you have a hotels API)
    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        try {
            // Replace with your actual hotels API endpoint
            const response = await axios.get('/api/hotels', {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (response.data && response.data.result) {
                setHotels(response.data.result);
                // Set default hotel if not already set
                if (response.data.result.length > 0 && !hotelId) {
                    const defaultHotel = response.data.result[0];
                    setHotelId(defaultHotel.id);
                    setSelectedHotel(defaultHotel);
                }
            }
        } catch (err) {
            console.log('Could not fetch hotels list, using default', err);
        }
    };

    // Set default dates on mount
    useEffect(() => {
        const defaultDates = setDefaultDates();
        setFilters(prev => ({
            ...prev,
            fromDate: defaultDates.fromDate,
            toDate: defaultDates.toDate
        }));
        fetchBills();
    }, [hotelId]); // Refetch when hotel changes

    // Apply filters when bills or filters change
    useEffect(() => {
        applyFilters();
    }, [bills, filters]);

    // Floor function helper
    const floorValue = (value) => {
        return Math.floor(parseFloat(value) || 0);
    };

    // Parse date string from API format
    const parseDateString = useCallback((dateStr) => {
        if (!dateStr) return new Date();

        try {
            const cleanedStr = dateStr.trim();

            if (cleanedStr.includes('-')) {
                const datePart = cleanedStr.split(' ')[0];
                const [day, month, year] = datePart.split('-').map(Number);

                if (isNaN(day) || isNaN(month) || isNaN(year)) {
                    throw new Error('Invalid date format');
                }

                let hour = 0, minute = 0;
                if (cleanedStr.includes(':')) {
                    const timeMatch = cleanedStr.match(/(\d{1,2}):(\d{2})/);
                    if (timeMatch) {
                        hour = parseInt(timeMatch[1]);
                        minute = parseInt(timeMatch[2]);

                        if (cleanedStr.toLowerCase().includes('pm') && hour < 12) {
                            hour += 12;
                        } else if (cleanedStr.toLowerCase().includes('am') && hour === 12) {
                            hour = 0;
                        }
                    }
                }

                const dateObj = new Date(year, month - 1, day, hour, minute);
                if (isValid(dateObj)) return dateObj;
            }

            const isoDate = parseISO(cleanedStr);
            if (isValid(isoDate)) return isoDate;

            return new Date();
        } catch (err) {
            console.error('Error parsing date:', dateStr, err);
            return new Date();
        }
    }, []);

    // Format date for display
    const formatDateDisplay = (date) => {
        try {
            if (!isValid(date)) return 'Invalid Date';
            return format(date, 'dd-MM-yyyy');
        } catch (err) {
            console.error('Error formatting date:', err);
            return 'Invalid Date';
        }
    };

    // Format time for display
    const formatTimeDisplay = (date) => {
        try {
            if (!isValid(date)) return 'Invalid Time';
            return format(date, 'hh:mm a');
        } catch (err) {
            console.error('Error formatting time:', err);
            return 'Invalid Time';
        }
    };

    // Parse from dd-MM-yyyy to Date object
    const parseDateFromDDMMYYYY = (dateStr) => {
        if (!dateStr) return null;
        try {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        } catch (err) {
            console.error('Error parsing date:', err);
            return null;
        }
    };

    // Convert from dd-MM-yyyy to yyyy-MM-dd for input fields
    const convertToInputFormat = (dateStr) => {
        if (!dateStr) return '';
        try {
            const [day, month, year] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
        } catch (err) {
            console.log(err);

            return '';
        }
    };

    // Convert from yyyy-MM-dd to dd-MM-yyyy
    const convertToDisplayFormat = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = parseISO(dateStr);
            return isValid(date) ? format(date, 'dd-MM-yyyy') : '';
        } catch (err) {
            console.log(err);
            return '';
        }
    };

    // Validate date range
    const validateDateRange = (fromDate, toDate) => {
        if (fromDate && toDate) {
            const from = parseDateFromDDMMYYYY(fromDate);
            const to = parseDateFromDDMMYYYY(toDate);

            if (from && to && isAfter(from, to)) {
                setDateError('To date cannot be earlier than From date');
                return false;
            }
        }
        setDateError('');
        return true;
    };

    // Set default dates (last 30 days)
    const setDefaultDates = () => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        return {
            fromDate: format(thirtyDaysAgo, 'dd-MM-yyyy'),
            toDate: format(today, 'dd-MM-yyyy')
        };
    };

    const fetchBills = async () => {
        try {
            setLoading(true);
            setError(null);

            const apiUrl = getApiUrl();
            console.log('Fetching bills from:', apiUrl);

            const response = await axios.get(apiUrl, {
                timeout: 15000,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.result) {
                const formattedBills = response.data.result.map(bill => {
                    const dateObj = parseDateString(bill.QuotationDate);
                    const billAmount = floorValue(bill.BillAmount);
                    const receivedAmount = floorValue(bill.ReceivedAmount);
                    const balance = floorValue(bill.Balance);
                    const discount = floorValue(bill.Discount);
                    const tds = floorValue(bill.TDS);

                    return {
                        ...bill,
                        BillAmount: billAmount,
                        Balance: balance,
                        ReceivedAmount: receivedAmount,
                        Discount: discount,
                        TDS: tds,
                        formattedDate: dateObj,
                        formattedDateDisplay: formatDateDisplay(dateObj),
                        formattedTimeDisplay: formatTimeDisplay(dateObj),
                        paymentPercentage: billAmount > 0
                            ? Math.floor((receivedAmount / billAmount) * 100)
                            : 0,
                        isOverdue: balance > 0 && isBefore(dateObj, addDays(new Date(), -30))
                    };
                });

                setBills(formattedBills);
                setFilteredBills(formattedBills);
            } else {
                throw new Error('No data received from server');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch bills. Please try again later.';
            setError(errorMsg);
            console.error('Error fetching bills:', err);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!bills.length) return;

        let filtered = [...bills];

        // Date filter - only apply if loadAll is false
        if (!filters.loadAll) {
            if (filters.fromDate) {
                const fromDate = parseDateFromDDMMYYYY(filters.fromDate);
                if (fromDate) {
                    const fromDateStart = startOfDay(fromDate);
                    filtered = filtered.filter(bill =>
                        isAfter(bill.formattedDate, fromDateStart) ||
                        formatDateDisplay(bill.formattedDate) === filters.fromDate
                    );
                }
            }

            if (filters.toDate) {
                const toDate = parseDateFromDDMMYYYY(filters.toDate);
                if (toDate) {
                    const toDateEnd = endOfDay(toDate);
                    filtered = filtered.filter(bill =>
                        isBefore(bill.formattedDate, toDateEnd) ||
                        formatDateDisplay(bill.formattedDate) === filters.toDate
                    );
                }
            }
        }

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(bill =>
                bill.Status.toLowerCase() === filters.status.toLowerCase()
            );
        }

        // Search filter
        if (filters.searchTerm.trim()) {
            const term = filters.searchTerm.toLowerCase().trim();
            filtered = filtered.filter(bill =>
                bill.PartyName?.toLowerCase().includes(term) ||
                bill.QuotationNo?.toLowerCase().includes(term) ||
                bill.FunctionName?.toLowerCase().includes(term) ||
                bill.BillingCompany?.toLowerCase().includes(term) ||
                bill.InvoiceId?.toString().includes(term)
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (filters.sortBy) {
                case 'date':
                    aValue = a.formattedDate;
                    bValue = b.formattedDate;
                    break;
                case 'amount':
                    aValue = a.BillAmount;
                    bValue = b.BillAmount;
                    break;
                case 'balance':
                    aValue = a.Balance;
                    bValue = b.Balance;
                    break;
                case 'name':
                    aValue = a.PartyName;
                    bValue = b.PartyName;
                    break;
                case 'received':
                    aValue = a.ReceivedAmount;
                    bValue = b.ReceivedAmount;
                    break;
                case 'overdue':
                    aValue = a.isOverdue ? 1 : 0;
                    bValue = b.isOverdue ? 1 : 0;
                    break;
                default:
                    aValue = a.formattedDate;
                    bValue = b.formattedDate;
            }

            if (aValue instanceof Date) {
                return filters.sortOrder === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            } else if (typeof aValue === 'string') {
                return filters.sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                return filters.sortOrder === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }
        });

        setFilteredBills(filtered);
    };

    const handleFilterChange = (newFilters) => {
        // Validate dates if changing date filters
        if ((newFilters.fromDate !== undefined || newFilters.toDate !== undefined) && !newFilters.loadAll) {
            const fromDate = newFilters.fromDate !== undefined ? newFilters.fromDate : filters.fromDate;
            const toDate = newFilters.toDate !== undefined ? newFilters.toDate : filters.toDate;

            if (!validateDateRange(fromDate, toDate)) {
                return; // Don't update if validation fails
            }
        }

        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        handleFilterChange({ searchTerm: value });
    };

    const clearSearch = () => {
        setSearchInput('');
        handleFilterChange({ searchTerm: '' });
    };

    const clearAllFilters = () => {
        const defaultDates = setDefaultDates();
        setFilters({
            ...filters,
            fromDate: defaultDates.fromDate,
            toDate: defaultDates.toDate,
            status: 'all',
            searchTerm: '',
            sortBy: 'date',
            sortOrder: 'desc',
            loadAll: false
        });
        setSearchInput('');
        setDateError('');
    };

    const toggleLoadAll = () => {
        const newLoadAllState = !filters.loadAll;
        handleFilterChange({
            loadAll: newLoadAllState,
            ...(newLoadAllState ? { fromDate: '', toDate: '' } : {})
        });
        setDateError('');
    };

    const closeBillModal = () => {
        setShowBillModal(false);
        setSelectedBill(null);
    };

    // Delete popup functions
    const openDeletePopup = (bill) => {
        setDeletePopup({
            isOpen: true,
            bill: bill,
            reason: "",
            loading: false
        });
    };

    const closeDeletePopup = () => {
        setDeletePopup({
            isOpen: false,
            bill: null,
            reason: "",
            loading: false
        });
    };

    const handleDeleteConfirm = async () => {
        const bill = deletePopup.bill;
        const reason = deletePopup.reason?.trim() || "";

        if (!bill || reason.length < 3) {
            toast.error("Please provide a reason for deletion (minimum 3 characters)");
            return;
        }

        const billId = String(bill.QuotationId);
        const billNo = bill.QuotationNo;

        // Optimistically remove the bill from UI
        setBills((prevBills) =>
            prevBills.filter(
                (b) => String(b.QuotationId) !== billId
            )
        );

        setDeletePopup((prev) => ({ ...prev, loading: true }));

        try {
            const apiUrl = `/banquetapi/delete_or_active_inv.php?quot_id=${billId}&action=delete&cancel_reason=${encodeURIComponent(
                reason
            )}`;

            console.log("Deleting bill with URL:", apiUrl);

            const response = await fetch(apiUrl, {
                method: "GET",
            });

            const result = await response.text();
            console.log("Delete response:", result);

            if (!response.ok) {
                throw new Error("Failed to delete bill");
            }

            toast.success(`Bill #${billNo} deleted successfully!`);

            closeDeletePopup();
            fetchBills();
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Failed to delete bill");

            // Rollback
            setBills((prevBills) => {
                const alreadyThere = prevBills.some(
                    (b) => String(b.QuotationId) === billId
                );
                if (alreadyThere) return prevBills;
                return [...prevBills, bill];
            });

            setDeletePopup((prev) => ({ ...prev, loading: false }));
        }
    };

    // Handle keyboard shortcuts for delete popup
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (deletePopup.isOpen) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    handleDeleteConfirm();
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    closeDeletePopup();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [deletePopup]);

    const getStatusBadge = (status) => {
        const statusClass = `status-badge ${status.toLowerCase()}`;
        return <span className={statusClass}>{status}</span>;
    };

    // Calculate statistics
    const stats = useMemo(() => {
        return {
            totalBills: filteredBills.length,
            totalAmount: floorValue(filteredBills.reduce((sum, bill) => sum + bill.BillAmount, 0)),
            totalBalance: floorValue(filteredBills.reduce((sum, bill) => sum + bill.Balance, 0)),
            totalReceived: floorValue(filteredBills.reduce((sum, bill) => sum + bill.ReceivedAmount, 0)),
            totalDiscount: floorValue(filteredBills.reduce((sum, bill) => sum + bill.Discount, 0)),
            totalTDS: floorValue(filteredBills.reduce((sum, bill) => sum + bill.TDS, 0)),
            confirmedCount: filteredBills.filter(bill => bill.Status.toLowerCase() === 'confirmed').length,
            tentativeCount: filteredBills.filter(bill => bill.Status.toLowerCase() === 'tentative').length,
            waitlistedCount: filteredBills.filter(bill => bill.Status.toLowerCase() === 'waitlisted').length,
            overdueCount: filteredBills.filter(bill => bill.isOverdue).length,
            avgBalance: filteredBills.length > 0
                ? floorValue(filteredBills.reduce((sum, bill) => sum + bill.Balance, 0) / filteredBills.length)
                : 0,
            collectionRate: filteredBills.reduce((sum, bill) => sum + bill.BillAmount, 0) > 0
                ? Math.floor((filteredBills.reduce((sum, bill) => sum + bill.ReceivedAmount, 0) /
                    filteredBills.reduce((sum, bill) => sum + bill.BillAmount, 0)) * 100)
                : 0
        };
    }, [filteredBills]);

    const hasActiveFilters = () => {
        return filters.fromDate || filters.toDate || filters.status !== 'all' || filters.searchTerm || filters.loadAll;
    };

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const handleHotelChange = (newHotelId) => {
        setHotelId(newHotelId);
        // Save to localStorage for persistence
        localStorage.setItem('currentHotelId', newHotelId);
        // Find selected hotel object
        const hotel = hotels.find(h => h.id === newHotelId);
        setSelectedHotel(hotel);
    };

    if (loading) {
        return (
            <div className="unsettled-bill">
                <Header />
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading unsettled bills...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="unsettled-bill">
                <Header />
                <div className="error-container">
                    <AlertCircle size={48} />
                    <h2>Error Loading Data</h2>
                    <p>{error}</p>
                    <button onClick={fetchBills} className="retry-button">
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="unsettled-bill">
                {/* Delete Confirmation Popup */}
                {deletePopup.isOpen && (
                    <div className="delete-popup-overlay">
                        <div className="delete-popup">
                            <div className="popup-header">
                                <h3>Delete Bill</h3>
                                <button
                                    onClick={closeDeletePopup}
                                    className="btn-close"
                                    disabled={deletePopup.loading}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="popup-content">
                                <div className="warning-message">
                                    <Trash size={18} className="warning-icon" />
                                    <p>
                                        You are about to delete bill{" "}
                                        <strong>{deletePopup.bill?.QuotationNo}</strong> for{" "}
                                        <strong>{deletePopup.bill?.PartyName}</strong>.
                                    </p>
                                    <p className="warning-subtext">
                                        Amount: {formatCurrency(deletePopup.bill?.BillAmount || 0)} |
                                        Balance: {formatCurrency(deletePopup.bill?.Balance || 0)}
                                    </p>
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
                                        autoFocus
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
                                            <RefreshCw size={16} className="spinning" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash size={16} />
                                            Delete Bill
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="dashboard-container">
                    {/* Hotel Selector - New Component */}
                    {hotels.length > 0 && (
                        <div className="hotel-selector">
                            <Hotel size={16} />
                            <select
                                value={hotelId}
                                onChange={(e) => handleHotelChange(e.target.value)}
                                className="hotel-select"
                            >
                                {hotels.map(hotel => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.name || `Hotel ${hotel.id}`}
                                    </option>
                                ))}
                            </select>
                            {selectedHotel && (
                                <span className="hotel-info">
                                    {selectedHotel.address || `ID: ${selectedHotel.id}`}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Mobile Filter Toggle Button */}
                    {isMobile && (
                        <button
                            className="mobile-filter-toggle"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={16} />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                            <ChevronRight size={16} className={showFilters ? 'flipped' : ''} />
                        </button>
                    )}

                    <div className="dashboard-layout">
                        {/* Filter Panel - Sidebar */}
                        <div className={`filter-panel ${showFilters ? 'visible' : 'hidden'}`}>
                            <div className="panel-header">
                                <h3>
                                    <SlidersHorizontal size={18} />
                                    Filters
                                </h3>
                                {isMobile && (
                                    <button
                                        className="close-filters"
                                        onClick={() => setShowFilters(false)}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="panel-content">
                                {/* Quick Stats */}
                                <div className="quick-stats">
                                    <div className="stat-item">
                                        <FileText size={14} />
                                        <span className="stat-label">Total</span>
                                        <span className="stat-value">{stats.totalBills}</span>
                                    </div>
                                    <div className="stat-item">
                                        <DollarSign size={14} />
                                        <span className="stat-label">Outstanding</span>
                                        <span className="stat-value">{formatCurrency(stats.totalBalance)}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Percent size={14} />
                                        <span className="stat-label">Collected</span>
                                        <span className="stat-value">{stats.collectionRate}%</span>
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="search-section">
                                    <label className="section-label">
                                        <Search size={14} />
                                        Search
                                    </label>
                                    <div className="search-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Search bills..."
                                            value={searchInput}
                                            onChange={handleSearchChange}
                                            className="search-input"
                                        />
                                        {searchInput && (
                                            <button className="clear-search" onClick={clearSearch}>
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Date Filters */}
                                <div className="filter-section">
                                    <label className="section-label">
                                        <Calendar size={14} />
                                        Date Range
                                    </label>

                                    <div className="load-all-toggle">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={filters.loadAll}
                                                onChange={toggleLoadAll}
                                            />
                                            <span className="toggle-label">
                                                <CalendarOff size={14} />
                                                Load All Records
                                            </span>
                                        </label>
                                    </div>

                                    {!filters.loadAll && (
                                        <>
                                            <div className="date-input-group">
                                                <label>From Date</label>
                                                <input
                                                    type="date"
                                                    value={convertToInputFormat(filters.fromDate)}
                                                    onChange={(e) => handleFilterChange({
                                                        fromDate: convertToDisplayFormat(e.target.value)
                                                    })}
                                                    className="date-input"
                                                />
                                            </div>
                                            <div className="date-input-group">
                                                <label>To Date</label>
                                                <input
                                                    type="date"
                                                    value={convertToInputFormat(filters.toDate)}
                                                    onChange={(e) => handleFilterChange({
                                                        toDate: convertToDisplayFormat(e.target.value)
                                                    })}
                                                    className="date-input"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {dateError && (
                                        <div className="date-error">
                                            <AlertTriangle size={12} />
                                            <span>{dateError}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Status Filter */}
                                <div className="filter-section">
                                    <label className="section-label">Status</label>
                                    <div className="status-buttons">
                                        <button
                                            className={`status-btn ${filters.status === 'all' ? 'active' : ''}`}
                                            onClick={() => handleFilterChange({ status: 'all' })}
                                        >
                                            All
                                        </button>
                                        <button
                                            className={`status-btn confirmed ${filters.status === 'confirmed' ? 'active' : ''}`}
                                            onClick={() => handleFilterChange({ status: 'confirmed' })}
                                        >
                                            <CheckCircle size={12} />
                                            Confirmed
                                        </button>
                                        <button
                                            className={`status-btn tentative ${filters.status === 'tentative' ? 'active' : ''}`}
                                            onClick={() => handleFilterChange({ status: 'tentative' })}
                                        >
                                            <Clock size={12} />
                                            Tentative
                                        </button>
                                        <button
                                            className={`status-btn waitlisted ${filters.status === 'waitlisted' ? 'active' : ''}`}
                                            onClick={() => handleFilterChange({ status: 'waitlisted' })}
                                        >
                                            <Users size={12} />
                                            Waitlisted
                                        </button>
                                    </div>
                                </div>

                                {/* Sort Options */}
                                <div className="filter-section">
                                    <label className="section-label">Sort By</label>
                                    <div className="sort-options">
                                        <select
                                            value={filters.sortBy}
                                            onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                                            className="sort-select"
                                        >
                                            <option value="date">Date</option>
                                            <option value="amount">Amount</option>
                                            <option value="balance">Balance</option>
                                            <option value="name">Party Name</option>
                                            <option value="received">Received Amount</option>
                                            <option value="overdue">Overdue Status</option>
                                        </select>
                                        <button
                                            className="sort-order-btn"
                                            onClick={() => handleFilterChange({
                                                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
                                            })}
                                        >
                                            {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="filter-actions">
                                    <button
                                        className="btn btn-primary apply-btn"
                                        onClick={applyFilters}
                                    >
                                        <Filter size={14} />
                                        Apply Filters
                                    </button>
                                    {hasActiveFilters() && (
                                        <button
                                            className="btn btn-secondary clear-btn"
                                            onClick={clearAllFilters}
                                        >
                                            <X size={14} />
                                            Clear All
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-refresh"
                                        onClick={fetchBills}
                                    >
                                        <RefreshCw size={14} />
                                        Refresh
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="main-content">
                            {/* Header Bar */}
                            <div className="content-header">
                                <div className="header-left">
                                    <h2>Unsettled Bills</h2>
                                    <span className="results-badge">
                                        {filteredBills.length} bills
                                        {stats.overdueCount > 0 && (
                                            <span className="overdue-count">
                                                <AlertTriangle size={12} />
                                                {stats.overdueCount} overdue
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="header-right">
                                    <div className="header-stats">
                                        <div className="header-stat">
                                            <span className="stat-label">Total Amount</span>
                                            <span className="stat-value">{formatCurrency(stats.totalAmount)}</span>
                                        </div>
                                        <div className="header-stat highlight">
                                            <span className="stat-label">Outstanding</span>
                                            <span className="stat-value">{formatCurrency(stats.totalBalance)}</span>
                                        </div>
                                        <div className="header-stat">
                                            <span className="stat-label">Collection Rate</span>
                                            <span className="stat-value">{stats.collectionRate}%</span>
                                        </div>
                                    </div>
                                    {!isMobile && (
                                        <button
                                            className="btn btn-icon"
                                            onClick={() => setShowFilters(!showFilters)}
                                            title={showFilters ? "Hide Filters" : "Show Filters"}
                                        >
                                            <SlidersHorizontal size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Bills Table */}
                            <div className="table-container">
                                {filteredBills.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="bills-table">
                                            <thead>
                                                <tr>
                                                    <th width="50"></th>
                                                    <th width="80">Inv No.</th>
                                                    <th width="100">Invoice Date</th>
                                                    <th width="120">Party Name</th>
                                                    <th width="100">Inv Amt</th>
                                                    <th width="80">Discount</th>
                                                    <th width="80">TDS</th>
                                                    <th width="120">Received Amt</th>
                                                    <th width="120">Balance Amt</th>
                                                    <th width="100">Status</th>
                                                    <th width="80">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredBills.map((bill) => (
                                                    <tr key={bill.QuotationId} className={`bill-row ${bill.Status.toLowerCase()} ${bill.isOverdue ? 'overdue' : ''}`}>
                                                        <td>
                                                            <button className="btn-icon-sm">
                                                                <Edit size={14} />
                                                            </button>
                                                        </td>
                                                        <td>
                                                            <div className="invoice-cell">
                                                                <div className="invoice-no">{bill.QuotationNo}</div>
                                                                {bill.isOverdue && (
                                                                    <div className="overdue-badge">Overdue</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="date-cell">
                                                                <div className="date-display">{bill.formattedDateDisplay}</div>
                                                                <div className="time-display">{bill.formattedTimeDisplay}</div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="party-cell">
                                                                <div className="party-names">{bill.PartyName}</div>
                                                                {bill.BillingCompany && (
                                                                    <div className="company-name">
                                                                        <Building size={10} />
                                                                        {bill.BillingCompany}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="amount-cell total">
                                                                {formatCurrency(bill.BillAmount)}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="amount-cell discount">
                                                                {formatCurrency(bill.Discount)}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="amount-cell tds">
                                                                {formatCurrency(bill.TDS)}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="amount-cell received">
                                                                {formatCurrency(bill.ReceivedAmount)}
                                                                <div className="progress-container">
                                                                    <div className="progress-bar">
                                                                        <div
                                                                            className={`progress-fill ${bill.paymentPercentage >= 100 ? 'complete' : bill.paymentPercentage >= 50 ? 'partial' : 'low'}`}
                                                                            style={{ width: `${Math.min(bill.paymentPercentage, 100)}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="progress-text">{bill.paymentPercentage}%</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="amount-cell balance highlight">
                                                                {formatCurrency(bill.Balance)}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="status-cell">
                                                                {getStatusBadge(bill.Status)}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="actions-cell">
                                                                <button
                                                                    className="btn-action view"
                                                                    onClick={() => {
                                                                        setSelectedBill(bill);
                                                                        setShowBillModal(true);
                                                                    }}
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>
                                                                <button
                                                                    className="btn-action delete"
                                                                    onClick={() => openDeletePopup(bill)}
                                                                    title="Delete Bill"
                                                                >
                                                                    <Trash size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <FileText size={48} />
                                        <h3>No unsettled bills found</h3>
                                        <p>Try adjusting your filters or search criteria</p>
                                        {hasActiveFilters() && (
                                            <button className="btn btn-primary" onClick={clearAllFilters}>
                                                Clear all filters
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer Summary */}
                            <div className="footer-summary">
                                <div className="summary-section">
                                    <h4>Summary</h4>
                                    <div className="summary-grid">
                                        <div className="summary-item">
                                            <span className="label">Total Invoices:</span>
                                            <span className="value">{stats.totalBills}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="label">Confirmed:</span>
                                            <span className="value">{stats.confirmedCount}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="label">Tentative:</span>
                                            <span className="value">{stats.tentativeCount}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="label">Total Amount:</span>
                                            <span className="value">{formatCurrency(stats.totalAmount)}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="label">Total Received:</span>
                                            <span className="value received">{formatCurrency(stats.totalReceived)}</span>
                                        </div>
                                        <div className="summary-item highlight">
                                            <span className="label">Total Outstanding:</span>
                                            <span className="value balance">{formatCurrency(stats.totalBalance)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bill Detail Modal */}
                {showBillModal && selectedBill && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Bill Details - {selectedBill.QuotationNo}</h3>
                                <button className="modal-close" onClick={closeBillModal}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="bill-details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Invoice Date:</span>
                                        <span className="detail-value">{selectedBill.formattedDateDisplay}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Time:</span>
                                        <span className="detail-value">{selectedBill.formattedTimeDisplay}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Party Name:</span>
                                        <span className="detail-value">{selectedBill.PartyName}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Function:</span>
                                        <span className="detail-value">{selectedBill.FunctionName || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Status:</span>
                                        <span className="detail-value">{getStatusBadge(selectedBill.Status)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Company Name:</span>
                                        <span className="detail-value">{selectedBill.BillingCompany}</span>
                                    </div>
                                    <div className="detail-item amount">
                                        <span className="detail-label">Invoice Amount:</span>
                                        <span className="detail-value">{formatCurrency(selectedBill.BillAmount)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Discount:</span>
                                        <span className="detail-value">{formatCurrency(selectedBill.Discount)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">TDS:</span>
                                        <span className="detail-value">{formatCurrency(selectedBill.TDS)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Received Amount:</span>
                                        <span className="detail-value received">{formatCurrency(selectedBill.ReceivedAmount)}</span>
                                    </div>
                                    <div className="detail-item highlight">
                                        <span className="detail-label">Balance Amount:</span>
                                        <span className="detail-value balance">{formatCurrency(selectedBill.Balance)}</span>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn btn-secondary" onClick={closeBillModal}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    /* ========== BASE STYLES ========== */
                    .unsettled-bill {
                        min-height: 100vh;
                        background: #f8fafc;
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }

                    .dashboard-container {
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 20px;
                    }

                    /* ========== HOTEL SELECTOR ========== */
                    .hotel-selector {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        background: white;
                        padding: 12px 16px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                        border: 1px solid #e2e8f0;
                    }

                    .hotel-select {
                        padding: 6px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        background: white;
                        min-width: 200px;
                    }

                    .hotel-info {
                        font-size: 0.75rem;
                        color: #6b7280;
                        margin-left: auto;
                    }

                    /* ========== MOBILE FILTER TOGGLE ========== */
                    .mobile-filter-toggle {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        width: 100%;
                        padding: 12px;
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        margin-bottom: 16px;
                        font-weight: 500;
                        color: #4f46e5;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .mobile-filter-toggle:hover {
                        background: #f8fafc;
                        border-color: #4f46e5;
                    }

                    .mobile-filter-toggle .flipped {
                        transform: rotate(90deg);
                    }

                    /* ========== DASHBOARD LAYOUT ========== */
                    .dashboard-layout {
                        display: flex;
                        gap: 20px;
                        height: calc(100vh - 160px);
                    }

                    @media (max-width: 1023px) {
                        .dashboard-layout {
                            flex-direction: column;
                            height: auto;
                        }
                    }

                    /* ========== FILTER PANEL ========== */
                    .filter-panel {
                        width: 320px;
                        background: white;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                        transition: transform 0.3s ease;
                    }

                    @media (max-width: 1023px) {
                        .filter-panel {
                            width: 100%;
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            z-index: 1000;
                            border-radius: 0;
                            transform: translateX(-100%);
                        }

                        .filter-panel.visible {
                            transform: translateX(0);
                        }

                        .filter-panel.hidden {
                            display: none;
                        }
                    }

                    .panel-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px 20px;
                        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                        color: white;
                    }

                    .panel-header h3 {
                        margin: 0;
                        font-size: 1rem;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .close-filters {
                        background: rgba(255, 255, 255, 0.1);
                        border: none;
                        color: white;
                        padding: 6px;
                        border-radius: 6px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .panel-content {
                        padding: 20px;
                        overflow-y: auto;
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                    }

                    /* Quick Stats */
                    .quick-stats {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 12px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                    }

                    .stat-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        gap: 4px;
                    }

                    .stat-item svg {
                        color: #4f46e5;
                    }

                    .stat-label {
                        font-size: 0.7rem;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .stat-value {
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: #1f2937;
                    }

                    /* Filter Sections */
                    .section-label {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: #374151;
                        margin-bottom: 12px;
                    }

                    .search-section,
                    .filter-section {
                        background: #f8fafc;
                        padding: 16px;
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                    }

                    /* Search Input */
                    .search-input-wrapper {
                        position: relative;
                    }

                    .search-input {
                        width: 100%;
                        padding: 10px 40px 10px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        transition: all 0.2s;
                    }

                    .search-input:focus {
                        outline: none;
                        border-color: #4f46e5;
                        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                    }

                    .clear-search {
                        position: absolute;
                        right: 12px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: none;
                        border: none;
                        color: #9ca3af;
                        cursor: pointer;
                        padding: 4px;
                    }

                    /* Load All Toggle */
                    .load-all-toggle {
                        margin-bottom: 16px;
                    }

                    .load-all-toggle label {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                        font-size: 0.875rem;
                        color: #4b5563;
                    }

                    .toggle-label {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    /* Date Inputs */
                    .date-input-group {
                        margin-bottom: 12px;
                    }

                    .date-input-group label {
                        display: block;
                        margin-bottom: 4px;
                        font-size: 0.75rem;
                        color: #6b7280;
                    }

                    .date-input {
                        width: 100%;
                        padding: 8px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 0.875rem;
                    }

                    .date-error {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        background: #fef2f2;
                        color: #dc2626;
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 0.75rem;
                        margin-top: 8px;
                    }

                    /* Status Buttons */
                    .status-buttons {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                    }

                    .status-btn {
                        padding: 8px 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        background: white;
                        font-size: 0.75rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 4px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .status-btn.active {
                        border-color: #4f46e5;
                        background: #4f46e5;
                        color: white;
                    }

                    .status-btn.confirmed.active {
                        border-color: #059669;
                        background: #059669;
                    }

                    .status-btn.tentative.active {
                        border-color: #d97706;
                        background: #d97706;
                    }

                    .status-btn.waitlisted.active {
                        border-color: #7c3aed;
                        background: #7c3aed;
                    }

                    /* Sort Options */
                    .sort-options {
                        display: flex;
                        gap: 8px;
                    }

                    .sort-select {
                        flex: 1;
                        padding: 8px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 0.875rem;
                    }

                    .sort-order-btn {
                        padding: 8px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        background: white;
                        font-size: 0.75rem;
                        cursor: pointer;
                        min-width: 70px;
                    }

                    /* Filter Actions */
                    .filter-actions {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        margin-top: auto;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                    }

                    .apply-btn, .clear-btn, .btn-refresh {
                        width: 100%;
                        padding: 10px;
                        border: none;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.2s;
                    }

                    .apply-btn {
                        background: #4f46e5;
                        color: white;
                    }

                    .apply-btn:hover {
                        background: #4338ca;
                    }

                    .clear-btn {
                        background: #f3f4f6;
                        color: #4b5563;
                        border: 1px solid #d1d5db;
                    }

                    .clear-btn:hover {
                        background: #e5e7eb;
                    }

                    .btn-refresh {
                        background: #10b981;
                        color: white;
                    }

                    .btn-refresh:hover {
                        background: #059669;
                    }

                    /* ========== MAIN CONTENT ========== */
                    .main-content {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                        min-width: 0; /* For responsive table */
                    }

                    /* Content Header */
                    .content-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: white;
                        padding: 16px 20px;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    }

                    .header-left {
                        display: flex;
                        align-items: center;

                        gap: 16px;
                    }

                    .header-left h2 {
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #111827;
                    }

                    .results-badge {
                        background: #f3f4f6;
                        color: #6b7280;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .overdue-count {
                        background: #fef2f2;
                        color: #dc2626;
                        padding: 2px 8px;
                        border-radius: 12px;
                        margin-left: 4px;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .header-right {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                    }

                    .header-stats {
                        display: flex;
                        gap: 20px;
                    }

                    .header-stat {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                    }

                    .header-stat .stat-label {
                        font-size: 0.75rem;
                        color: #6b7280;
                        margin-bottom: 2px;
                    }

                    .header-stat .stat-value {
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: #111827;
                    }

                    .header-stat.highlight .stat-value {
                        color: #dc2626;
                    }

                    .btn-icon {
                        background: #f3f4f6;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        padding: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    }

                    .btn-icon:hover {
                        background: #e5e7eb;
                    }

                    /* Table Container */
                    .table-container {
                        flex: 1;
                        background: white;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        // overflow: hidden;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    }

                    .table-responsive {
                        overflow-x: auto;
                        max-height: calc(100vh - 50px);
                    }

                    /* Table Styles */
                    .bills-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 0.75rem;
                    }

                    .bills-table thead {
                        background: #f9fafb;
                        position: sticky;
                        top: 0;
                        z-index: 10;
                    }

                    .bills-table th {
                        padding: 12px 16px;
                        text-align: left;
                        font-weight: 600;
                        color: #374151;
                        border-bottom: 1px solid #e5e7eb;
                        white-space: nowrap;
                        font-size: 0.7rem;
                        letter-spacing: 0.05em;
                    }

                    .bills-table tbody tr {
                        border-bottom: 1px solid #f3f4f6;
                        transition: background-color 0.2s;
                    }

                    .bills-table tbody tr:hover {
                        background: #f9fafb;
                    }

                    .bills-table td {
                        padding: 12px 16px;
                        vertical-align: middle;
                    }

                    /* Table Cells */
                    .btn-icon-sm {
                        background: none;
                        border: none;
                        color: #6b7280;
                        cursor: pointer;
                        padding: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .btn-icon-sm:hover {
                        color: #4f46e5;
                    }

                    .invoice-cell {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .invoice-no {
                        font-weight: 600;
                        color: #111827;
                    }

                    .overdue-badge {
                        background: #fef2f2;
                        color: #dc2626;
                        padding: 1px 6px;
                        border-radius: 4px;
                        font-size: 0.65rem;
                        font-weight: 500;
                    }

                    .date-cell {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .date-display {
                        font-weight: 500;
                        color: #111827;
                    }

                    .time-display {
                        color: #6b7280;
                        font-size: 0.7rem;
                    }

                    .party-cell {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .party-names {
                        font-weight: 500;
                        color: #111827;
                        line-height: 1.3;
                    }

                    .company-name {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        color: #6b7280;
                        font-size: 0.7rem;
                    }

                    /* Amount Cells */
                    .amount-cell {
                        font-weight: 600;
                        font-size: 0.75rem;
                    }

                    .amount-cell.total {
                        color: #111827;
                    }

                    .amount-cell.discount {
                        color: #d97706;
                    }

                    .amount-cell.tds {
                        color: #7c3aed;
                    }

                    .amount-cell.received {
                        color: #059669;
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .amount-cell.balance.highlight {
                        color: #dc2626;
                        font-weight: 700;
                    }

                    .progress-container {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .progress-bar {
                        flex: 1;
                        height: 4px;
                        background: #e5e7eb;
                        border-radius: 2px;
                        overflow: hidden;
                    }

                    .progress-fill {
                        height: 100%;
                        border-radius: 2px;
                    }

                    .progress-fill.complete {
                        background: #10b981;
                    }

                    .progress-fill.partial {
                        background: #f59e0b;
                    }

                    .progress-fill.low {
                        background: #ef4444;
                    }

                    .progress-text {
                        font-size: 0.65rem;
                        color: #6b7280;
                        min-width: 20px;
                        text-align: right;
                    }

                    /* Status Cell */
                    .status-cell {
                        display: flex;
                        align-items: center;
                    }

                    .status-badge {
                        padding: 3px 8px;
                        border-radius: 12px;
                        font-size: 0.65rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        min-width: 70px;
                        text-align: center;
                    }

                    .status-badge.confirmed {
                        background: #d1fae5;
                        color: #065f46;
                    }

                    .status-badge.tentative {
                        background: #fef3c7;
                        color: #92400e;
                    }

                    .status-badge.waitlisted {
                        background: #ede9fe;
                        color: #5b21b6;
                    }

                    /* Actions Cell */
                    .actions-cell {
                        display: flex;
                        gap: 4px;
                    }

                    .btn-action {
                        width: 28px;
                        height: 28px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    }

                    .btn-action.view {
                        background: #e0e7ff;
                        color: #4f46e5;
                    }

                    .btn-action.view:hover {
                        background: #c7d2fe;
                    }

                    .btn-action.delete {
                        background: #fee2e2;
                        color: #dc2626;
                    }

                    .btn-action.delete:hover {
                        background: #fecaca;
                    }

                    /* Footer Summary */
                    .footer-summary {
                        background: white;
                        border-radius: 12px;
                        padding: 16px;
                        border: 1px solid #e2e8f0;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    }

                    .summary-section h4 {
                        margin: 0 0 12px 0;
                        color: #111827;
                        font-size: 0.875rem;
                        font-weight: 600;
                    }

                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 12px;
                    }

                    .summary-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 12px;
                        background: #f9fafb;
                        border-radius: 6px;
                        border: 1px solid #e5e7eb;
                    }

                    .summary-item .label {
                        font-size: 0.75rem;
                        color: #6b7280;
                    }

                    .summary-item .value {
                        font-size: 0.75rem;
                        font-weight: 600;
                        color: #111827;
                    }

                    .summary-item .value.received {
                        color: #059669;
                    }

                    .summary-item .value.balance {
                        color: #dc2626;
                    }

                    .summary-item.highlight {
                        background: #fef2f2;
                        border-color: #fecaca;
                    }

                    /* Empty State */
                    .empty-state {
                        padding: 60px 20px;
                        text-align: center;
                        color: #6b7280;
                    }

                    .empty-state svg {
                        color: #d1d5db;
                        margin-bottom: 16px;
                    }

                    .empty-state h3 {
                        color: #374151;
                        margin-bottom: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                    }

                    .empty-state p {
                        font-size: 0.875rem;
                        margin-bottom: 20px;
                    }

                    /* Delete Popup Styles (keep from previous implementation) */
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
                        z-index: 2000;
                        padding: 20px;
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
                        padding: 20px 24px;
                        border-bottom: 1px solid #e2e8f0;
                        background: #fef2f2;
                    }

                    .popup-header h3 {
                        margin: 0;
                        color: #dc2626;
                        font-size: 18px;
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

                    .popup-content {
                        padding: 24px;
                    }

                    .warning-message {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        margin-bottom: 20px;
                        padding: 16px;
                        background: #fef2f2;
                        border-radius: 8px;
                        border-left: 4px solid #dc2626;
                    }

                    .reason-input-group {
                        margin-bottom: 8px;
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

                    .popup-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        padding: 20px 24px;
                        border-top: 1px solid #e2e8f0;
                        background: #f8fafc;
                    }

                    .btn-cancel {
                        background: #6b7280;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.3s ease;
                    }

                    .btn-delete-confirm {
                        background: #dc2626;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    /* Modal Styles (keep from previous) */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 20px;
                    }

                    .modal-content {
                        background: white;
                        border-radius: 8px;
                        width: 100%;
                        max-width: 600px;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px 20px;
                        border-bottom: 1px solid #e2e8f0;
                    }

                    .bill-details-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                        margin-bottom: 20px;
                        padding: 20px;
                    }

                    /* Loading & Error States */
                    .loading-container,
                    .error-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 60px 20px;
                        text-align: center;
                    }

                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid #e2e8f0;
                        border-top-color: #4f46e5;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 12px;
                    }

                    .error-container svg {
                        color: #ef4444;
                        margin-bottom: 12px;
                    }

                    .retry-button {
                        padding: 8px 16px;
                        background: #4f46e5;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 0.875rem;
                    }

                    /* Responsive Design */
                    @media (max-width: 1400px) {
                        .filter-panel {
                            width: 280px;
                        }
                        
                        .header-stats {
                            gap: 16px;
                        }
                    }

                    @media (max-width: 1200px) {
                        .summary-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        
                        .bills-table {
                            font-size: 0.7rem;
                        }
                        
                        .bills-table th,
                        .bills-table td {
                            padding: 10px 12px;
                        }
                    }

                    @media (max-width: 1023px) {
                        .dashboard-container {
                            padding: 16px;
                        }
                        
                        .hotel-selector {
                            flex-wrap: wrap;
                        }
                        
                        .header-stats {
                            display: none;
                        }
                        
                        .content-header {
                            padding: 12px 16px;
                        }
                        
                        .bills-table {
                            min-width: 1000px; /* Enable horizontal scroll on mobile */
                        }
                        
                        .summary-grid {
                            grid-template-columns: 1fr;
                        }
                    }

                    @media (max-width: 640px) {
                        .dashboard-container {
                            padding: 12px;
                        }
                        
                        .panel-content {
                            padding: 16px;
                        }
                        
                        .quick-stats {
                            grid-template-columns: 1fr;
                        }
                        
                        .status-buttons {
                            grid-template-columns: 1fr;
                        }
                        
                        .filter-actions {
                            position: sticky;
                            bottom: 0;
                            background: white;
                            margin: -20px -16px -16px;
                            padding: 16px;
                            border-top: 1px solid #e5e7eb;
                        }
                        
                        .delete-popup {
                            margin: 0 16px;
                        }
                        
                        .popup-actions {
                            flex-direction: column;
                        }
                        
                        .popup-actions button {
                            width: 100%;
                        }
                    }

                    @media (max-width: 480px) {
                        .content-header {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 12px;
                        }
                        
                        .header-right {
                            width: 100%;
                            justify-content: space-between;
                        }
                        
                        .modal-content {
                            margin: 0 12px;
                        }
                        
                        .bill-details-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

export default UnsettledBill;